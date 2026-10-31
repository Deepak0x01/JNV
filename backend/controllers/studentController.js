const Student = require("../models/Student");
const Room = require("../models/Room");
const User = require("../models/User");
const Allocation = require("../models/Allocation");
const { nextSeq } = require("../models/Counter");
const { assignRoom, syncRoom, ensureRoomHasSpace } = require("../services/occupancy");
const { createAccount, mailCredentials } = require("../services/accounts");
const httpError = require("../utils/httpError");

const list = async (req, res) => {
  const students = await Student.find().sort({ createdAt: -1 });
  res.json({ students });
};

const getOne = async (req, res) => {
  const student = await Student.findOne({ studentId: req.params.id });
  if (!student) throw httpError(404, "Student not found.");
  res.json({ student });
};

const me = async (req, res) => {
  const student = await Student.findOne({ studentId: req.user.studentId });
  if (!student) throw httpError(404, "Your student record was not found. Please contact the admin.");
  const room = student.roomNo ? await Room.findOne({ roomNo: student.roomNo }) : null;
  res.json({
    student,
    room: room ? { roomNo: room.roomNo, type: room.type, block: room.block, capacity: room.capacity } : null,
  });
};

const create = async (req, res) => {
  const { roomNo, ...details } = req.body;
  await ensureRoomHasSpace(roomNo);
  if (await User.exists({ email: details.email })) {
    throw httpError(409, "An account with this email already exists.");
  }

  const studentId = `HS${String(await nextSeq("student")).padStart(5, "0")}`;
  const student = await Student.create({ ...details, studentId });
  try {
    await assignRoom(student, roomNo);
  } catch (err) {
    await Student.deleteOne({ _id: student._id });
    throw err;
  }

  let account;
  try {
    account = await createAccount({
      name: student.name,
      email: student.email,
      phone: student.phone,
      userType: "student",
      studentId,
    });
  } catch (err) {
    await Student.deleteOne({ _id: student._id });
    await Allocation.deleteOne({ studentId });
    await syncRoom(roomNo);
    throw err;
  }
  const emailed = await mailCredentials(account);

  res.status(201).json({
    message: emailed
      ? `Student added. Login details were emailed to ${student.email}.`
      : `Student added, but the login email could not be sent to ${student.email}. They can use "Forgot Password" to set a password.`,
    student,
    emailed,
  });
};

const update = async (req, res) => {
  const student = await Student.findOne({ studentId: req.params.id });
  if (!student) throw httpError(404, "Student not found.");

  const { roomNo, ...details } = req.body;
  if (details.email !== student.email) {
    const taken = await User.exists({ email: details.email, studentId: { $ne: student.studentId } });
    if (taken) throw httpError(409, "An account with this email already exists.");
  }
  const nameChanged = details.name !== student.name;
  student.set(details);
  await student.save();
  await assignRoom(student, roomNo);

  if (nameChanged) await Allocation.updateOne({ studentId: student.studentId }, { studentName: student.name });
  await User.updateOne(
    { studentId: student.studentId },
    { name: student.name, email: student.email, phone: student.phone }
  );
  res.json({ message: "Student updated.", student });
};

const remove = async (req, res) => {
  const student = await Student.findOne({ studentId: req.params.id });
  if (!student) throw httpError(404, "Student not found.");
  const roomNo = student.status === "Allocated" ? student.roomNo : null;
  await Student.deleteOne({ _id: student._id });
  await Allocation.deleteOne({ studentId: student.studentId });
  await User.deleteOne({ userType: "student", studentId: student.studentId });
  await syncRoom(roomNo);
  res.json({ message: "Student deleted." });
};

module.exports = { list, getOne, me, create, update, remove };
