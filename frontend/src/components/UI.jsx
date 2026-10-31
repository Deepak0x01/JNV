export function PageHeader({ eyebrow, title, action }) {
  return (
    <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div>
        {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
        <div className="page-title mb-0">{title}</div>
      </div>
      {action}
    </div>
  );
}

export function StatCard({ icon, iconBg, value, label, trend, trendDir, illustration }) {
  return (
    <div className="card-surface stat-card h-100">
      <div className="stat-icon" style={{ background: iconBg }}>
        <i className={`bi ${icon}`} />
      </div>
      <div className="flex-grow-1">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {trend && (
          <div style={{ fontSize: "0.76rem" }}>
            <span className={trendDir === "down" ? "trend-down" : "trend-up"}>
              <i className={`bi bi-arrow-${trendDir === "down" ? "down" : "up"}-short`} />
              {trend}
            </span>{" "}
            <span className="text-muted-soft">vs last month</span>
          </div>
        )}
      </div>
      {illustration && <div className="stat-illustration">{illustration}</div>}
    </div>
  );
}

const pillMap = {
  Allocated: "pill-allocated",
  Vacated: "pill-vacated",
  Paid: "pill-paid",
  Pending: "pill-pending",
  Resolved: "pill-resolved",
  Open: "pill-open",
  "In Progress": "pill-progress",
  Occupied: "pill-occupied",
  Partial: "pill-progress",
  Vacant: "pill-vacant",
  Unoccupied: "pill-vacant",
};

export function StatusPill({ status }) {
  return <span className={`status-pill ${pillMap[status] || "pill-vacant"}`}>{status}</span>;
}

export function Modal({ title, onClose, children, width = "520px" }) {
  return (
    <div className="modal-backdrop-custom" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card-surface" style={{ width: "100%", maxWidth: width, padding: "24px", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="section-title mb-0">{title}</div>
          <button className="icon-action-btn" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon = "bi-inbox", text = "Nothing to show yet." }) {
  return (
    <div className="text-center py-5 text-muted-soft">
      <i className={`bi ${icon}`} style={{ fontSize: "2rem" }} />
      <div className="mt-2">{text}</div>
    </div>
  );
}

export function Loading() {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status" />
    </div>
  );
}

export function Notice({ kind = "danger", text, onClose }) {
  if (!text) return null;
  return (
    <div className={`alert alert-${kind} py-2 d-flex justify-content-between align-items-center`} style={{ fontSize: "0.85rem" }}>
      <span>{text}</span>
      {onClose && <button type="button" className="btn-close" style={{ fontSize: "0.6rem" }} onClick={onClose} aria-label="Dismiss" />}
    </div>
  );
}

export function ConfirmModal({ title, children, confirmText = "Delete", onConfirm, onClose, busy }) {
  return (
    <Modal title={title} onClose={onClose} width="420px">
      <div className="text-muted-soft mb-3">{children}</div>
      <div className="d-flex gap-2 justify-content-end">
        <button className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? "Please wait..." : confirmText}
        </button>
      </div>
    </Modal>
  );
}
