import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { PageHeader, Loading, Notice } from "../components/UI";
import useApiData from "../hooks/useApiData";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api";

const adminSchema = Yup.object({
  student: Yup.string().required("Select a student"),
  roomNo: Yup.string(),
  type: Yup.string().required("Select a complaint type"),
  description: Yup.string().min(10, "Description should be at least 10 characters").required("Description is required"),
  priority: Yup.string().required("Select a priority"),
});

const studentSchema = Yup.object({
  type: Yup.string().required("Select a complaint type"),
  description: Yup.string().min(10, "Description should be at least 10 characters").required("Description is required"),
  priority: Yup.string().required("Select a priority"),
});

export default function AddComplaint() {
  const navigate = useNavigate();
  const { isStudent } = useAuth();
  const { data, loading, error } = useApiData(isStudent ? null : "/api/students");
  const [serverError, setServerError] = useState("");

  if (loading) return <Loading />;
  if (error) return <Notice text={error} />;
  const students = data?.students || [];

  return (
    <div>
      <PageHeader
        eyebrow={isStudent ? "Home / My Complaints / Raise Complaint" : "Home / Complaints / Raise Complaint"}
        title="Raise Complaint"
      />
      <Notice text={serverError} onClose={() => setServerError("")} />

      <div className="card-surface p-4" style={{ maxWidth: "640px" }}>
        <Formik
          initialValues={{ student: "", roomNo: "", type: "", description: "", priority: "" }}
          validationSchema={isStudent ? studentSchema : adminSchema}
          onSubmit={async (values, { setSubmitting }) => {
            setServerError("");
            try {
              if (isStudent) {
                await apiRequest("/api/complaints/raise", {
                  method: "POST",
                  body: { type: values.type, description: values.description, priority: values.priority },
                });
              } else {
                await apiRequest("/api/complaints", {
                  method: "POST",
                  body: {
                    studentId: values.student,
                    roomNo: values.roomNo,
                    type: values.type,
                    description: values.description,
                    priority: values.priority,
                  },
                });
              }
              navigate("/complaints");
            } catch (err) {
              setServerError(err.message);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, setFieldValue }) => (
            <Form noValidate>
              {!isStudent && (
                <>
                  <div className="mb-3">
                    <label className="form-label-sm">Student *</label>
                    <Field
                      as="select"
                      name="student"
                      className="form-select"
                      onChange={(e) => {
                        setFieldValue("student", e.target.value);
                        const s = students.find((st) => st.id === e.target.value);
                        setFieldValue("roomNo", s ? s.roomNo : "");
                      }}
                    >
                      <option value="">Select Student</option>
                      {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                    </Field>
                    <ErrorMessage name="student" component="div" className="invalid-feedback-block" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label-sm">Room No.</label>
                    <Field name="roomNo" className="form-control" placeholder="Filled in from the student's room" />
                    <ErrorMessage name="roomNo" component="div" className="invalid-feedback-block" />
                  </div>
                </>
              )}
              <div className="mb-3">
                <label className="form-label-sm">Complaint Type *</label>
                <Field as="select" name="type" className="form-select">
                  <option value="">Select Type</option>
                  <option>Water Supply</option><option>Electrical</option><option>Cleaning</option>
                  <option>Room Change</option><option>Noise</option><option>Other</option>
                </Field>
                <ErrorMessage name="type" component="div" className="invalid-feedback-block" />
              </div>
              <div className="mb-3">
                <label className="form-label-sm">Description *</label>
                <Field as="textarea" name="description" rows={4} className="form-control" placeholder="Describe your complaint" />
                <ErrorMessage name="description" component="div" className="invalid-feedback-block" />
              </div>
              <div className="mb-4">
                <label className="form-label-sm">Priority *</label>
                <Field as="select" name="priority" className="form-select">
                  <option value="">Select Priority</option>
                  <option>Low</option><option>Medium</option><option>High</option>
                </Field>
                <ErrorMessage name="priority" component="div" className="invalid-feedback-block" />
              </div>
              <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/complaints")}>Cancel</button>
                <button type="submit" className="btn btn-primary-soft" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
