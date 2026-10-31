import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";
import AuthPanel from "../components/AuthPanel";
import { API_BASE_URL } from "../api";

const RESEND_SECONDS = 30;

const emailSchema = Yup.object({
  email: Yup.string().email("Enter a valid email address").required("Email is required"),
});

const otpSchema = Yup.object({
  otp: Yup.string().matches(/^\d{6}$/, "Enter the 6-digit code").required("OTP is required"),
});

const passwordSchema = Yup.object({
  password: Yup.string().min(6, "Password must be at least 6 characters").required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your new password"),
});

async function post(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

const NETWORK_ERROR = "Could not reach the server. Is the API running?";

export default function ForgotPassword() {
  const [step, setStep] = useState("email"); // email -> otp -> password -> done
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [serverError, setServerError] = useState("");
  const [info, setInfo] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    setServerError("");
    setInfo("");
    try {
      await post("/api/auth/forgot-password", { email });
      setInfo("A new code has been sent.");
      setCooldown(RESEND_SECONDS);
    } catch {
      setServerError(NETWORK_ERROR);
    }
  };

  const errorBox = serverError && (
    <div className="invalid-feedback-block mb-3" style={{ fontSize: "0.85rem" }}>{serverError}</div>
  );
  const infoBox = info && (
    <div className="text-success mb-3" style={{ fontSize: "0.85rem" }}>{info}</div>
  );

  return (
    <div className="auth-shell">
      <div className="auth-card-wrapper">
        <AuthPanel />

        <div className="auth-form-panel">
          <h4 className="fw-bold mb-1">Forgot Password</h4>

          {step === "email" && (
            <Formik
              initialValues={{ email: "" }}
              validationSchema={emailSchema}
              onSubmit={async (values, { setSubmitting }) => {
                setServerError("");
                try {
                  const { ok, data } = await post("/api/auth/forgot-password", values);
                  if (!ok) {
                    setServerError(data.message || "Something went wrong. Please try again.");
                    return;
                  }
                  setEmail(values.email);
                  setCooldown(RESEND_SECONDS);
                  setStep("otp");
                } catch {
                  setServerError(NETWORK_ERROR);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form noValidate>
                  <p className="text-muted-soft mb-3" style={{ fontSize: "0.85rem" }}>
                    Enter your email address and we'll send you a 6-digit verification code.
                  </p>
                  {errorBox}
                  <div className="mb-4">
                    <label className="form-label-sm">Email Address</label>
                    <Field type="email" name="email" className="form-control" placeholder="Enter your email" />
                    <ErrorMessage name="email" component="div" className="invalid-feedback-block" />
                  </div>
                  <button type="submit" className="btn btn-primary-soft w-100" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send OTP"}
                  </button>
                  <p className="text-center mt-3 mb-0" style={{ fontSize: "0.85rem" }}>
                    <Link to="/login">Back to Login</Link>
                  </p>
                </Form>
              )}
            </Formik>
          )}

          {step === "otp" && (
            <Formik
              initialValues={{ otp: "" }}
              validationSchema={otpSchema}
              onSubmit={async (values, { setSubmitting }) => {
                setServerError("");
                setInfo("");
                try {
                  const { ok, data } = await post("/api/auth/verify-otp", { email, otp: values.otp });
                  if (!ok) {
                    setServerError(data.message || "Invalid or expired code.");
                    return;
                  }
                  setOtp(values.otp);
                  setStep("password");
                } catch {
                  setServerError(NETWORK_ERROR);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form noValidate>
                  <p className="text-muted-soft mb-3" style={{ fontSize: "0.85rem" }}>
                    We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
                  </p>
                  {errorBox}
                  {infoBox}
                  <div className="mb-3">
                    <label className="form-label-sm">Verification Code</label>
                    <Field
                      name="otp"
                      className="form-control"
                      placeholder="------"
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      style={{ letterSpacing: "0.5em", fontSize: "1.2rem", textAlign: "center", fontWeight: 600 }}
                    />
                    <ErrorMessage name="otp" component="div" className="invalid-feedback-block" />
                  </div>
                  <button type="submit" className="btn btn-primary-soft w-100" disabled={isSubmitting}>
                    {isSubmitting ? "Verifying..." : "Verify OTP"}
                  </button>
                  <div className="d-flex justify-content-between mt-3" style={{ fontSize: "0.85rem" }}>
                    <button
                      type="button"
                      className="btn btn-link p-0"
                      style={{ fontSize: "0.85rem" }}
                      onClick={() => { setServerError(""); setInfo(""); setStep("email"); }}
                    >
                      Change email
                    </button>
                    {cooldown > 0 ? (
                      <span className="text-muted-soft">Resend code in {cooldown}s</span>
                    ) : (
                      <button type="button" className="btn btn-link p-0" style={{ fontSize: "0.85rem" }} onClick={resend}>
                        Resend code
                      </button>
                    )}
                  </div>
                </Form>
              )}
            </Formik>
          )}

          {step === "password" && (
            <Formik
              initialValues={{ password: "", confirmPassword: "" }}
              validationSchema={passwordSchema}
              onSubmit={async (values, { setSubmitting }) => {
                setServerError("");
                try {
                  const { ok, data } = await post("/api/auth/reset-password", {
                    email,
                    otp,
                    password: values.password,
                    confirmPassword: values.confirmPassword,
                  });
                  if (!ok) {
                    setServerError(data.message || "Something went wrong. Please try again.");
                    return;
                  }
                  setStep("done");
                } catch {
                  setServerError(NETWORK_ERROR);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form noValidate>
                  <p className="text-muted-soft mb-3" style={{ fontSize: "0.85rem" }}>
                    Code verified. Choose a new password for your account.
                  </p>
                  {errorBox}
                  <div className="mb-3">
                    <label className="form-label-sm">New Password</label>
                    <Field type="password" name="password" className="form-control" placeholder="Enter new password" />
                    <ErrorMessage name="password" component="div" className="invalid-feedback-block" />
                  </div>
                  <div className="mb-4">
                    <label className="form-label-sm">Confirm New Password</label>
                    <Field type="password" name="confirmPassword" className="form-control" placeholder="Confirm new password" />
                    <ErrorMessage name="confirmPassword" component="div" className="invalid-feedback-block" />
                  </div>
                  <button type="submit" className="btn btn-primary-soft w-100" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Reset Password"}
                  </button>
                </Form>
              )}
            </Formik>
          )}

          {step === "done" && (
            <div className="py-2">
              <p className="text-muted-soft mb-3" style={{ fontSize: "0.88rem" }}>
                <i className="bi bi-check-circle-fill text-success me-2" />
                Your password has been reset successfully.
              </p>
              <Link to="/login" className="btn btn-primary-soft w-100">Back to Login</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}