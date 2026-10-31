import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { PageHeader, Loading, Notice, ConfirmModal, EmptyState } from "../components/UI";
import useApiData from "../hooks/useApiData";
import { apiRequest } from "../api";
import { today } from "../utils/format";

const schema = Yup.object({
  student: Yup.string().required("Select a student"),
  room: Yup.string().required("Select a room"),
  date: Yup.date().required("Allocation date is required"),
  notes: Yup.string(),
});

export default function RoomAllocation() {
  const students = useApiData("/api/students");
  const rooms = useApiData("/api/rooms");
  const allocations = useApiData("/api/allocations");
  const [message, setMessage] = useState({ kind: "danger", text: "" });
  const [removeTarget, setRemoveTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const reloadAll = () => {
    students.reload();
    rooms.reload();
    allocations.reload();
  };

  if (students.loading || rooms.loading || allocations.loading) return <Loading />;
  const loadError = students.error || rooms.error || allocations.error;
  if (loadError) return <Notice text={loadError} />;

  const studentList = students.data.students;
  const freeRooms = rooms.data.rooms.filter((r) => r.occupied < r.capacity);

  const removeAllocation = async () => {
    setBusy(true);
    try {
      const res = await apiRequest(`/api/allocations/${removeTarget.id}`, { method: "DELETE" });
      setMessage({ kind: "success", text: res.message });
      reloadAll();
    } catch (err) {
      setMessage({ kind: "danger", text: err.message });
    } finally {
      setRemoveTarget(null);
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Home / Allocations / Allocate Room" title="Allocate Room" />
      <Notice kind={message.kind} text={message.text} onClose={() => setMessage({ kind: "danger", text: "" })} />

      <div className="row g-3">
        <div className="col-lg-5">
          <div className="card-surface p-3">
            <div className="section-title">New Allocation</div>
            <Formik
              initialValues={{ student: "", room: "", date: today(), notes: "" }}
              validationSchema={schema}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                setMessage({ kind: "danger", text: "" });
                try {
                  const res = await apiRequest("/api/allocations", {
                    method: "POST",
                    body: { studentId: values.student, roomNo: values.room, date: values.date, notes: values.notes },
                  });
                  setMessage({ kind: "success", text: res.message });
                  resetForm({ values: { student: "", room: "", date: today(), notes: "" } });
                  reloadAll();
                } catch (err) {
                  setMessage({ kind: "danger", text: err.message });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form noValidate>
                  <div className="mb-3">
                    <label className="form-label-sm">Select Student</label>
                    <Field as="select" name="student" className="form-select">
                      <option value="">Choose Student</option>
                      {studentList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.id}){s.roomNo ? ` - Room ${s.roomNo}` : ""}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="student" component="div" className="invalid-feedback-block" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label-sm">Select Room</label>
                    <Field as="select" name="room" className="form-select">
                      <option value="">Choose Room</option>
                      {freeRooms.map((r) => (
                        <option key={r.id} value={r.roomNo}>
                          Room {r.roomNo} &middot; {r.type} ({r.capacity - r.occupied} free)
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="room" component="div" className="invalid-feedback-block" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label-sm">Allocation Date</label>
                    <Field type="date" name="date" className="form-control" />
                    <ErrorMessage name="date" component="div" className="invalid-feedback-block" />
                  </div>
                  <div className="mb-4">
                    <label className="form-label-sm">Notes (optional)</label>
                    <Field as="textarea" name="notes" rows={2} className="form-control" placeholder="Enter notes (optional)" />
                  </div>
                  <div className="d-flex gap-2 justify-content-end">
                    <button type="reset" className="btn btn-outline-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary-soft" disabled={isSubmitting}>
                      {isSubmitting ? "Allocating..." : "Allocate Room"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card-surface p-3">
            <div className="section-title">Current Allocations</div>
            <div className="table-responsive">
              <table className="table table-surface mb-0">
                <thead>
                  <tr>
                    <th>Student Name</th><th>Room No.</th><th>Room Type</th><th>Since</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.data.allocations.map((a) => (
                    <tr key={a.id}>
                      <td>{a.studentName}</td>
                      <td>{a.roomNo}</td>
                      <td>{a.roomType}</td>
                      <td>{a.date}</td>
                      <td>
                        <button className="icon-action-btn danger" title="Remove allocation" onClick={() => setRemoveTarget(a)}>
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allocations.data.allocations.length === 0 && <EmptyState icon="bi-link-45deg" text="No allocations yet." />}
            </div>
          </div>
        </div>
      </div>

      {removeTarget && (
        <ConfirmModal title="Remove Allocation" confirmText="Remove" onClose={() => setRemoveTarget(null)} onConfirm={removeAllocation} busy={busy}>
          Remove <strong>{removeTarget.studentName}</strong> from Room {removeTarget.roomNo}? The student will be marked as vacated.
        </ConfirmModal>
      )}
    </div>
  );
}