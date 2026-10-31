import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { PageHeader, StatusPill, Modal, ConfirmModal, Loading, Notice, EmptyState } from "../components/UI";
import useApiData from "../hooks/useApiData";
import useSettings from "../hooks/useSettings";
import { apiRequest } from "../api";

const schema = Yup.object({
  roomNo: Yup.string().required("Room number is required"),
  type: Yup.string().required("Select a room type"),
  capacity: Yup.number().min(1, "Capacity must be at least 1").required("Capacity is required"),
  block: Yup.string().required("Select a block"),
});

export default function Rooms() {
  const { data, loading, error, reload } = useApiData("/api/rooms");
  const { roomTypes } = useSettings();
  const [typeFilter, setTypeFilter] = useState("All Room Types");
  const [blockFilter, setBlockFilter] = useState("All Blocks");
  const [editing, setEditing] = useState(null); // null = closed, {} = add, room = edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [formError, setFormError] = useState("");

  const rooms = data?.rooms || [];
  const types = ["All Room Types", ...new Set(rooms.map((r) => r.type))];
  const blocks = ["All Blocks", ...new Set(rooms.map((r) => r.block))].sort();

  const filtered = rooms.filter(
    (r) => (typeFilter === "All Room Types" || r.type === typeFilter) && (blockFilter === "All Blocks" || r.block === blockFilter)
  );

  const isEdit = Boolean(editing?.id);
  const closeForm = () => {
    setEditing(null);
    setFormError("");
  };

  const confirmDelete = async () => {
    setBusy(true);
    setActionError("");
    try {
      await apiRequest(`/api/rooms/${deleteTarget.id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDeleteTarget(null);
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Home / Rooms"
        title="Rooms"
        action={
          <button className="btn btn-primary-soft" onClick={() => setEditing({})}>
            <i className="bi bi-plus-lg me-1" />Add Room
          </button>
        }
      />
      <Notice text={actionError} onClose={() => setActionError("")} />

      <div className="d-flex flex-wrap gap-2 mb-3">
        <select className="form-select" style={{ maxWidth: "170px" }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          {types.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: "150px" }} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
          {blocks.map((b) => <option key={b} value={b}>{b === "All Blocks" ? b : `Block ${b}`}</option>)}
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <Notice text={error} />
      ) : filtered.length === 0 ? (
        <div className="card-surface">
          <EmptyState icon="bi-door-closed" text={rooms.length === 0 ? "No rooms yet. Click Add Room to create one." : "No rooms match the filters."} />
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map((r) => (
            <div className="col-6 col-md-4 col-lg-3" key={r.id}>
              <div className="card-surface p-3 h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="fw-bold" style={{ fontSize: "1.05rem" }}>Room {r.roomNo}</div>
                    <div className="text-muted-soft" style={{ fontSize: "0.78rem" }}>Block {r.block} &middot; {r.type}</div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
                <div className="d-flex justify-content-between text-muted-soft" style={{ fontSize: "0.82rem" }}>
                  <span>Capacity</span>
                  <span className="fw-semibold text-dark">{r.capacity}</span>
                </div>
                <div className="d-flex justify-content-between text-muted-soft" style={{ fontSize: "0.82rem" }}>
                  <span>Occupied</span>
                  <span className="fw-semibold text-dark">{r.occupied}</span>
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button className="icon-action-btn" title="Edit" onClick={() => setEditing(r)}><i className="bi bi-pencil" /></button>
                  <button className="icon-action-btn danger" title="Delete" onClick={() => setDeleteTarget(r)}><i className="bi bi-trash" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={isEdit ? `Edit Room ${editing.roomNo}` : "Add Room"} onClose={closeForm}>
          <Notice text={formError} />
          <Formik
            initialValues={{
              roomNo: editing.roomNo || "",
              type: editing.type || "",
              capacity: editing.capacity || "",
              block: editing.block || "",
            }}
            validationSchema={schema}
            onSubmit={async (values, { setSubmitting }) => {
              setFormError("");
              try {
                const body = { ...values, capacity: Number(values.capacity) };
                if (isEdit) {
                  delete body.roomNo; 
                  await apiRequest(`/api/rooms/${editing.id}`, { method: "PUT", body });
                } else {
                  await apiRequest("/api/rooms", { method: "POST", body });
                }
                closeForm();
                reload();
              } catch (err) {
                setFormError(err.message);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, setFieldValue }) => (
              <Form noValidate>
                <div className="mb-3">
                  <label className="form-label-sm">Room No.</label>
                  <Field name="roomNo" className="form-control" placeholder="e.g. 105" disabled={isEdit} />
                  <ErrorMessage name="roomNo" component="div" className="invalid-feedback-block" />
                </div>
                <div className="mb-3">
                  <label className="form-label-sm">Room Type</label>
                  <Field
                    as="select"
                    name="type"
                    className="form-select"
                    onChange={(e) => {
                      setFieldValue("type", e.target.value);
                      const t = roomTypes.find((rt) => rt.name === e.target.value);
                      setFieldValue("capacity", t ? t.capacity : "");
                    }}
                  >
                    <option value="">Select Room Type</option>
                    {roomTypes.map((t) => <option key={t.name}>{t.name}</option>)}
                    {isEdit && !roomTypes.some((t) => t.name === editing.type) && <option>{editing.type}</option>}
                  </Field>
                  <ErrorMessage name="type" component="div" className="invalid-feedback-block" />
                </div>
                <div className="mb-3">
                  <label className="form-label-sm">Capacity</label>
                  <Field type="number" name="capacity" className="form-control" placeholder="Capacity" min={editing.occupied || 1} />
                  <ErrorMessage name="capacity" component="div" className="invalid-feedback-block" />
                </div>
                <div className="mb-4">
                  <label className="form-label-sm">Block</label>
                  <Field as="select" name="block" className="form-select">
                    <option value="">Select Block</option>
                    <option>Udaigiri</option><option>Nilgiri</option><option>Aravali</option><option>Shivalik</option>
                  </Field>
                  <ErrorMessage name="block" component="div" className="invalid-feedback-block" />
                </div>
                <div className="d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeForm}>Cancel</button>
                  <button type="submit" className="btn btn-primary-soft" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Add Room"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmModal title="Delete Room" onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} busy={busy}>
          Delete <strong>Room {deleteTarget.roomNo}</strong>? Rooms that still have students can't be deleted.
        </ConfirmModal>
      )}
    </div>
  );
}