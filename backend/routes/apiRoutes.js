const express = require("express");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/requireAuth");
const { requireAdmin, requireStudent } = require("../middleware/roles");
const s = require("../utils/schemas");
const students = require("../controllers/studentController");
const rooms = require("../controllers/roomController");
const allocations = require("../controllers/allocationController");
const fees = require("../controllers/feeController");
const complaints = require("../controllers/complaintController");
const dashboard = require("../controllers/dashboardController");
const settings = require("../controllers/settingsController");
const admins = require("../controllers/adminController");

const router = express.Router();
router.use(requireAuth);
router.get("/me/student", requireStudent, students.me);
router.get("/fees/summary", requireStudent, fees.summary);
router.post("/fees/razorpay/order", requireStudent, validate(s.razorpayOrderSchema), fees.createOrder);
router.post("/fees/razorpay/verify", requireStudent, validate(s.razorpayVerifySchema), fees.verifyPayment);
router.post("/complaints/raise", requireStudent, validate(s.studentComplaintSchema), complaints.createOwn);

router.get("/fees", fees.list);
router.get("/complaints", complaints.list);
router.get("/settings", settings.get);

router.use(requireAdmin);

router.get("/dashboard", dashboard.summary);
router.get("/dashboard/activity", dashboard.activity);
router.post("/notifications/seen", dashboard.markSeen);

router.get("/admins", admins.list);
router.post("/admins", validate(s.adminSchema), admins.create);

router.get("/students", students.list);
router.post("/students", validate(s.studentSchema), students.create);
router.get("/students/:id", students.getOne);
router.put("/students/:id", validate(s.studentSchema), students.update);
router.delete("/students/:id", students.remove);

router.get("/rooms", rooms.list);
router.post("/rooms", validate(s.roomSchema), rooms.create);
router.put("/rooms/:id", validate(s.roomUpdateSchema), rooms.update);
router.delete("/rooms/:id", rooms.remove);

router.get("/allocations", allocations.list);
router.post("/allocations", validate(s.allocationSchema), allocations.create);
router.delete("/allocations/:id", allocations.remove);

router.get("/fees/student/:studentId", fees.feeForStudent);
router.post("/fees", validate(s.feeSchema), fees.create);
router.patch("/fees/:id", validate(s.feeStatusSchema), fees.setStatus);
router.delete("/fees/:id", fees.remove);

router.post("/complaints", validate(s.complaintSchema), complaints.create);
router.patch("/complaints/:id", validate(s.complaintStatusSchema), complaints.setStatus);
router.delete("/complaints/:id", complaints.remove);

router.put("/settings", validate(s.settingsSchema), settings.update);
router.get("/backup", settings.backup);
router.post("/backup/restore", settings.restore);

module.exports = router;
