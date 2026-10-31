import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function Logout() {
  const { logout } = useAuth();
  useEffect(() => {
    logout();
  }, [logout]);

  return (
    <div className="auth-shell">
      <div className="card-surface text-center p-4" style={{ width: "100%", maxWidth: "380px" }}>
        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "2.6rem" }} />
        <h4 className="fw-bold mt-3">You have been logged out!</h4>
        <p className="text-muted-soft mb-4" style={{ fontSize: "0.88rem" }}>Thank you for using Hostel Management System.</p>
        <Link to="/login" className="btn btn-primary-soft w-100">Login Again</Link>
      </div>
    </div>
  );
}
