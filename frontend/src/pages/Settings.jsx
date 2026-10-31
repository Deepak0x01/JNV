import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Loading, Notice, ConfirmModal } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import useSettings, { ALL_PAYMENT_MODES } from "../hooks/useSettings";
import { apiRequest } from "../api";

const tabs = [
  { key: "profile", label: "Profile", icon: "bi-person" },
  { key: "hostel", label: "Hostel Details", icon: "bi-building" },
  { key: "roomTypes", label: "Room Types", icon: "bi-door-closed" },
  { key: "payment", label: "Payment Settings", icon: "bi-credit-card" },
  { key: "notifications", label: "Notifications", icon: "bi-bell" },
  { key: "backup", label: "Backup & Restore", icon: "bi-cloud-arrow-down" },
];

export default function Settings() {
  const [active, setActive] = useState("profile");
  const { user } = useAuth();
  const { settings, loading, error, setSettings } = useSettings();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState({ kind: "success", text: "" });
  const [saving, setSaving] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const fileInput = useRef(null);

  useEffect(() => {
    if (settings) setForm(JSON.parse(JSON.stringify(settings)));
  }, [settings]);

  const switchTab = (key) => {
    setActive(key);
    setMessage({ kind: "success", text: "" });
    if (settings) setForm(JSON.parse(JSON.stringify(settings))); // drop unsaved edits
  };

  const save = async (partial) => {
    setSaving(true);
    setMessage({ kind: "success", text: "" });
    try {
      const res = await apiRequest("/api/settings", { method: "PUT", body: partial });
      setSettings(res.settings);
      setMessage({ kind: "success", text: "Settings saved." });
    } catch (err) {
      setMessage({ kind: "danger", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const downloadBackup = async () => {
    setMessage({ kind: "success", text: "" });
    try {
      const backup = await apiRequest("/api/backup");
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hostel-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ kind: "success", text: "Backup downloaded." });
    } catch (err) {
      setMessage({ kind: "danger", text: err.message });
    }
  };
  const restore = async () => {
    setSaving(true);
    try {
      const parsed = JSON.parse(await restoreFile.text());
      const res = await apiRequest("/api/backup/restore", { method: "POST", body: parsed });
      const c = res.counts;
      setMessage({
        kind: "success",
        text: `Backup restored: ${c.students} students, ${c.rooms} rooms, ${c.fees} fee records, ${c.complaints} complaints.`,
      });
    } catch (err) {
      setMessage({ kind: "danger", text: err instanceof SyntaxError ? "That file is not valid JSON." : err.message });
    } finally {
      setSaving(false);
      setRestoreFile(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const setRoomType = (i, patch) =>
    setForm((f) => ({ ...f, roomTypes: f.roomTypes.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) }));

  const toggleMode = (m) =>
    setForm((f) => ({
      ...f,
      paymentModes: f.paymentModes.includes(m) ? f.paymentModes.filter((x) => x !== m) : [...f.paymentModes, m],
    }));
  return (
    <div>
      <PageHeader eyebrow="Home / Settings" title="Settings" />
      <div className="row g-3">
        <div className="col-lg-3">
          <div className="card-surface p-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`sidebar-link w-100 border-0 bg-transparent text-start ${active === t.key ? "active" : ""}`}
                style={{ color: active === t.key ? "#fff" : "#33405e" }}
                onClick={() => switchTab(t.key)}
              >
                <i className={`bi ${t.icon}`} /> {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="col-lg-9">
          <div className="card-surface p-4">
            <Notice kind={message.kind} text={message.text} onClose={() => setMessage({ ...message, text: "" })} />

            {active === "profile" && (
              <div>
                <div className="section-title">Admin Profile</div>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="avatar-circle" style={{ width: 60, height: 60, fontSize: "1.4rem" }}>{(user?.name || "A").charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="fw-bold">{user?.name || "Admin"}</div>
                    <div className="text-muted-soft" style={{ fontSize: "0.82rem" }}>{user?.role || "System Administrator"}</div>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6 mb-2"><span className="text-muted-soft" style={{ fontSize: "0.78rem" }}>Email</span><div>{user?.email}</div></div>
                  <div className="col-md-6 mb-2"><span className="text-muted-soft" style={{ fontSize: "0.78rem" }}>Phone</span><div>{user?.phone || "-"}</div></div>
                </div>
                <Link to="/profile" className="btn btn-primary-soft">Edit Profile</Link>
              </div>
            )}

            {active !== "profile" && active !== "backup" && loading && <Loading />}
            {active !== "profile" && active !== "backup" && error && <Notice text={error} />}

            {form && active === "hostel" && (
              <div>
                <div className="section-title">Hostel Details</div>
                <div className="mb-3">
                  <label className="form-label-sm">Hostel Name</label>
                  <input className="form-control" value={form.hostelName} onChange={(e) => setForm({ ...form, hostelName: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label-sm">Address</label>
                  <textarea className="form-control" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <button className="btn btn-primary-soft" disabled={saving} onClick={() => save({ hostelName: form.hostelName, address: form.address })}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            {form && active === "roomTypes" && (
              <div>
                <div className="section-title">Room Types</div>
                <p className="text-muted-soft" style={{ fontSize: "0.85rem" }}>
                  These appear when adding rooms. The capacity is filled in automatically for the chosen type.
                </p>
                {form.roomTypes.map((t, i) => (
                  <div key={i} className="d-flex gap-2 align-items-center mb-2">
                    <input className="form-control" placeholder="Name" value={t.name} onChange={(e) => setRoomType(i, { name: e.target.value })} />
                    <input
                      type="number"
                      min={1}
                      className="form-control"
                      style={{ maxWidth: "110px" }}
                      placeholder="Beds"
                      value={t.capacity}
                      onChange={(e) => setRoomType(i, { capacity: Number(e.target.value) })}
                    />
                    <button
                      className="icon-action-btn danger"
                      title="Remove"
                      disabled={form.roomTypes.length === 1}
                      onClick={() => setForm({ ...form, roomTypes: form.roomTypes.filter((_, idx) => idx !== i) })}
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                ))}
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-outline-secondary" onClick={() => setForm({ ...form, roomTypes: [...form.roomTypes, { name: "", capacity: 1 }] })}>
                    <i className="bi bi-plus-lg me-1" />Add Type
                  </button>
                  <button className="btn btn-primary-soft" disabled={saving} onClick={() => save({ roomTypes: form.roomTypes })}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {form && active === "payment" && (
              <div>
                <div className="section-title">Payment Settings</div>
                <div className="mb-3">
                  <label className="form-label-sm">Accepted Payment Modes</label>
                  {ALL_PAYMENT_MODES.map((m) => (
                    <div className="form-check" key={m}>
                      <input className="form-check-input" type="checkbox" checked={form.paymentModes.includes(m)} onChange={() => toggleMode(m)} id={`mode-${m}`} />
                      <label className="form-check-label" htmlFor={`mode-${m}`}>{m}</label>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary-soft" disabled={saving} onClick={() => save({ paymentModes: form.paymentModes })}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            {form && active === "notifications" && (
              <div>
                <div className="section-title">Notification Preferences</div>
                {Object.entries({ email: "Email Notifications", sms: "SMS Notifications", push: "Push Notifications" }).map(([key, label]) => (
                  <div className="form-check form-switch mb-2" key={key}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={Boolean(form.notifications?.[key])}
                      onChange={() => setForm({ ...form, notifications: { ...form.notifications, [key]: !form.notifications?.[key] } })}
                      id={`notif-${key}`}
                    />
                    <label className="form-check-label" htmlFor={`notif-${key}`}>{label}</label>
                  </div>
                ))}
                <button className="btn btn-primary-soft mt-2" disabled={saving} onClick={() => save({ notifications: form.notifications })}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            {active === "backup" && (
              <div>
                <div className="section-title">Backup & Restore</div>
                <p className="text-muted-soft" style={{ fontSize: "0.88rem" }}>
                  Download a backup of all hostel records (students, rooms, allocations, fees, complaints and settings), or restore from a previous backup file.
                  Restoring replaces all current records.
                </p>
                <div className="d-flex gap-2 flex-wrap">
                  <button className="btn btn-primary-soft" onClick={downloadBackup}><i className="bi bi-cloud-arrow-down me-1" />Download Backup</button>
                  <button className="btn btn-outline-secondary" onClick={() => fileInput.current?.click()}><i className="bi bi-cloud-arrow-up me-1" />Restore</button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={(e) => setRestoreFile(e.target.files[0] || null)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {restoreFile && (
        <ConfirmModal title="Restore Backup" confirmText="Restore" onClose={() => { setRestoreFile(null); if (fileInput.current) fileInput.current.value = ""; }} onConfirm={restore} busy={saving}>
          Restore from <strong>{restoreFile.name}</strong>? This will replace all current students, rooms, allocations, fees and complaints.
        </ConfirmModal>
      )}
    </div>
  );
}