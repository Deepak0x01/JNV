import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader, StatusPill, Loading } from "../components/UI";
import useApiData from "../hooks/useApiData";

export default function StudentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useApiData(`/api/students/${id}`);

  if (loading) return <Loading />;

  const student = data?.student;
  if (error || !student) {
    return (
      <div>
        <PageHeader title="Student Not Found" />
        <Link to="/students" className="btn btn-primary-soft">Back to Students</Link>
      </div>
    );
  }

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
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Home / Students / View"
        title={student.name}
        action={
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={() => navigate("/students")}>Back</button>
            <button className="btn btn-primary-soft" onClick={() => navigate(`/students/${student.id}/edit`)}>
              <i className="bi bi-pencil me-1" />Edit
            </button>
          </div>
        }
      />
      <div className="card-surface p-4">
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
      </div>
    </div>
  );
}