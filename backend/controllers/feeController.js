const Fee = require("../models/Fee");
const Student = require("../models/Student");
const PaymentOrder = require("../models/PaymentOrder");
const { getSettings } = require("../models/Settings");
const razorpay = require("../services/razorpay");
const { annualFeeFor, academicYear } = require("../utils/feeStructure");
const httpError = require("../utils/httpError");

const today = () => new Date().toISOString().slice(0, 10);

const list = async (req, res) => {
  const filter = req.user.userType === "student" ? { studentId: req.user.studentId } : {};
  const fees = await Fee.find(filter).sort({ date: -1, createdAt: -1 });
  res.json({ fees });
};

const create = async (req, res) => {
  const student = await Student.findOne({ studentId: req.body.studentId });
  if (!student) throw httpError(404, "Student not found.");
  const fee = await Fee.create({ ...req.body, student: student.name });
  res.status(201).json({ message: "Payment recorded.", fee });
};

async function feeSummaryFor(studentId) {
  const student = await Student.findOne({ studentId });
  if (!student) throw httpError(404, "Your student record was not found. Please contact the admin.");
  const settings = await getSettings();
  const annualFee = annualFeeFor(student.roomType, settings.roomTypes);
  const year = academicYear();
  const paidRecords = await Fee.find({ studentId, status: "Paid", date: { $gte: year.start, $lte: year.end } });
  const paid = paidRecords.reduce((n, f) => n + f.amount, 0);
  return {
    student,
    roomType: student.roomType || "",
    annualFee, 
    paid,
    payable: annualFee ? Math.max(0, annualFee - paid) : 0,
    academicYear: year.label,
  };
}

const summary = async (req, res) => {
  const { roomType, annualFee, paid, payable, academicYear: year } = await feeSummaryFor(req.user.studentId);
  res.json({ roomType, annualFee, paid, payable, academicYear: year });
};

const createOrder = async (req, res) => {
  const { studentId } = req.user;
  let amount;
  let feeId = null;

  if (req.body.feeId) {
    const fee = await Fee.findOne({ _id: req.body.feeId, studentId });
    if (!fee) throw httpError(404, "Fee record not found.");
    if (fee.status === "Paid") throw httpError(409, "This fee has already been paid.");
    amount = fee.amount;
    feeId = fee._id;
  } else {
    const s = await feeSummaryFor(studentId);
    if (!s.annualFee) {
      throw httpError(400, "Your fee depends on your room type. A room has not been allocated to you yet, so please contact the admin.");
    }
    if (s.payable <= 0) throw httpError(409, `Your ${s.academicYear} fee of ₹${s.annualFee.toLocaleString("en-IN")} is already paid.`);
    amount = s.payable;
  }

  const order = await razorpay.createOrder({
    amountRupees: amount,
    receipt: `fee_${studentId}_${Date.now()}`,
    notes: { studentId, ...(feeId ? { feeId: String(feeId) } : {}) },
  });
  await PaymentOrder.create({ orderId: order.id, studentId, amount, fee: feeId });
  res.status(201).json({
    keyId: razorpay.keyId(),
    orderId: order.id,
    amount: order.amount, // paise
    currency: order.currency,
  });
};

const verifyPayment = async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
  const order = await PaymentOrder.findOne({ orderId, studentId: req.user.studentId });
  if (!order) throw httpError(404, "Payment order not found.");
  const existing = await Fee.findOne({ razorpayPaymentId: paymentId });
  if (existing) return res.json({ message: "Payment recorded. The admin has been notified.", fee: existing });

  if (!razorpay.verifySignature({ orderId, paymentId, signature })) {
    throw httpError(400, "Payment could not be verified. If money was deducted, please contact the admin with payment ID " + paymentId + ".");
  }

  const student = await Student.findOne({ studentId: order.studentId });
  if (!student) throw httpError(404, "Your student record was not found. Please contact the admin.");
  const paidFields = {
    mode: "Razorpay",
    transactionId: paymentId,
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    date: today(),
    status: "Paid",
    byStudent: true,
    paidAt: new Date(),
  };

  let fee;
  if (order.fee) {
    fee = await Fee.findOne({ _id: order.fee, studentId: order.studentId });
    if (!fee) throw httpError(404, "Fee record not found.");
    fee.set(paidFields);
    await fee.save();
  } else {
    fee = await Fee.create({
      ...paidFields,
      studentId: student.studentId,
      student: student.name,
      amount: order.amount,
      remarks: "Annual hostel fee (online)",
    });
  }
  order.status = "paid";
  await order.save();
  res.json({ message: "Payment successful. The admin has been notified.", fee });
};

const feeForStudent = async (req, res) => {
  const student = await Student.findOne({ studentId: req.params.studentId });
  if (!student) throw httpError(404, "Student not found.");
  const settings = await getSettings();
  res.json({ roomType: student.roomType || "", annualFee: annualFeeFor(student.roomType, settings.roomTypes) });
};

const setStatus = async (req, res) => {
  const fee = await Fee.findByIdAndUpdate(req.params.id, { status: req.body.status }, { returnDocument: "after" });
  if (!fee) throw httpError(404, "Fee record not found.");
  res.json({ message: "Fee updated.", fee });
};

const remove = async (req, res) => {
  const fee = await Fee.findByIdAndDelete(req.params.id);
  if (!fee) throw httpError(404, "Fee record not found.");
  res.json({ message: "Fee record deleted." });
};

module.exports = { list, create, summary, createOrder, verifyPayment, feeForStudent, setStatus, remove };
