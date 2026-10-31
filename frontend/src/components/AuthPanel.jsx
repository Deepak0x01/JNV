import authIllustration from "../assets/auth-illustration.jpg";

export default function AuthPanel() {
  return (
    <div className="auth-image-panel">
      <div className="auth-image-brand">
        <span className="brand-icon">
          <i className="bi bi-house-door-fill" />
        </span>
        <div>
          <div className="auth-image-title">Hostel Management System</div>
        </div>
      </div>
      <div className="auth-image-tagline">Safe Stay &middot; Better Tomorrow</div>
      <div className="auth-image-art">
        <img src={authIllustration} alt="Hostel Management System" className="auth-image-art-photo" />
      </div>
    </div>
  );
}
