const yup = require("yup");

const email = () =>
  yup.string().trim().lowercase().email("Enter a valid email address").required("Email is required");
const phone = (label = "Phone number") =>
  yup
    .string()
    .trim()
    .matches(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number")
    .required(`${label} is required`);
const isoDate = (label) =>
  yup
    .string()
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a valid date`)
    .required(`${label} is required`);

const loginSchema = yup.object({
  email: email(),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const forgotPasswordSchema = yup.object({ email: email() });

const otpField = yup
  .string()
  .trim()
  .matches(/^\d{6}$/, "Enter the 6-digit code")
  .required("OTP is required");

const verifyOtpSchema = yup.object({ email: email(), otp: otpField });

const resetPasswordSchema = yup.object({
  email: email(),
  otp: otpField,
  password: yup.string().min(6, "Password must be at least 6 characters").required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your new password"),
});

const profileSchema = yup.object({
  name: yup.string().trim().min(2, "Enter a valid name").required("Full name is required"),
  email: email(),
  phone: phone(),
});

const changePasswordSchema = yup.object({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup.string().min(6, "Password must be at least 6 characters").required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords must match")
    .required("Please confirm your new password"),
});

const adminSchema = yup.object({
  name: yup.string().trim().min(2, "Enter a valid full name").required("Full name is required"),
  email: email(),
});

const studentSchema = yup.object({
  name: yup.string().trim().min(2, "Enter a valid full name").required("Full name is required"),
  gender: yup.string().oneOf(["Male", "Female", "Other"], "Select a gender").required("Select a gender"),
  dob: isoDate("Date of birth"),
  course: yup.string().trim().required("Select a course"),
  phone: phone(),
  email: email(),
  address: yup.string().trim().required("Address is required"),
  guardian: yup.string().trim().required("Parent/guardian contact is required"),
  roomNo: yup.string().trim().required("Select a room"),
});

const roomSchema = yup.object({
  roomNo: yup.string().trim().required("Room number is required"),
  type: yup.string().trim().required("Select a room type"),
  capacity: yup.number().integer("Capacity must be a whole number").min(1, "Capacity must be at least 1").required("Capacity is required"),
  block: yup.string().trim().required("Select a block"),
});

const roomUpdateSchema = roomSchema.omit(["roomNo"]);

const allocationSchema = yup.object({
  studentId: yup.string().trim().required("Select a student"),
  roomNo: yup.string().trim().required("Select a room"),
  date: isoDate("Allocation date"),
  notes: yup.string().trim().default(""),
});

const transactionIdField = () =>
  yup
    .string()
    .trim()
    .default("")
    .when("mode", {
      is: (mode) => mode && mode !== "Cash",
      then: (s) => s.required("Transaction ID is required"),
    });

const feeSchema = yup.object({
  studentId: yup.string().trim().required("Select a student"),
  amount: yup.number().positive("Amount must be greater than 0").required("Amount is required"),
  mode: yup.string().trim().required("Select a payment mode"),
  transactionId: transactionIdField(),
  date: isoDate("Payment date"),
  remarks: yup.string().trim().default(""),
  status: yup.string().oneOf(["Paid", "Pending"]).default("Paid"),
});

const studentFeeSchema = yup.object({
  amount: yup.number().positive("Amount must be greater than 0").required("Amount is required"),
  mode: yup.string().trim().required("Select a payment mode"),
  transactionId: transactionIdField(),
  date: yup
    .string()
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Payment date must be a valid date", excludeEmptyString: true })
    .default(""),
  remarks: yup.string().trim().default(""),
});

const feePaySchema = yup.object({
  mode: yup.string().trim().required("Select a payment mode"),
  transactionId: transactionIdField(),
  date: yup
    .string()
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/, { message: "Payment date must be a valid date", excludeEmptyString: true })
    .default(""),
  remarks: yup.string().trim().default(""),
});

const razorpayOrderSchema = yup.object({
  feeId: yup.string().trim().default(""),
});

const razorpayVerifySchema = yup.object({
  razorpay_order_id: yup.string().trim().required("Missing payment details"),
  razorpay_payment_id: yup.string().trim().required("Missing payment details"),
  razorpay_signature: yup.string().trim().required("Missing payment details"),
});

const feeStatusSchema = yup.object({
  status: yup.string().oneOf(["Paid", "Pending"], "Invalid status").required("Status is required"),
});

const complaintSchema = yup.object({
  studentId: yup.string().trim().required("Select a student"),
  roomNo: yup.string().trim().default(""),
  type: yup.string().trim().required("Select a complaint type"),
  description: yup.string().trim().min(10, "Description should be at least 10 characters").required("Description is required"),
  priority: yup.string().oneOf(["Low", "Medium", "High"], "Select a priority").required("Select a priority"),
});

const studentComplaintSchema = yup.object({
  type: yup.string().trim().required("Select a complaint type"),
  description: yup.string().trim().min(10, "Description should be at least 10 characters").required("Description is required"),
  priority: yup.string().oneOf(["Low", "Medium", "High"], "Select a priority").required("Select a priority"),
});

const complaintStatusSchema = yup.object({
  status: yup
    .string()
    .oneOf(["Open", "In Progress", "Pending", "Resolved"], "Invalid status")
    .required("Status is required"),
});

const settingsSchema = yup.object({
  hostelName: yup.string().trim().min(2, "Hostel name is required"),
  address: yup.string().trim(),
  paymentModes: yup.array().of(yup.string().trim().required()).min(1, "Keep at least one payment mode"),
  roomTypes: yup
    .array()
    .of(
      yup.object({
        name: yup.string().trim().required("Room type name is required"),
        capacity: yup.number().integer().min(1, "Capacity must be at least 1").required("Capacity is required"),
      })
    )
    .min(1, "Keep at least one room type"),
  notifications: yup.object({
    email: yup.boolean(),
    sms: yup.boolean(),
    push: yup.boolean(),
  }),
});

module.exports = {
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  profileSchema,
  changePasswordSchema,
  adminSchema,
  studentSchema,
  roomSchema,
  roomUpdateSchema,
  allocationSchema,
  feeSchema,
  studentFeeSchema,
  feePaySchema,
  feeStatusSchema,
  razorpayOrderSchema,
  razorpayVerifySchema,
  complaintSchema,
  studentComplaintSchema,
  complaintStatusSchema,
  settingsSchema,
};
