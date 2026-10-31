const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    phone: { type: String, trim: true, default: "" },
    role: {
      type: String,
      default: "System Administrator",
    },
    userType: { type: String, enum: ["admin", "student"], default: "admin" },
    studentId: { type: String, default: "" },
    notificationsSeenAt: { type: Date, select: false, default: null },
    otpHash: { type: String, select: false, default: null },
    otpExpires: { type: Date, select: false, default: null },
    otpAttempts: { type: Number, select: false, default: 0 },
    otpSentAt: { type: Date, select: false, default: null },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.otpHash;
    delete ret.otpExpires;
    delete ret.otpAttempts;
    delete ret.otpSentAt;
    delete ret.notificationsSeenAt;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
