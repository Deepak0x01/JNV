const mongoose = require("mongoose");
const applyJson = require("../utils/json");

const feeSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    student: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    mode: { type: String, required: true },
    transactionId: { type: String, default: "" },
    date: { type: String, required: true },
    remarks: { type: String, default: "" },
    status: { type: String, enum: ["Paid", "Pending"], default: "Paid" },
    byStudent: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
  },
  { timestamps: true }
);

applyJson(feeSchema);
module.exports = mongoose.model("Fee", feeSchema);
