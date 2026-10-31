import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { PageHeader, Modal, Loading, Notice, EmptyState } from "../components/UI";
import useApiData from "../hooks/useApiData";
import { apiRequest } from "../api";

const schema = Yup.object({
  name: Yup.string().min(2, "Enter a valid full name").required("Full name is required"),
  email: Yup.string().email("Enter a valid email address").required("Email address is required"),
});

export default function Admins() {
  const { data, loading, error, reload } = useApiData("/api/admins");
  const [showAdd, setShowAdd] = useState(false);
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState({ kind: "success", text: "" });

  const admins = data?.admins || [];
  const close = () => {
    setShowAdd(false);
    setFormError("");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Home / Admins"
        title="Admins"
        action={
          <button className="btn btn-primary-soft" onClick={() => { setMessage({ kind: "success", text: "" }); setShowAdd(true); }}>
            <i className="bi bi-plus-lg me-1" />Add Admin
          </button>
        }
      />
      <Notice kind={message.kind} text={message.text} onClose={() => setMessage({ ...message, text: "" })} />

      <div className="card-surface p-3">
        {loading ? (
          <Loading />
        ) : error ? (
          <Notice text={error} />
        ) : (
          <div className="table-responsive">
            <table className="table table-surface mb-0">
              <thead>
                <tr><th>Name</th><th>Email (Username)</th><th>Phone</th><th>Role</th></tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id || a._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="avatar-circle" style={{ width: 30, height: 30, fontSize: "0.75rem" }}>
                          {a.name.charAt(0).toUpperCase()}
                        </span>
                        {a.name}
                      </div>
                    </td>
                    <td>{a.email}</td>
                    <td>{a.phone || "-"}</td>
                    <td>{a.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {admins.length === 0 && <EmptyState icon="bi-shield-lock" text="No admins yet." />}
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="Add Admin" onClose={close}>
          <Notice text={formError} />
          <p className="text-muted-soft" style={{ fontSize: "0.85rem" }}>
            A password is generated automatically and emailed to the new admin along with their username (email).
          </p>
          <Formik
            initialValues={{ name: "", email: "" }}
            validationSchema={schema}
            onSubmit={async (values, { setSubmitting }) => {
              setFormError("");
              try {
                const res = await apiRequest("/api/admins", { method: "POST", body: values });
                close();
                setMessage({ kind: res.emailed ? "success" : "warning", text: res.message });
                reload();
              } catch (err) {
                setFormError(err.message);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form noValidate>
                <div className="mb-3">
                  <label className="form-label-sm">Full Name *</label>
                  <Field name="name" className="form-control" placeholder="Enter full name" />
                  <ErrorMessage name="name" component="div" className="invalid-feedback-block" />
                </div>
                <div className="mb-4">
                  <label className="form-label-sm">Email Address *</label>
                  <Field type="email" name="email" className="form-control" placeholder="Enter email address" />
                  <ErrorMessage name="email" component="div" className="invalid-feedback-block" />
                </div>
                <div className="d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-outline-secondary" onClick={close}>Cancel</button>
                  <button type="submit" className="btn btn-primary-soft" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Admin"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </Modal>
      )}
    </div>
  );
}