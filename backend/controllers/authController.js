const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken } = require("../utils/token");
const { sendOtpEmail } = require("../utils/mailer");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signToken({ sub: user._id.toString() });

    return res.status(200).json({
      message: "Logged in successfully.",
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    if (req.user.userType === "student") {
      return res.status(403).json({ message: "Only an admin can change student details." });
    }
    const { name, email, phone } = req.body;
    const user = await User.findById(req.user._id);
    user.name = name;
    user.email = email;
    user.phone = phone;
    await user.save();
    return res.status(200).json({ message: "Profile updated.", user });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.status(200).json({ message: "Password changed successfully." });
  } catch (err) {
    next(err);
  }
}

const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

const hashOtp = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select("+otpSentAt");

    if (user) {
      const recentlySent =
        user.otpSentAt && Date.now() - user.otpSentAt.getTime() < OTP_RESEND_COOLDOWN_MS;

      if (!recentlySent) {
        const otp = String(crypto.randomInt(100000, 1000000));
        const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || 10);

        user.otpHash = hashOtp(otp);
        user.otpExpires = new Date(Date.now() + ttlMinutes * 60 * 1000);
        user.otpAttempts = 0;
        user.otpSentAt = new Date();
        await user.save();

        try {
          await sendOtpEmail({ to: email, otp });
        } catch (mailErr) {
          console.error("Could not send OTP email:", mailErr.message);
        }
      }
    }

    return res.status(200).json({
      message: "If an account exists for that email, a verification code has been sent.",
    });
  } catch (err) {
    next(err);
  }
}

async function checkOtp(email, otp) {
  const invalid = { error: { status: 400, message: "Invalid or expired code." } };

  const user = await User.findOne({ email }).select(
    "+otpHash +otpExpires +otpAttempts +passwordHash"
  );
  if (!user || !user.otpHash || !user.otpExpires || user.otpExpires < new Date()) {
    return invalid;
  }

  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    user.otpHash = null;
    user.otpExpires = null;
    await user.save();
    return { error: { status: 429, message: "Too many attempts. Please request a new code." } };
  }

  if (user.otpHash !== hashOtp(otp)) {
    user.otpAttempts += 1;
    await user.save();
    return invalid;
  }

  return { user };
}
async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    const result = await checkOtp(email, otp);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }
    return res.status(200).json({ message: "Code verified." });
  } catch (err) {
    next(err);
  }
}
async function resetPassword(req, res, next) {
  try {
    const { email, otp, password } = req.body;
    const result = await checkOtp(email, otp);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const { user } = result;
    user.passwordHash = await bcrypt.hash(password, 10);
    user.otpHash = null;
    user.otpExpires = null;
    user.otpAttempts = 0;
    await user.save();

    return res.status(200).json({ message: "Password has been reset. You can now log in." });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
