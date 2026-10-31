import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api";

const ALERT_REFRESH_MS = 30000;

export default function Topbar() {
  const { user, isStudent } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  useEffect(() => {
    if (isStudent) return undefined;
    let cancelled = false;
    const load = () =>
      apiRequest("/api/dashboard")
        .then((d) => !cancelled && setUnreadAlerts(d.unreadAlerts || 0))
        .catch(() => {});
    load();
    const timer = setInterval(load, ALERT_REFRESH_MS);
    window.addEventListener("hms:notifications-seen", load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("hms:notifications-seen", load);
    };
  }, [isStudent, location.pathname]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/students?q=${encodeURIComponent(q)}` : "/students");
  };

  return (
    <header className="topbar no-print">
      {!isStudent && (
        <form className="topbar-search" onSubmit={submitSearch}>
          <i className="bi bi-search" />
          <input
            type="text"
            placeholder="Search students by name, ID or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      )}
      <div className="ms-auto d-flex align-items-center gap-3">
        {!isStudent && (
          <Link to="/notifications" className="topbar-icon-btn" title="Notifications">
            <i className="bi bi-bell-fill" />
            {unreadAlerts > 0 && <span className="badge-dot">{unreadAlerts > 99 ? "99+" : unreadAlerts}</span>}
          </Link>
        )}
        <div className="topbar-user position-relative" ref={menuRef} onClick={() => setMenuOpen((o) => !o)}>
          <div className="avatar-circle">{(user?.name || "A").charAt(0).toUpperCase()}</div>
          <div className="d-none d-md-block">
            <div style={{ fontWeight: 600, fontSize: "0.9rem", lineHeight: 1.1 }}>{user?.name || "Admin"}</div>
            <div className="text-muted-soft" style={{ fontSize: "0.75rem" }}>{user?.role || "System Administrator"}</div>
          </div>
          <i className="bi bi-chevron-down text-muted-soft" style={{ fontSize: "0.75rem" }} />
          {menuOpen && (
            <div
              className="card-surface position-absolute end-0 shadow-sm"
              style={{ top: "48px", width: "180px", zIndex: 20, padding: "8px" }}
            >
              <Link to="/profile" className="d-block px-2 py-2 text-decoration-none text-dark" style={{ fontSize: "0.88rem", borderRadius: "8px" }}>
                <i className="bi bi-person-circle me-2" />My Profile
              </Link>
              {!isStudent && (
                <Link to="/settings" className="d-block px-2 py-2 text-decoration-none text-dark" style={{ fontSize: "0.88rem", borderRadius: "8px" }}>
                  <i className="bi bi-gear me-2" />Settings
                </Link>
              )}
              <button
                className="d-block w-100 text-start px-2 py-2 border-0 bg-transparent text-danger"
                style={{ fontSize: "0.88rem", borderRadius: "8px" }}
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/logout");
                }}
              >
                <i className="bi bi-box-arrow-right me-2" />Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
