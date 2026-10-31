import { useState } from "react";
import { PageHeader, StatusPill, Loading, Notice, EmptyState } from "../components/UI";
import useApiData from "../hooks/useApiData";
export default function StudentListReport() {
  const { data, loading, error } = useApiData("/api/students");
  const [courseFilter, setCourseFilter] = useState("All Courses");
  const [typeFilter, setTypeFilter] = useState("All Types");
  if (loading) return <Loading />;
  if (error) return <Notice text={error} />;

  const students = data.students;
  const courses = ["All Courses", ...new Set(students.map((s) => s.course))];
  const types = ["All Types", ...new Set(students.map((s) => s.roomType).filter(Boolean))];

  const filtered = students.filter(
    (s) => (courseFilter === "All Courses" || s.course === courseFilter) && (typeFilter === "All Types" || s.roomType === typeFilter)
  );

  const print = () => window.print();

  return (
    <div>
      <PageHeader eyebrow="Home / Reports / Student List" title="Student List Report" />

      <div className="card-surface p-3">
        <div className="d-flex flex-wrap gap-2 mb-3 no-print">
          <select className="form-select" style={{ maxWidth: "170px" }} value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            {courses.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="form-select" style={{ maxWidth: "170px" }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {types.map((t) => <option key={t}>{t}</option>)}
          </select>
          <button className="btn btn-primary-soft ms-auto" onClick={print}>
            <i className="bi bi-file-earmark-pdf me-1" />Generate Report
          </button>
        </div>

        <div className="print-only mb-2">
          <strong>Student List Report</strong> &middot; {new Date().toLocaleDateString()} &middot; {filtered.length} students
        </div>

        <div className="table-responsive">
          <table className="table table-surface mb-0">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Gender</th><th>Course</th><th>Room No.</th><th>Room Type</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td><td>{s.name}</td><td>{s.gender}</td><td>{s.course}</td>
                  <td>{s.roomNo || "-"}</td><td>{s.roomType || "-"}</td>
                  <td><StatusPill status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState icon="bi-people" text="No students match these filters." />}
        </div>

        <div className="d-flex gap-2 justify-content-end mt-3 no-print">
          <button className="btn btn-outline-secondary" onClick={print}>
            <i className="bi bi-download me-1" />Download PDF
          </button>
          <button className="btn btn-outline-secondary" onClick={print}>
            <i className="bi bi-printer me-1" />Print
          </button>
        </div>
      </div>
    </div>
  );
}