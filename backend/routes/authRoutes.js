const express = require("express");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/requireAuth");
const {
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  profileSchema,
  changePasswordSchema,
} = require("../utils/schemas");
const {
  login,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

router.post("/login", validate(loginSchema), login);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

router.get("/me", requireAuth, (req, res) => {
  res.status(200).json({ user: req.user });
});
router.patch("/profile", requireAuth, validate(profileSchema), updateProfile);
router.post("/change-password", requireAuth, validate(changePasswordSchema), changePassword);

module.exports = router;
