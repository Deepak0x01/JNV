const Student = require("../models/Student");
const Room = require("../models/Room");
const Allocation = require("../models/Allocation");
const httpError = require("../utils/httpError");

async function syncRoom(roomNo) {
  if (!roomNo) return;
  const count = await Student.countDocuments({ roomNo, status: "Allocated" });
  await Room.updateOne({ roomNo }, { occupied: count });
}

async function ensureRoomHasSpace(roomNo) {
  const room = await Room.findOne({ roomNo });
  if (!room) throw httpError(404, `Room ${roomNo} does not exist.`);
  const inRoom = await Student.countDocuments({ roomNo, status: "Allocated" });
  if (inRoom >= room.capacity) throw httpError(409, `Room ${roomNo} is full.`);
}

const today = () => new Date().toISOString().slice(0, 10);

async function assignRoom(student, roomNo, { date, notes } = {}) {
  const room = await Room.findOne({ roomNo });
  if (!room) throw httpError(404, `Room ${roomNo} does not exist.`);

  const alreadyThere = student.status === "Allocated" && student.roomNo === roomNo;
  if (!alreadyThere) {
    const inRoom = await Student.countDocuments({
      roomNo,
      status: "Allocated",
      _id: { $ne: student._id },
    });
    if (inRoom >= room.capacity) throw httpError(409, `Room ${roomNo} is full.`);
  }

  const oldRoom = student.status === "Allocated" ? student.roomNo : null;
  student.roomNo = roomNo;
  student.roomType = room.type;
  student.status = "Allocated";
  await student.save();

  const update = { studentName: student.name, roomNo, roomType: room.type };
  if (!alreadyThere || date) update.date = date || today();
  if (notes !== undefined) update.notes = notes;
  await Allocation.findOneAndUpdate(
    { studentId: student.studentId },
    { $set: update },
    { upsert: true }
  );

  await syncRoom(roomNo);
  if (oldRoom && oldRoom !== roomNo) await syncRoom(oldRoom);
  return room;
}

async function releaseStudent(student) {
  const oldRoom = student.status === "Allocated" ? student.roomNo : null;
  student.roomNo = "";
  student.roomType = "";
  student.status = "Vacated";
  await student.save();
  await Allocation.deleteOne({ studentId: student.studentId });
  await syncRoom(oldRoom);
}

module.exports = { syncRoom, assignRoom, releaseStudent, ensureRoomHasSpace };
