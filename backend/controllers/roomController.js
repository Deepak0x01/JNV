const Room = require("../models/Room");
const Student = require("../models/Student");
const Allocation = require("../models/Allocation");
const httpError = require("../utils/httpError");

const byRoomNo = (a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true });

const list = async (req, res) => {
  const rooms = (await Room.find()).sort(byRoomNo);
  res.json({ rooms });
};

const create = async (req, res) => {
  if (await Room.exists({ roomNo: req.body.roomNo })) {
    throw httpError(409, `Room ${req.body.roomNo} already exists.`);
  }
  const room = await Room.create(req.body);
  res.status(201).json({ message: "Room added.", room });
};

const update = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) throw httpError(404, "Room not found.");
  if (req.body.capacity < room.occupied) {
    throw httpError(409, `Room ${room.roomNo} has ${room.occupied} students; capacity can't be lower than that.`);
  }
  room.set(req.body);
  await room.save();
  await Student.updateMany({ roomNo: room.roomNo }, { roomType: room.type });
  await Allocation.updateMany({ roomNo: room.roomNo }, { roomType: room.type });
  res.json({ message: "Room updated.", room });
};

const remove = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) throw httpError(404, "Room not found.");
  const inside = await Student.countDocuments({ roomNo: room.roomNo, status: "Allocated" });
  if (inside > 0) throw httpError(409, `Room ${room.roomNo} still has ${inside} student(s). Move them first.`);
  await Room.deleteOne({ _id: room._id });
  res.json({ message: "Room deleted." });
};

module.exports = { list, create, update, remove };
