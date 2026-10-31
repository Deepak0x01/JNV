const mongoose = require("mongoose");
const applyJson = require("../utils/json");

const allocationSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    studentName: { type: String, required: true },
    roomNo: { type: String, required: true },
    roomType: { type: String, default: "" },
    date: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

applyJson(allocationSchema);
module.exports = mongoose.model("Allocation", allocationSchema);
