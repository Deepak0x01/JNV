const mongoose = require("mongoose");
const paymentOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    amount: { type: Number, required: true }, // rupees
    fee: { type: mongoose.Schema.Types.ObjectId, ref: "Fee", default: null },
    status: { type: String, enum: ["created", "paid"], default: "created" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentOrder", paymentOrderSchema);
