import { Link } from "react-router-dom";
import { PageHeader, StatusPill, StatCard, Loading, Notice, EmptyState } from "../components/UI";
import useApiData from "../hooks/useApiData";
import { rupees } from "../utils/format";

export default function MyDetails() {
  const me = useApiData("/api/me/student");
  const fees = useApiData("/api/fees");
  const complaints = useApiData("/api/complaints");

  if (me.loading) return <Loading />;
  if (me.error) return <Notice text={me.error} />;

  const { student, room } = me.data;
  const feeList = fees.data?.fees || [];
  const complaintList = complaints.data?.complaints || [];
  const paid = feeList.filter((f) => f.status === "Paid").reduce((n, f) => n + f.amount, 0);
  const due = feeList.filter((f) => f.status === "Pending").reduce((n, f) => n + f.amount, 0);
  const openComplaints = complaintList.filter((c) => c.status !== "Resolved").length;

  const rows = [
    ["Student ID", student.id],
    ["Gender", student.gender],
    ["Date of Birth", student.dob],
    ["Course", student.course],
    ["Phone Number", student.phone],
    ["Email Address", student.email],
    ["Address", student.address],
    ["Parent/Guardian Contact", student.guardian],
    ["Room No.", student.roomNo || "-"],
    ["Room Type", student.roomType || "-"],
    ["Block", room ? `Block ${room.block}` : "-"],
  ];

  return (
    <div>
      <PageHeader eyebrow="Home / My Details" title="My Details" />

      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-4">
          <StatCard icon="bi-currency-rupee" iconBg="#22b573" value={rupees(paid).replace("₹", "")} label="Fees Paid" />
        </div>
        <div className="col-6 col-lg-4">
          <StatCard icon="bi-hourglass-split" iconBg="#f5a623" value={rupees(due).replace("₹", "")} label="Fees Due" />
        </div>
        <div className="col-12 col-lg-4">
          <StatCard icon="bi-chat-left-text-fill" iconBg="#8b5cf6" value={openComplaints} label="Open Complaints" />
        </div>
      </div>

      <div className="card-surface p-4 mb-3">
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="avatar-circle" style={{ width: 56, height: 56, fontSize: "1.3rem" }}>{student.name.charAt(0)}</div>
          <div>
            <div className="fw-bold" style={{ fontSize: "1.1rem" }}>{student.name}</div>
            <StatusPill status={student.status} />
          </div>
        </div>
        <div className="row">
          {rows.map(([label, value]) => (
            <div className="col-md-6 mb-3" key={label}>
              <div className="text-muted-soft" style={{ fontSize: "0.78rem" }}>{label}</div>
              <div style={{ fontSize: "0.92rem", fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
        <div className="text-muted-soft" style={{ fontSize: "0.8rem" }}>
          These details are managed by the hostel admin.
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card-surface p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="section-title mb-0">Recent Fee Payments</div>
              <Link to="/fees" style={{ fontSize: "0.82rem" }}>Pay / View All</Link>
            </div>
            <div className="table-responsive">
              <table className="table table-surface mb-0">
                <thead>
                  <tr><th>Date</th><th>Amount</th><th>Mode</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {feeList.slice(0, 5).map((f) => (
                    <tr key={f.id}>
                      <td>{f.date}</td>
                      <td>&#8377;{f.amount.toLocaleString("en-IN")}</td>
                      <td>{f.mode}</td>
                      <td><StatusPill status={f.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {feeList.length === 0 && <EmptyState icon="bi-currency-rupee" text="No payments yet." />}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card-surface p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="section-title mb-0">My Complaints</div>
              <Link to="/complaints" style={{ fontSize: "0.82rem" }}>View All</Link>
            </div>
            <div className="table-responsive">
              <table className="table table-surface mb-0">
                <thead>
                  <tr><th>ID</th><th>Type</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {complaintList.slice(0, 5).map((c) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.type}</td>
                      <td><StatusPill status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {complaintList.length === 0 && <EmptyState icon="bi-chat-left-text" text="No complaints raised yet." />}
            </div>
            <Link to="/complaints/add" className="btn btn-primary-soft mt-3">
              <i className="bi bi-plus-lg me-1" />Raise Complaint
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
