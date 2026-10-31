import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader, Loading, Notice } from "../components/UI";
import useApiData from "../hooks/useApiData";
import { apiRequest } from "../api";

const schema = Yup.object({
  fullName: Yup.string().min(2, "Enter a valid full name").required("Full name is required"),
  gender: Yup.string().required("Select a gender"),
  dob: Yup.date().required("Date of birth is required"),
  course: Yup.string().required("Select a course"),
  phone: Yup.string().matches(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number").required("Phone number is required"),
  email: Yup.string().email("Enter a valid email address").required("Email address is required"),
  address: Yup.string().required("Address is required"),
  guardianContact: Yup.string().required("Parent/guardian contact is required"),
  roomNo: Yup.string().required("Select a room"),
});

const emptyValues = {
  fullName: "",
  gender: "",
  dob: "",
  course: "",
  phone: "",
  email: "",
  address: "",
  guardianContact: "",
  roomNo: "",
};

export default function AddStudent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [serverError, setServerError] = useState("");

  const { data: studentRes, loading: loadingStudent, error: studentError } = useApiData(id ? `/api/students/${id}` : null);
  const { data: roomsRes, loading: loadingRooms } = useApiData("/api/rooms");

  if (id && loadingStudent) return <Loading />;
  if (id && studentError) {
    return (
      <div>
        <PageHeader title="Student Not Found" />
        <Link to="/students" className="btn btn-primary-soft">Back to Students</Link>
      </div>
    );
  }
  if (loadingRooms) return <Loading />;

  const existing = studentRes?.student || null;
  const rooms = roomsRes?.rooms || [];
  const choices = rooms.filter((r) => r.occupied < r.capacity || r.roomNo === existing?.roomNo);

  const initialValues = existing
    ? {
        fullName: existing.name,
        gender: existing.gender,
        dob: existing.dob,
        course: existing.course,
        phone: existing.phone,
        email: existing.email,
        address: existing.address,
        guardianContact: existing.guardian,
        roomNo: existing.roomNo,
      }
    : emptyValues;

  return (
    <div>
      <PageHeader eyebrow={`Home / Students / ${existing ? "Edit" : "Add"} Student`} title={existing ? "Edit Student" : "Add New Student"} />
      <Notice text={serverError} onClose={() => setServerError("")} />

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          setServerError("");
          const body = {
            name: values.fullName,
            gender: values.gender,
            dob: typeof values.dob === "string" ? values.dob : new Date(values.dob).toISOString().slice(0, 10),
            course: values.course,
            phone: values.phone,
            email: values.email,
            address: values.address,
            guardian: values.guardianContact,
            roomNo: values.roomNo,
          };
          try {
            const res = await apiRequest(existing ? `/api/students/${existing.id}` : "/api/students", {
              method: existing ? "PUT" : "POST",
              body,
            });
            navigate("/students", existing ? undefined : { state: { message: res.message, kind: res.emailed ? "success" : "warning" } });
          } catch (err) {
            setServerError(err.message);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, values }) => {
          const chosen = rooms.find((r) => r.roomNo === values.roomNo);
          return (
            <Form noValidate>
              <div className="row g-3">
                <div className="col-lg-7">
                  <div className="card-surface p-3 h-100">
                    <div className="section-title">Student Details</div>
                    <div className="mb-3">
                      <label className="form-label-sm">Full Name *</label>
                      <Field name="fullName" className="form-control" placeholder="Enter full name" />
                      <ErrorMessage name="fullName" component="div" className="invalid-feedback-block" />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label-sm">Gender *</label>
                        <div className="d-flex gap-3 pt-1">
                          {["Male", "Female", "Other"].map((g) => (
                            <label key={g} className="d-flex align-items-center gap-1" style={{ fontSize: "0.88rem" }}>
                              <Field type="radio" name="gender" value={g} className="form-check-input mt-0" /> {g}
                            </label>
                          ))}
                        </div>
                        <ErrorMessage name="gender" component="div" className="invalid-feedback-block" />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label-sm">Date of Birth *</label>
                        <Field type="date" name="dob" className="form-control" />
                        <ErrorMessage name="dob" component="div" className="invalid-feedback-block" />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label-sm">Course *</label>
                      <Field as="select" name="course" className="form-select">
                        <option value="">Select Course</option>
                        <option>B.Tech</option>
                        <option>B.Com</option>
                        <option>B.A.</option>
                        <option>B.Sc</option>
                        <option>M.Tech</option>
                        <option>BCA</option>
                      </Field>
                      <ErrorMessage name="course" component="div" className="invalid-feedback-block" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label-sm">Phone Number *</label>
                      <Field name="phone" className="form-control" placeholder="Enter phone number" />
                      <ErrorMessage name="phone" component="div" className="invalid-feedback-block" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label-sm">Email Address *</label>
                      <Field type="email" name="email" className="form-control" placeholder="Enter email address" />
                      <ErrorMessage name="email" component="div" className="invalid-feedback-block" />
                      {!existing && (
                        <div className="text-muted-soft mt-1" style={{ fontSize: "0.78rem" }}>
                          The student's login (this email as username, plus a generated password) will be emailed here.
                        </div>
                      )}
                    </div>
                    <div className="mb-0">
                      <label className="form-label-sm">Address *</label>
                      <Field as="textarea" name="address" rows={2} className="form-control" placeholder="Enter address" />
                      <ErrorMessage name="address" component="div" className="invalid-feedback-block" />
                    </div>
                  </div>
                </div>

                <div className="col-lg-5">
                  <div className="card-surface p-3 h-100">
                    <div className="section-title">Room Allocation</div>
                    <div className="mb-3">
                      <label className="form-label-sm">Room No. *</label>
                      <Field as="select" name="roomNo" className="form-select">
                        <option value="">Select Room</option>
                        {choices.map((r) => (
                          <option key={r.id} value={r.roomNo}>
                            Room {r.roomNo} &middot; {r.type} ({r.capacity - r.occupied} free)
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="roomNo" component="div" className="invalid-feedback-block" />
                      {choices.length === 0 && (
                        <div className="text-muted-soft mt-1" style={{ fontSize: "0.8rem" }}>
                          No free rooms. <Link to="/rooms">Add a room</Link> first.
                        </div>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label-sm">Room Type</label>
                      <input className="form-control" value={chosen?.type || ""} placeholder="Set automatically from the room" disabled />
                    </div>
                    <div className="mb-0">
                      <label className="form-label-sm">Parent/Guardian Contact *</label>
                      <Field name="guardianContact" className="form-control" placeholder="Enter contact number" />
                      <ErrorMessage name="guardianContact" component="div" className="invalid-feedback-block" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/students")}>Cancel</button>
                <button type="submit" className="btn btn-primary-soft" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : existing ? "Update Student" : "Save Student"}
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}