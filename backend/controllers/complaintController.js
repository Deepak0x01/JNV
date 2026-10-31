const Complaint = require("../models/Complaint");
const Student = require("../models/Student");
const { nextSeq } = require("../models/Counter");
const httpError = require("../utils/httpError");

const list = async (req, res) => {
  const filter = req.user.userType === "student" ? { studentId: req.user.studentId } : {};
  const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
  res.json({ complaints });
};

const create = async (req, res) => {
  const student = await Student.findOne({ studentId: req.body.studentId });
  if (!student) throw httpError(404, "Student not found.");
  const complaintId = `C${String(await nextSeq("complaint")).padStart(3, "0")}`;
  const complaint = await Complaint.create({
    ...req.body,
    complaintId,
    student: student.name,
    roomNo: req.body.roomNo || student.roomNo,
    status: "Open",
    date: new Date().toISOString().slice(0, 10),
  });
  res.status(201).json({ message: "Complaint submitted.", complaint });
};
const createOwn = async (req, res) => {
  const student = await Student.findOne({ studentId: req.user.studentId });
  if (!student) throw httpError(404, "Your student record was not found. Please contact the admin.");
  const complaintId = `C${String(await nextSeq("complaint")).padStart(3, "0")}`;
  const complaint = await Complaint.create({
    ...req.body,
    complaintId,
    studentId: student.studentId,
    student: student.name,
    roomNo: student.roomNo,
    status: "Open",
    date: new Date().toISOString().slice(0, 10),
    byStudent: true,
  });
  res.status(201).json({ message: "Complaint submitted. The admin has been notified.", complaint });
};

const setStatus = async (req, res) => {
  const complaint = await Complaint.findOneAndUpdate(
    { complaintId: req.params.id },
    { status: req.body.status },
    { returnDocument: "after" }
  );
  if (!complaint) throw httpError(404, "Complaint not found.");
  res.json({ message: "Complaint updated.", complaint });
};

const remove = async (req, res) => {
  const complaint = await Complaint.findOneAndDelete({ complaintId: req.params.id });
  if (!complaint) throw httpError(404, "Complaint not found.");
  res.json({ message: "Complaint deleted." });
};

module.exports = { list, create, createOwn, setStatus, remove };
