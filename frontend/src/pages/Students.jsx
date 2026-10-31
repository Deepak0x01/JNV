import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader, StatusPill, EmptyState, Loading, Notice, ConfirmModal } from "../components/UI";
import useApiData from "../hooks/useApiData";
import useSettings from "../hooks/useSettings";
import { apiRequest } from "../api";
const PAGE_SIZE = 8;
export default function Students() {
  const { data, loading, error, reload } = useApiData("/api/students");
  const { roomTypes } = useSettings();
  const [params] = useSearchParams();
  const location = useLocation();
  const search = params.get("q") || "";
  const [roomFilter, setRoomFilter] = useState("All Rooms");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState(
    location.state?.message ? { kind: location.state.kind || "success", text: location.state.message } : { kind: "success", text: "" }
  );
  const navigate = useNavigate();

  const students = data?.students || [];
  const typeOptions = ["All Rooms", ...roomTypes.map((t) => t.name)];

  const term = search.trim().toLowerCase();
  const filtered = students.filter((s) => {
    const matchesSearch =
      !term ||
      s.name.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term) ||
      (s.roomNo || "").toLowerCase().includes(term);
    const matchesRoom = roomFilter === "All Rooms" || s.roomType === roomFilter;
    const matchesStatus = statusFilter === "All Status" || s.status === statusFilter;
    return matchesSearch && matchesRoom && matchesStatus;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  useEffect(() => setPage(1), [term, roomFilter, statusFilter]);

  const confirmDelete = async () => {
    setBusy(true);
    setActionError("");
    try {
      await apiRequest(`/api/students/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setActionError(err.message);
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Home / Students"
        title="Students"
        action={
          <Link to="/students/add" className="btn btn-primary-soft">
            <i className="bi bi-plus-lg me-1" />Add Student
          </Link>
        }
      />
      <Notice text={actionError} onClose={() => setActionError("")} />
      <Notice kind={notice.kind} text={notice.text} onClose={() => setNotice({ ...notice, text: "" })} />

      <div className="card-surface p-3">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <div className="position-relative flex-grow-1" style={{ minWidth: "220px" }}>
            <i className="bi bi-search position-absolute" style={{ left: 12, top: 10, color: "#7c8aa3" }} />
            <input
              className="form-control"
              style={{ paddingLeft: "34px" }}
              placeholder="Search by name, ID, or room number"
              value={search}
              onChange={(e) => navigate(e.target.value ? `/students?q=${encodeURIComponent(e.target.value)}` : "/students", { replace: true })}
            />
          </div>
          <select className="form-select" style={{ maxWidth: "160px" }} value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
            {typeOptions.map((r) => <option key={r}>{r}</option>)}
          </select>
          <select className="form-select" style={{ maxWidth: "160px" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All Status</option>
            <option>Allocated</option>
            <option>Vacated</option>
          </select>
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <Notice text={error} />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-surface mb-0">
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Gender</th><th>Course</th><th>Room No.</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.name}</td>
                      <td>{s.gender}</td>
                      <td>{s.course}</td>
                      <td>{s.roomNo || "-"}</td>
                      <td><StatusPill status={s.status} /></td>
                      <td>
                        <button className="icon-action-btn" title="View" onClick={() => navigate(`/students/${s.id}`)}>
                          <i className="bi bi-eye" />
                        </button>
                        <button className="icon-action-btn" title="Edit" onClick={() => navigate(`/students/${s.id}/edit`)}>
                          <i className="bi bi-pencil" />
                        </button>
                        <button className="icon-action-btn danger" title="Delete" onClick={() => setDeleteTarget(s)}>
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <EmptyState icon="bi-people" text={students.length === 0 ? "No students yet. Click Add Student to get started." : "No students match your search."} />
              )}
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
              <span className="text-muted-soft" style={{ fontSize: "0.8rem" }}>Showing {visible.length} of {filtered.length} students</span>
              {pages > 1 && (
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${current === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setPage(current - 1)}>&laquo;</button>
                    </li>
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                      <li key={p} className={`page-item ${p === current ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                      </li>
                    ))}
                    <li className={`page-item ${current === pages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setPage(current + 1)}>&raquo;</button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal title="Delete Student" onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} busy={busy}>
          Are you sure you want to remove <strong>{deleteTarget.name}</strong> ({deleteTarget.id}) from the hostel records?
          {deleteTarget.roomNo && <> Room {deleteTarget.roomNo} will be freed up. Their login will also be removed.</>}
          {!deleteTarget.roomNo && <> Their login will also be removed.</>}
        </ConfirmModal>
      )}
    </div>
  );
}