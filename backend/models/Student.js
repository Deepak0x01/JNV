const mongoose = require("mongoose");
const applyJson = require("../utils/json");

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    gender: { type: String, required: true },
    course: { type: String, required: true },
    dob: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    guardian: { type: String, required: true, trim: true },
    roomNo: { type: String, default: "" },
    roomType: { type: String, default: "" },
    status: { type: String, enum: ["Allocated", "Vacated"], default: "Vacated" },
  },
  { timestamps: true }
);

applyJson(studentSchema, "studentId");
module.exports = mongoose.model("Student", studentSchema);
