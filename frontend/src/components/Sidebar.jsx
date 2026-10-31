import { NavLink } from "react-router-dom";
import hostelBuilding from "../assets/hostel-building.png";
import { useAuth } from "../context/AuthContext";
const adminLinks = [
  { to: "/", icon: "bi-grid-1x2-fill", label: "Dashboard", end: true },
  { to: "/students", icon: "bi-people-fill", label: "Students" },
  { to: "/rooms", icon: "bi-door-closed-fill", label: "Rooms" },
  { to: "/allocations", icon: "bi-link-45deg", label: "Allocations" },
  { to: "/fees", icon: "bi-currency-rupee", label: "Fees" },
  { to: "/complaints", icon: "bi-chat-left-text-fill", label: "Complaints" },
  { to: "/reports", icon: "bi-bar-chart-fill", label: "Reports" },
  { to: "/admins", icon: "bi-shield-lock-fill", label: "Admins" },
  { to: "/settings", icon: "bi-gear-fill", label: "Settings" },
];
const studentLinks = [
  { to: "/", icon: "bi-person-vcard-fill", label: "My Details", end: true },
  { to: "/fees", icon: "bi-currency-rupee", label: "My Fees" },
  { to: "/complaints", icon: "bi-chat-left-text-fill", label: "My Complaints" },
  { to: "/profile", icon: "bi-person-circle", label: "My Profile" },
];

export default function Sidebar() {
  const { isStudent } = useAuth();
  const links = isStudent ? studentLinks : adminLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">
          <i className="bi bi-house-door-fill" />
        </span>
       HostelHub
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <i className={`bi ${link.icon}`} />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-illustration">
        <img src={hostelBuilding} alt="Hostel building" className="sidebar-illustration-img" />
        <div className="sidebar-illustration-caption">
          A Safe Stay
          <br />
          Builds a Brighter Future
        </div>
      </div>
    </aside>
  );
}
