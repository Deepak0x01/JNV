import { Link } from "react-router-dom";
import { PageHeader } from "../components/UI";
const reports = [
  { to: "/reports/students", icon: "bi-people-fill", bg: "#2f6fed", title: "Student List", desc: "View, print and download student details" },
  { to: "/rooms", icon: "bi-door-closed-fill", bg: "#22b573", title: "Room Occupancy", desc: "Room-wise occupancy report" },
  { to: "/fees", icon: "bi-currency-rupee", bg: "#8b5cf6", title: "Fee Collection", desc: "Payment and pending dues report" },
  { to: "/complaints", icon: "bi-flag-fill", bg: "#e5484d", title: "Complaint Report", desc: "Track complaints and status" },
];
export default function Reports() {
  return (
    <div>
      <PageHeader eyebrow="Home / Reports" title="Reports" />
      <div className="row g-3">
        {reports.map((r) => (
          <div className="col-6 col-lg-4" key={r.title}>
            <Link to={r.to} className="card-surface p-4 d-block h-100 text-decoration-none text-dark">
              <div className="stat-icon mb-3" style={{ background: r.bg }}>
                <i className={`bi ${r.icon}`} />
              </div>
              <div className="fw-bold mb-1">{r.title}</div>
              <div className="text-muted-soft" style={{ fontSize: "0.82rem" }}>{r.desc}</div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}