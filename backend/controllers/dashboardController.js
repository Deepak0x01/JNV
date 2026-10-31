const Student = require("../models/Student");
const Room = require("../models/Room");
const Fee = require("../models/Fee");
const Complaint = require("../models/Complaint");
const Allocation = require("../models/Allocation");
const User = require("../models/User");
const { getSettings } = require("../models/Settings");

const COLORS = ["#2f6fed", "#22b573", "#f5a623", "#8b5cf6", "#e5484d", "#0891b2"];
async function countUnreadAlerts(userId) {
  const me = await User.findById(userId).select("+notificationsSeenAt");
  const seen = (me && me.notificationsSeenAt) || new Date(0);
  const [fees, complaints] = await Promise.all([
    Fee.countDocuments({ byStudent: true, paidAt: { $gt: seen } }),
    Complaint.countDocuments({ byStudent: true, createdAt: { $gt: seen } }),
  ]);
  return fees + complaints;
}

const summary = async (req, res) => {
  const [students, rooms, pendingFees, openComplaints, settings, unreadAlerts] = await Promise.all([
    Student.find().sort({ createdAt: -1 }),
    Room.find(),
    Fee.find({ status: "Pending" }),
    Complaint.countDocuments({ status: { $ne: "Resolved" } }),
    getSettings(),
    countUnreadAlerts(req.user._id),
  ]);

  const allocated = students.filter((s) => s.status === "Allocated");
  const beds = rooms.reduce((n, r) => n + r.capacity, 0);
  const bedsTaken = rooms.reduce((n, r) => n + r.occupied, 0);
  const occupiedRooms = rooms.filter((r) => r.occupied > 0).length;

  const typeNames = settings.roomTypes.map((t) => t.name);
  allocated.forEach((s) => {
    if (s.roomType && !typeNames.includes(s.roomType)) typeNames.push(s.roomType);
  });

  res.json({
    totalStudents: students.length,
    allocatedStudents: allocated.length,
    totalRooms: rooms.length,
    occupiedRooms,
    vacantRooms: rooms.length - occupiedRooms,
    occupancyPercent: beds ? Math.round((bedsTaken / beds) * 100) : 0,
    pendingFees: pendingFees.reduce((n, f) => n + f.amount, 0),
    openComplaints,
    unreadAlerts,
    studentsByRoomType: typeNames.map((label, i) => ({
      label,
      value: allocated.filter((s) => s.roomType === label).length,
      color: COLORS[i % COLORS.length],
    })),
    recentStudents: students.slice(0, 5),
  });
};

const activity = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const me = await User.findById(req.user._id).select("+notificationsSeenAt");
  const seen = (me && me.notificationsSeenAt) || new Date(0);
  const latest = (Model, sort = { createdAt: -1 }) => Model.find().sort(sort).limit(limit);
  const [students, allocations, fees, complaints] = await Promise.all([
    latest(Student),
    latest(Allocation),
    // a pending fee paid later by a student keeps its old createdAt, so order by last change
    latest(Fee, { updatedAt: -1 }),
    latest(Complaint),
  ]);

  const items = [
    ...students.map((s) => ({
      type: "student",
      title: "New student registered",
      detail: s.name,
      at: s.createdAt,
    })),
    ...allocations.map((a) => ({
      type: "room",
      title: "Room allocated",
      detail: `Room ${a.roomNo}${a.roomType ? ` (${a.roomType})` : ""} - ${a.studentName}`,
      at: a.updatedAt,
    })),
    ...fees.map((f) => ({
      type: "fee",
      title: f.byStudent ? "Fee paid by student" : f.status === "Paid" ? "Fee payment received" : "Fee marked pending",
      detail: `₹${f.amount.toLocaleString("en-IN")} - ${f.student}`,
      at: f.byStudent && f.paidAt ? f.paidAt : f.createdAt,
      byStudent: Boolean(f.byStudent),
      unread: Boolean(f.byStudent && f.paidAt && f.paidAt > seen),
    })),
    ...complaints.map((c) => ({
      type: "complaint",
      title: c.byStudent ? "Complaint raised by student" : "Complaint raised",
      detail: c.byStudent
        ? `${c.student} - ${c.type}${c.roomNo ? ` - Room ${c.roomNo}` : ""}`
        : `${c.type}${c.roomNo ? ` - Room ${c.roomNo}` : ""}`,
      at: c.createdAt,
      byStudent: Boolean(c.byStudent),
      unread: Boolean(c.byStudent && c.createdAt > seen),
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit);

  res.json({ activity: items });
};

const markSeen = async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { notificationsSeenAt: new Date() });
  res.json({ message: "Notifications marked as seen." });
};

module.exports = { summary, activity, markSeen };
