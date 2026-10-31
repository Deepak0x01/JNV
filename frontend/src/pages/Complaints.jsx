import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, StatusPill, Modal, ConfirmModal, Loading, Notice, EmptyState } from "../components/UI";
import useApiData from "../hooks/useApiData";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api";

const STATUSES = ["Open", "In Progress", "Pending", "Resolved"];

export default function Complaints() {
  const { isStudent } = useAuth();
  const { data, loading, error, reload } = useApiData("/api/complaints");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const complaints = data?.complaints || [];
  const types = ["All Types", ...new Set(complaints.map((c) => c.type))];

  const filtered = complaints.filter(
    (c) => (statusFilter === "All Status" || c.status === statusFilter) && (typeFilter === "All Types" || c.type === typeFilter)
  );

  const setStatus = async (c, status) => {
    setActionError("");
    try {
      const res = await apiRequest(`/api/complaints/${c.id}`, { method: "PATCH", body: { status } });
      setViewing((v) => (v && v.id === c.id ? res.complaint : v));
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await apiRequest(`/api/complaints/${deleteTarget.id}`, { method: "DELETE" });
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
        eyebrow={isStudent ? "Home / My Complaints" : "Home / Complaints"}
        title={isStudent ? "My Complaints" : "Complaints"}
        action={
          <Link to="/complaints/add" className="btn btn-primary-soft">
            <i className="bi bi-plus-lg me-1" />New Complaint
          </Link>
        }
      />
      <Notice text={actionError} onClose={() => setActionError("")} />

      <div className="card-surface p-3">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <select className="form-select" style={{ maxWidth: "160px" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All Status</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="form-select" style={{ maxWidth: "160px" }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {types.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <Notice text={error} />
        ) : (
          <div className="table-responsive">
            <table className="table table-surface mb-0">
              <thead>
                <tr>
                  <th>ID</th>{!isStudent && <th>Student Name</th>}<th>Room No.</th><th>Type</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    {!isStudent && <td>{c.student}</td>}
                    <td>{c.roomNo || "-"}</td>
                    <td>{c.type}</td>
                    <td><StatusPill status={c.status} /></td>
                    <td>
                      <button className="icon-action-btn" title="View" onClick={() => setViewing(c)}><i className="bi bi-eye" /></button>
                      {!isStudent && c.status !== "Resolved" && (
                        <button className="icon-action-btn" title="Mark Resolved" onClick={() => setStatus(c, "Resolved")}>
                          <i className="bi bi-check-lg" />
                        </button>
                      )}
                      {!isStudent && (
                        <button className="icon-action-btn danger" title="Delete" onClick={() => setDeleteTarget(c)}><i className="bi bi-trash" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <EmptyState icon="bi-chat-left-text" text={complaints.length === 0 ? "No complaints raised yet." : "No complaints match the filters."} />
            )}
          </div>
        )}
      </div>

      {viewing && (
        <Modal title={`Complaint ${viewing.id}`} onClose={() => setViewing(null)}>
          <div className="row mb-2" style={{ fontSize: "0.9rem" }}>
            <div className="col-6 mb-2"><div className="text-muted-soft" style={{ fontSize: "0.78rem" }}>Student</div>{viewing.student}</div>
            <div className="col-6 mb-2"><div className="text-muted-soft" style={{ fontSize: "0.78rem" }}>Room</div>{viewing.roomNo || "-"}</div>
            <div className="col-6 mb-2"><div className="text-muted-soft" style={{ fontSize: "0.78rem" }}>Type</div>{viewing.type}</div>
            <div className="col-6 mb-2"><div className="text-muted-soft" style={{ fontSize: "0.78rem" }}>Priority</div>{viewing.priority}</div>
            <div className="col-6 mb-2"><div className="text-muted-soft" style={{ fontSize: "0.78rem" }}>Raised on</div>{viewing.date}</div>
          </div>
          <div className="text-muted-soft" style={{ fontSize: "0.78rem" }}>Description</div>
          <p style={{ fontSize: "0.9rem" }}>{viewing.description}</p>
          <label className="form-label-sm">Status</label>
          {isStudent ? (
            <div><StatusPill status={viewing.status} /></div>
          ) : (
            <select className="form-select" value={viewing.status} onChange={(e) => setStatus(viewing, e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          )}
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmModal title="Delete Complaint" onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} busy={busy}>
          Delete complaint <strong>{deleteTarget.id}</strong> from {deleteTarget.student}?
        </ConfirmModal>
      )}
    </div>
  );
}