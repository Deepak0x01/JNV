const Settings = require("../models/Settings");
const { getSettings } = require("../models/Settings");
const Student = require("../models/Student");
const Room = require("../models/Room");
const Allocation = require("../models/Allocation");
const Fee = require("../models/Fee");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const { setSeq } = require("../models/Counter");
const httpError = require("../utils/httpError");

const get = async (req, res) => {
  res.json({ settings: await getSettings() });
};

const update = async (req, res) => {
  const settings = await getSettings();
  settings.set(req.body);
  await settings.save();
  res.json({ message: "Settings saved.", settings });
};

const collections = {
  students: Student,
  rooms: Room,
  allocations: Allocation,
  fees: Fee,
  complaints: Complaint,
};

const backup = async (req, res) => {
  const data = {};
  for (const [name, Model] of Object.entries(collections)) data[name] = await Model.find().lean();
  data.settings = await Settings.find().lean();
  res.json({ app: "hostel-management", version: 1, exportedAt: new Date().toISOString(), data });
};

const maxSuffix = (docs, field) =>
  docs.reduce((max, d) => Math.max(max, parseInt(String(d[field]).replace(/\D/g, ""), 10) || 0), 0);

const restore = async (req, res) => {
  const { app, data } = req.body || {};
  if (app !== "hostel-management" || !data) throw httpError(400, "This is not a valid backup file.");
  for (const name of Object.keys(collections)) {
    if (!Array.isArray(data[name])) throw httpError(400, `Backup file is missing "${name}".`);
  }

  const docs = {};
  for (const [name, Model] of Object.entries(collections)) {
    docs[name] = data[name].map((d) => {
      const doc = new Model(d);
      const err = doc.validateSync();
      if (err) throw httpError(400, `Backup file has an invalid ${name} record: ${err.message}`);
      return doc.toObject();
    });
  }

  for (const [name, Model] of Object.entries(collections)) {
    await Model.deleteMany({});
    if (docs[name].length) await Model.insertMany(docs[name]);
  }
  if (Array.isArray(data.settings) && data.settings[0]) {
    await Settings.deleteMany({});
    await Settings.create({ ...data.settings[0], key: "main" });
  }
  await setSeq("student", maxSuffix(docs.students, "studentId"));
  await setSeq("complaint", maxSuffix(docs.complaints, "complaintId"));

  await User.deleteMany({
    userType: "student",
    studentId: { $nin: docs.students.map((s) => s.studentId) },
  });

  res.json({
    message: "Backup restored.",
    counts: Object.fromEntries(Object.keys(collections).map((n) => [n, docs[n].length])),
  });
};

module.exports = { get, update, backup, restore };
