import { useEffect, useState } from "react";
import { PageHeader, Loading, Notice, EmptyState } from "../components/UI";
import useApiData from "../hooks/useApiData";
import { apiRequest } from "../api";
import { timeAgo } from "../utils/format";

const iconMap = {
  student: { icon: "bi-person-plus-fill", bg: "#22b573" },
  room: { icon: "bi-door-open-fill", bg: "#2f6fed" },
  fee: { icon: "bi-currency-rupee", bg: "#8b5cf6" },
  complaint: { icon: "bi-chat-left-text-fill", bg: "#f5a623" },
};

const tabs = [
  { key: "all", label: "All Alerts" },
  { key: "student", label: "Students" },
  { key: "room", label: "Rooms" },
  { key: "fee", label: "Fees" },
  { key: "complaint", label: "Complaints" },
];

export default function Notifications() {
  const { data, loading, error } = useApiData("/api/dashboard/activity?limit=50");
  const [tab, setTab] = useState("all");
  const loaded = Boolean(data);
  useEffect(() => {
    if (!loaded) return;
    apiRequest("/api/notifications/seen", { method: "POST" })
      .then(() => window.dispatchEvent(new Event("hms:notifications-seen")))
      .catch(() => {});
  }, [loaded]);

  const items = (data?.activity || []).filter((n) => tab === "all" || n.type === tab);

  return (
    <div>
      <PageHeader eyebrow="Home / Notifications" title="Notifications" />
      <div className="card-surface p-3">
        <ul className="nav nav-tabs mb-3" style={{ fontSize: "0.88rem" }}>
          {tabs.map((t) => (
            <li className="nav-item" key={t.key}>
              <button className={`nav-link ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>
            </li>
          ))}
        </ul>
        {loading ? (
          <Loading />
        ) : error ? (
          <Notice text={error} />
        ) : items.length === 0 ? (
          <EmptyState icon="bi-bell" text="No notifications here yet." />
        ) : (
          items.map((n, i) => {
            const meta = iconMap[n.type] || iconMap.student;
            return (
              <div key={i} className="d-flex gap-3 py-3 border-bottom" style={n.unread ? { background: "#f5f9ff" } : undefined}>
                <span className="activity-icon" style={{ background: meta.bg }}>
                  <i className={`bi ${meta.icon}`} />
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {n.title}
                    {n.unread && <span className="badge text-bg-primary ms-2" style={{ fontSize: "0.65rem" }}>New</span>}
                  </div>
                  <div className="text-muted-soft" style={{ fontSize: "0.85rem" }}>{n.detail}</div>
                  <div className="text-muted-soft" style={{ fontSize: "0.75rem" }}>{timeAgo(n.at)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
