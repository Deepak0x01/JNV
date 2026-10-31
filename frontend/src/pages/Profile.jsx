import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { PageHeader, Notice } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api";

const profileSchema = Yup.object({
  name: Yup.string().min(2, "Enter a valid name").required("Full name is required"),
  email: Yup.string().email("Enter a valid email address").required("Email is required"),
  phone: Yup.string().matches(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number").required("Phone number is required"),
});

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string().min(6, "Password must be at least 6 characters").required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Please confirm your new password"),
});

export default function Profile() {
  const { user, isStudent, updateProfile } = useAuth();
  const [profileMsg, setProfileMsg] = useState({ kind: "success", text: "" });
  const [passwordMsg, setPasswordMsg] = useState({ kind: "success", text: "" });

  return (
    <div>
      <PageHeader eyebrow="Home / Profile" title="My Profile" />
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card-surface p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="avatar-circle" style={{ width: 64, height: 64, fontSize: "1.5rem" }}>{(user?.name || "A").charAt(0).toUpperCase()}</div>
              <div>
                <div className="fw-bold">{user?.name}</div>
                <div className="text-muted-soft" style={{ fontSize: "0.82rem" }}>{user?.role}</div>
              </div>
            </div>
            {isStudent ? (
              <>
                <div className="section-title">Account Details</div>
                <div className="mb-3">
                  <div className="text-muted-soft" style={{ fontSize: "0.78rem" }}>Full Name</div>
                  <div>{user?.name}</div>
                </div>
                <div className="mb-3">
                  <div className="text-muted-soft" style={{ fontSize: "0.78rem" }}>Username (Email)</div>
                  <div>{user?.email}</div>
                </div>
                <div className="mb-3">
                  <div className="text-muted-soft" style={{ fontSize: "0.78rem" }}>Phone</div>
                  <div>{user?.phone || "-"}</div>
                </div>
                <div className="text-muted-soft" style={{ fontSize: "0.82rem" }}>
                  These details are managed by the hostel admin. Contact the admin if something needs to change.
                </div>
              </>
            ) : (
              <>
                <div className="section-title">Edit Profile</div>
                <Notice kind={profileMsg.kind} text={profileMsg.text} onClose={() => setProfileMsg({ ...profileMsg, text: "" })} />
                <Formik
                  initialValues={{ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" }}
                  validationSchema={profileSchema}
                  enableReinitialize
                  onSubmit={async (values, { setSubmitting }) => {
                    setProfileMsg({ kind: "success", text: "" });
                    try {
                      await updateProfile(values);
                      setProfileMsg({ kind: "success", text: "Profile updated." });
                    } catch (err) {
                      setProfileMsg({ kind: "danger", text: err.message });
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {({ isSubmitting }) => (
                    <Form noValidate>
                      <div className="mb-3">
                        <label className="form-label-sm">Full Name</label>
                        <Field name="name" className="form-control" />
                        <ErrorMessage name="name" component="div" className="invalid-feedback-block" />
                      </div>
                      <div className="mb-3">
                        <label className="form-label-sm">Email</label>
                        <Field type="email" name="email" className="form-control" />
                        <ErrorMessage name="email" component="div" className="invalid-feedback-block" />
                      </div>
                      <div className="mb-3">
                        <label className="form-label-sm">Phone</label>
                        <Field name="phone" className="form-control" />
                        <ErrorMessage name="phone" component="div" className="invalid-feedback-block" />
                      </div>
                      <button type="submit" className="btn btn-primary-soft" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Update Profile"}
                      </button>
                    </Form>
                  )}
                </Formik>
              </>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card-surface p-4">
            <div className="section-title">Change Password</div>
            <Notice kind={passwordMsg.kind} text={passwordMsg.text} onClose={() => setPasswordMsg({ ...passwordMsg, text: "" })} />
            <Formik
              initialValues={{ currentPassword: "", newPassword: "", confirmPassword: "" }}
              validationSchema={passwordSchema}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                setPasswordMsg({ kind: "success", text: "" });
                try {
                  await apiRequest("/api/auth/change-password", { method: "POST", body: values });
                  setPasswordMsg({ kind: "success", text: "Password changed successfully." });
                  resetForm();
                } catch (err) {
                  setPasswordMsg({ kind: "danger", text: err.message });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form noValidate>
                  <div className="mb-3">
                    <label className="form-label-sm">Current Password</label>
                    <Field type="password" name="currentPassword" className="form-control" placeholder="Enter current password" />
                    <ErrorMessage name="currentPassword" component="div" className="invalid-feedback-block" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label-sm">New Password</label>
                    <Field type="password" name="newPassword" className="form-control" placeholder="Enter new password" />
                    <ErrorMessage name="newPassword" component="div" className="invalid-feedback-block" />
                  </div>
                  <div className="mb-4">
                    <label className="form-label-sm">Confirm New Password</label>
                    <Field type="password" name="confirmPassword" className="form-control" placeholder="Confirm new password" />
                    <ErrorMessage name="confirmPassword" component="div" className="invalid-feedback-block" />
                  </div>
                  <button type="submit" className="btn btn-primary-soft" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Change Password"}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
}