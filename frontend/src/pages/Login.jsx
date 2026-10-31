import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthPanel from "../components/AuthPanel";

const schema = Yup.object({
  email: Yup.string().email("Enter a valid email address").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-shell">
      <div className="auth-card-wrapper">
        <AuthPanel />

        <div className="auth-form-panel">
          <h4 className="fw-bold mb-3">Login</h4>

          <Formik
            initialValues={{ email: "", password: "", remember: false }}
            validationSchema={schema}
            onSubmit={async (values, { setSubmitting }) => {
              setServerError("");
              try {
                await login(values);
                navigate("/");
              } catch (err) {
                setServerError(err.message);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form noValidate>
                {serverError && (
                  <div className="alert alert-danger py-2" style={{ fontSize: "0.85rem" }}>{serverError}</div>
                )}
                <div className="mb-3">
                  <label className="form-label-sm">Email Address</label>
                  <Field type="email" name="email" className="form-control" placeholder="Enter your email" />
                  <ErrorMessage name="email" component="div" className="invalid-feedback-block" />
                </div>
                <div className="mb-2">
                  <label className="form-label-sm">Password</label>
                  <div style={{ position: "relative" }}>
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="form-control"
                      placeholder="Enter your password"
                      style={{ paddingRight: "2.5rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{
                        position: "absolute",
                        top: "50%",
                        right: "0.75rem",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        color: "#6c757d",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <ErrorMessage name="password" component="div" className="invalid-feedback-block" />
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3 mt-2">
                  <div className="form-check">
                    <Field type="checkbox" name="remember" className="form-check-input" id="remember" />
                    <label htmlFor="remember" className="form-check-label" style={{ fontSize: "0.85rem" }}>Remember me</label>
                  </div>
                  <Link to="/forgot-password" style={{ fontSize: "0.85rem" }}>Forgot Password?</Link>
                </div>
                <button type="submit" className="btn btn-primary-soft w-100" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Login"}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}