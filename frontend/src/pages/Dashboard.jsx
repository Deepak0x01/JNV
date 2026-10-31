import { Link } from "react-router-dom";
import { StatCard, Loading, Notice, StatusPill, EmptyState } from "../components/UI";
import useApiData from "../hooks/useApiData";
import { useAuth } from "../context/AuthContext";
import { rupees, timeAgo } from "../utils/format";
import welcomeRoomBanner from "../assets/welcome-room-banner.png";
import studentsGroup from "../assets/students-group.png";
import occupiedRoom from "../assets/occupied-room.png";
import vacantRoom from "../assets/vacant-room.png";
import feePayment from "../assets/fee-payment.png";

const activityIconMap = {
  student: { icon: "bi-person-plus-fill", bg: "#22b573" },
  room: { icon: "bi-door-open-fill", bg: "#2f6fed" },
  fee: { icon: "bi-currency-rupee", bg: "#8b5cf6" },
  complaint: { icon: "bi-chat-left-text-fill", bg: "#f5a623" },
};

const quickActions = [
  { to: "/students/add", icon: "bi-person-plus-fill", bg: "#2f6fed", label: "Add New Student" },
  { to: "/allocations", icon: "bi-door-open-fill", bg: "#22b573", label: "Allocate Room" },
  { to: "/fees", icon: "bi-currency-rupee", bg: "#8b5cf6", label: "Record Fee Payment" },
  { to: "/complaints/add", icon: "bi-megaphone-fill", bg: "#f5a623", label: "Raise Complaint" },
];

function DonutChart({ percent }) {
  const size = 150;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e8f0fe" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#2f6fed"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - percent / 100)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="46%" textAnchor="middle" fontSize="22" fontWeight="700" fill="#10213f">{percent}%</text>
      <text x="50%" y="62%" textAnchor="middle" fontSize="11" fill="#7c8aa3">Beds filled</text>
    </svg>
  );
}

function BarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="d-flex align-items-end justify-content-around" style={{ height: "170px" }}>
      {data.map((d) => (
        <div key={d.label} className="text-center" style={{ width: `${Math.min(22, 90 / data.length)}%` }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: 4 }}>{d.value}</div>
          <div
            style={{
              height: `${Math.max(2, (d.value / max) * 120)}px`,
              background: d.color,
              borderRadius: "6px 6px 0 0",
              margin: "0 auto",
              width: "60%",
            }}
          />
          <div className="text-muted-soft" style={{ fontSize: "0.7rem", marginTop: 4 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, loading, error } = useApiData("/api/dashboard");
  const { data: act } = useApiData("/api/dashboard/activity?limit=5");

  if (loading) return <Loading />;
  if (error) return <Notice text={error} />;

  const recentActivity = act?.activity || [];

  return (
    <div>
      <div className="card-surface welcome-banner mb-4">
        <div className="welcome-banner-text">
          <h4 className="fw-bold mb-1">Welcome, {user?.name?.split(" ")[0] || "Admin"}!</h4>
          <p className="mb-3 opacity-75" style={{ fontSize: "0.9rem" }}>Here's what's happening in your hostel today.</p>
          <div className="d-flex align-items-center gap-2 opacity-90" style={{ fontSize: "0.82rem" }}>
            <i className="bi bi-calendar3" />
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            <span className="mx-1">&middot;</span>
            Good management creates a better living experience.
          </div>
        </div>
        <div className="welcome-banner-art">
          <img src={welcomeRoomBanner} alt="Hostel room" className="welcome-banner-img" />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-people-fill" iconBg="#2f6fed" value={stats.totalStudents} label="Total Students" illustration={<img src={studentsGroup} alt="Students" className="stat-illustration-img" />} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-door-closed-fill" iconBg="#22b573" value={stats.occupiedRooms} label="Occupied Rooms" illustration={<img src={occupiedRoom} alt="Occupied room" className="stat-illustration-img" />} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-door-open-fill" iconBg="#f5a623" value={stats.vacantRooms} label="Vacant Rooms" illustration={<img src={vacantRoom} alt="Vacant room" className="stat-illustration-img" />} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bi-currency-rupee" iconBg="#8b5cf6" value={rupees(stats.pendingFees).replace("₹", "")} label="Pending Fees" illustration={<img src={feePayment} alt="Fee payment" className="stat-illustration-img" />} />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-6">
          <div className="card-surface p-3 h-100">
            <div className="section-title">Room Occupancy</div>
            <div className="d-flex align-items-center gap-4">
              <DonutChart percent={stats.occupancyPercent} />
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: "#2f6fed", display: "inline-block" }} />
                  <span style={{ fontSize: "0.85rem" }}>Occupied Rooms</span>
                  <span className="ms-auto fw-bold" style={{ fontSize: "0.85rem" }}>{stats.occupiedRooms}</span>
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: "#e8f0fe", display: "inline-block" }} />
                  <span style={{ fontSize: "0.85rem" }}>Vacant Rooms</span>
                  <span className="ms-auto fw-bold" style={{ fontSize: "0.85rem" }}>{stats.vacantRooms}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: "0.85rem" }}>Total Rooms</span>
                  <span className="ms-auto fw-bold" style={{ fontSize: "0.85rem" }}>{stats.totalRooms}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card-surface p-3 h-100">
            <div className="section-title">Students by Room Type</div>
            <BarChart data={stats.studentsByRoomType} />
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card-surface p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="section-title mb-0">Recent Student Registrations</div>
              <Link to="/students" style={{ fontSize: "0.82rem" }}>View All</Link>
            </div>
            <div className="table-responsive">
              <table className="table table-surface mb-0">
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Room No.</th><th>Room Type</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="avatar-circle" style={{ width: 30, height: 30, fontSize: "0.75rem" }}>
                            {s.name.charAt(0)}
                          </span>
                          {s.name}
                        </div>
                      </td>
                      <td>{s.roomNo || "-"}</td>
                      <td>{s.roomType || "-"}</td>
                      <td><StatusPill status={s.status} /></td>
                      <td>
                        <Link className="icon-action-btn" to={`/students/${s.id}`} title="View">
                          <i className="bi bi-eye" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stats.recentStudents.length === 0 && <EmptyState icon="bi-people" text="No students yet. Add your first student." />}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card-surface p-3 mb-3">
            <div className="section-title"><i className="bi bi-lightning-charge-fill text-warning me-1" />Quick Actions</div>
            {quickActions.map((a) => (
              <Link key={a.to} to={a.to} className="quick-action-item">
                <span className="quick-action-icon" style={{ background: a.bg }}>
                  <i className={`bi ${a.icon}`} />
                </span>
                {a.label}
                <i className="bi bi-chevron-right ms-auto text-muted-soft" />
              </Link>
            ))}
          </div>

          <div className="card-surface p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="section-title mb-0">Recent Activity</div>
              <Link to="/notifications" style={{ fontSize: "0.82rem" }}>View All</Link>
            </div>
            {recentActivity.length === 0 && <div className="text-muted-soft" style={{ fontSize: "0.85rem" }}>No activity yet.</div>}
            {recentActivity.map((a, i) => {
              const meta = activityIconMap[a.type] || activityIconMap.student;
              return (
                <div key={i} className="d-flex gap-2 mb-3">
                  <span className="activity-icon" style={{ background: meta.bg }}>
                    <i className={`bi ${meta.icon}`} />
                  </span>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{a.title}</div>
                    <div className="text-muted-soft" style={{ fontSize: "0.8rem" }}>{a.detail}</div>
                    <div className="text-muted-soft" style={{ fontSize: "0.72rem" }}>{timeAgo(a.at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
