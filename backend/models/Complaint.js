const mongoose = require("mongoose");
const applyJson = require("../utils/json");

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    student: { type: String, required: true },
    roomNo: { type: String, default: "" },
    type: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    status: { type: String, enum: ["Open", "In Progress", "Pending", "Resolved"], default: "Open" },
    date: { type: String, required: true },
    byStudent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

applyJson(complaintSchema, "complaintId");
module.exports = mongoose.model("Complaint", complaintSchema);
