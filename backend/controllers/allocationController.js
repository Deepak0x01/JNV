const Allocation = require("../models/Allocation");
const Student = require("../models/Student");
const { assignRoom, releaseStudent } = require("../services/occupancy");
const httpError = require("../utils/httpError");

const list = async (req, res) => {
  const allocations = await Allocation.find().sort({ date: -1, createdAt: -1 });
  res.json({ allocations });
};

const create = async (req, res) => {
  const { studentId, roomNo, date, notes } = req.body;
  const student = await Student.findOne({ studentId });
  if (!student) throw httpError(404, "Student not found.");
  await assignRoom(student, roomNo, { date, notes });
  const allocation = await Allocation.findOne({ studentId });
  res.status(201).json({ message: "Room allocated.", allocation });
};

const remove = async (req, res) => {
  const allocation = await Allocation.findById(req.params.id);
  if (!allocation) throw httpError(404, "Allocation not found.");
  const student = await Student.findOne({ studentId: allocation.studentId });
  if (student) await releaseStudent(student);
  else await Allocation.deleteOne({ _id: allocation._id });
  res.json({ message: "Allocation removed. The student is now marked as vacated." });
};

module.exports = { list, create, remove };
