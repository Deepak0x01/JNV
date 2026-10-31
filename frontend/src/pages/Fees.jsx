import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { PageHeader, StatusPill, Modal, ConfirmModal, Loading, Notice, EmptyState } from "../components/UI";
import useApiData from "../hooks/useApiData";
import useSettings from "../hooks/useSettings";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api";
import { rupees, today } from "../utils/format";

const schema = Yup.object({
  student: Yup.string().required("Select a student"),
  amount: Yup.number().positive("Amount must be greater than 0").required("Amount is required"),
  mode: Yup.string().required("Select a payment mode"),
  transactionId: Yup.string().when("mode", {
    is: (mode) => mode && mode !== "Cash",
    then: (s) => s.required("Transaction ID is required"),
  }),
  date: Yup.date().required("Payment date is required"),
  status: Yup.string().required(),
  remarks: Yup.string(),
});

let razorpayScript;
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (!razorpayScript) {
    razorpayScript = new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = "https://checkout.razorpay.com/v1/checkout.js";
      el.onload = resolve;
      el.onerror = () => {
        razorpayScript = null;
        reject(new Error("Could not load the payment window. Check your internet connection."));
      };
      document.body.appendChild(el);
    });
  }
  return razorpayScript;
}

export default function Fees() {
  const { isStudent, user } = useAuth();
  const fees = useApiData("/api/fees");
  const students = useApiData(isStudent ? null : "/api/students");
  const summary = useApiData(isStudent ? "/api/fees/summary" : null);
  const { paymentModes } = useSettings();
  const [showRecord, setShowRecord] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const list = fees.data?.fees || [];
  const collected = list.filter((f) => f.status === "Paid").reduce((n, f) => n + f.amount, 0);
  const pending = list.filter((f) => f.status === "Pending").reduce((n, f) => n + f.amount, 0);

  const markPaid = async (fee) => {
    setActionError("");
    try {
      await apiRequest(`/api/fees/${fee.id}`, { method: "PATCH", body: { status: "Paid" } });
      fees.reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await apiRequest(`/api/fees/${deleteTarget.id}`, { method: "DELETE" });
      fees.reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDeleteTarget(null);
      setBusy(false);
    }
  };
  const payOnline = async (feeId) => {
    setFormError("");
    setActionError("");
    setPaying(true);
    try {
      await loadRazorpay();
      const order = await apiRequest("/api/fees/razorpay/order", { method: "POST", body: feeId ? { feeId } : {} });
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Hostel Fees",
        description: feeId ? "Pending hostel fee" : "Annual hostel fee",
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#4f46e5" },
        handler: async (response) => {
          try {
            const res = await apiRequest("/api/fees/razorpay/verify", { method: "POST", body: response });
            closeModal();
            setSuccess(res.message);
            fees.reload();
            summary.reload();
          } catch (err) {
            closeModal();
            setActionError(err.message);
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.on("payment.failed", (resp) => {
        setPaying(false);
        const msg = resp?.error?.description || "Payment failed. Please try again.";
        (showRecord ? setFormError : setActionError)(msg);
      });
      rzp.open();
    } catch (err) {
      setPaying(false);
      (showRecord ? setFormError : setActionError)(err.message);
    }
  };

  const closeModal = () => {
    setShowRecord(false);
    setFormError("");
  };

  return (
    <div>
      <PageHeader
        eyebrow={isStudent ? "Home / My Fees" : "Home / Fees"}
        title={isStudent ? "My Fees" : "Fees"}
        action={
          <button className="btn btn-primary-soft" onClick={() => { setSuccess(""); setShowRecord(true); }}>
            <i className="bi bi-plus-lg me-1" />{isStudent ? "Pay Fees" : "Record Payment"}
          </button>
        }
      />
      <Notice text={actionError} onClose={() => setActionError("")} />
      <Notice kind="success" text={success} onClose={() => setSuccess("")} />

      <div className="row g-3 mb-3">
        <div className="col-6">
          <div className="card-surface p-3">
            <div className="text-muted-soft" style={{ fontSize: "0.8rem" }}>{isStudent ? "Paid" : "Collected"}</div>
            <div className="fw-bold" style={{ fontSize: "1.3rem" }}>{rupees(collected)}</div>
          </div>
        </div>
        <div className="col-6">
          <div className="card-surface p-3">
            <div className="text-muted-soft" style={{ fontSize: "0.8rem" }}>{isStudent ? "Due" : "Pending"}</div>
            <div className="fw-bold" style={{ fontSize: "1.3rem" }}>{rupees(pending)}</div>
          </div>
        </div>
      </div>

      {isStudent && summary.data && (
        <div className="card-surface p-3 mb-3">
          <div className="text-muted-soft" style={{ fontSize: "0.8rem" }}>
            {summary.data.roomType ? `${summary.data.roomType} room \u00b7 Annual fee ${summary.data.academicYear}` : "Annual fee"}
          </div>
          {summary.data.annualFee ? (
            <div className="fw-bold" style={{ fontSize: "1.3rem" }}>
              {rupees(summary.data.annualFee)}
              <span className="text-muted-soft fw-normal" style={{ fontSize: "0.85rem" }}>
                {" "}&middot; {summary.data.payable > 0 ? `${rupees(summary.data.payable)} to pay` : "Fully paid"}
              </span>
            </div>
          ) : (
            <div>Your fee is decided by your room type. A room has not been allocated to you yet.</div>
          )}
        </div>
      )}

      <div className="card-surface p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="section-title mb-0">{isStudent ? "My Payment History" : "Fee History"}</div>
        </div>
        {fees.loading ? (
          <Loading />
        ) : fees.error ? (
          <Notice text={fees.error} />
        ) : (
          <div className="table-responsive">
            <table className="table table-surface mb-0">
              <thead>
                <tr>
                  <th>Date</th>{!isStudent && <th>Student</th>}<th>Amount</th><th>Mode</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((f) => (
                  <tr key={f.id}>
                    <td>{f.date}</td>
                    {!isStudent && <td>{f.student}</td>}
                    <td>&#8377;{f.amount.toLocaleString("en-IN")}</td>
                    <td>{f.mode}{f.transactionId ? <span className="text-muted-soft"> &middot; {f.transactionId}</span> : null}</td>
                    <td><StatusPill status={f.status} /></td>
                    <td>
                      {isStudent ? (
                        f.status === "Pending" ? (
                          <button className="btn btn-primary-soft btn-sm py-1 px-3" disabled={paying} onClick={() => { setSuccess(""); payOnline(f.id); }}>
                            Pay Now
                          </button>
                        ) : (
                          "-"
                        )
                      ) : (
                        <>
                          {f.status === "Pending" && (
                            <button className="icon-action-btn" title="Mark as paid" onClick={() => markPaid(f)}>
                              <i className="bi bi-check-lg" />
                            </button>
                          )}
                          <button className="icon-action-btn danger" title="Delete" onClick={() => setDeleteTarget(f)}>
                            <i className="bi bi-trash" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && <EmptyState icon="bi-currency-rupee" text="No payments recorded yet." />}
          </div>
        )}
      </div>
      {showRecord && !isStudent && (
        <Modal title="Record Fee Payment" onClose={closeModal}>
          <Notice text={formError} />
          <Formik
            initialValues={{ student: "", amount: "", mode: "", transactionId: "", date: today(), status: "Paid", remarks: "" }}
            validationSchema={schema}
            onSubmit={async (values, { setSubmitting }) => {
              setFormError("");
              try {
                await apiRequest("/api/fees", {
                  method: "POST",
                  body: {
                    studentId: values.student,
                    amount: Number(values.amount),
                    mode: values.mode,
                    transactionId: values.mode === "Cash" ? "" : values.transactionId,
                    date: values.date,
                    status: values.status,
                    remarks: values.remarks,
                  },
                });
                setShowRecord(false);
                fees.reload();
              } catch (err) {
                setFormError(err.message);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, values, setFieldValue, handleChange }) => (
              <Form noValidate>
                <div className="mb-3">
                  <label className="form-label-sm">Student</label>
                  <Field
                    as="select"
                    name="student"
                    className="form-select"
                    onChange={async (e) => {
                      handleChange(e);
                      if (!e.target.value) return;
                      try {
                        const r = await apiRequest(`/api/fees/student/${encodeURIComponent(e.target.value)}`);
                        if (r.annualFee) setFieldValue("amount", r.annualFee);
                      } catch {
                      }
                    }}
                  >
                    <option value="">Select Student</option>
                    {(students.data?.students || []).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                  </Field>
                  <ErrorMessage name="student" component="div" className="invalid-feedback-block" />
                </div>
                <div className="mb-3">
                  <label className="form-label-sm">Amount</label>
                  <Field type="number" name="amount" className="form-control" placeholder="Enter amount" />
                  <ErrorMessage name="amount" component="div" className="invalid-feedback-block" />
                </div>
                <div className="mb-3">
                  <label className="form-label-sm">Payment Mode</label>
                  <Field as="select" name="mode" className="form-select">
                    <option value="">Select Payment Mode</option>
                    {paymentModes.map((m) => <option key={m}>{m}</option>)}
                  </Field>
                  <ErrorMessage name="mode" component="div" className="invalid-feedback-block" />
                </div>
                {values.mode && values.mode !== "Cash" && (
                  <div className="mb-3">
                    <label className="form-label-sm">Transaction ID</label>
                    <Field name="transactionId" className="form-control" placeholder="Enter transaction ID" />
                    <ErrorMessage name="transactionId" component="div" className="invalid-feedback-block" />
                  </div>
                )}
                <div className="row">
                  <div className="col-sm-6 mb-3">
                    <label className="form-label-sm">Payment Date</label>
                    <Field type="date" name="date" className="form-control" />
                    <ErrorMessage name="date" component="div" className="invalid-feedback-block" />
                  </div>
                  <div className="col-sm-6 mb-3">
                    <label className="form-label-sm">Status</label>
                    <Field as="select" name="status" className="form-select">
                      <option>Paid</option>
                      <option>Pending</option>
                    </Field>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label-sm">Remarks (optional)</label>
                  <Field as="textarea" name="remarks" rows={2} className="form-control" placeholder="Enter remarks (optional)" />
                </div>
                <div className="d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary-soft" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Record Payment"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </Modal>
      )}
      {isStudent && showRecord && (
        <Modal title="Pay Fees" onClose={closeModal}>
          <Notice text={formError} />
          {summary.data?.annualFee ? (
            summary.data.payable > 0 ? (
              <>
                <div className="mb-3">
                  <div className="text-muted-soft" style={{ fontSize: "0.85rem" }}>
                    {summary.data.roomType} room &middot; Annual fee {summary.data.academicYear}
                  </div>
                  <div className="fw-bold" style={{ fontSize: "1.6rem" }}>{rupees(summary.data.payable)}</div>
                  {summary.data.paid > 0 && (
                    <div className="text-muted-soft" style={{ fontSize: "0.85rem" }}>
                      Already paid {rupees(summary.data.paid)} of {rupees(summary.data.annualFee)}
                    </div>
                  )}
                </div>
                <p className="text-muted-soft" style={{ fontSize: "0.85rem" }}>
                  You will pay securely with Razorpay (UPI, card, net banking or wallet).
                </p>
                <div className="d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
                  <button type="button" className="btn btn-primary-soft" disabled={paying} onClick={() => payOnline()}>
                    {paying ? "Processing..." : `Pay ${rupees(summary.data.payable)}`}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>Your {summary.data.academicYear} fee of {rupees(summary.data.annualFee)} is already paid.</p>
                <div className="d-flex justify-content-end">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>Close</button>
                </div>
              </>
            )
          ) : (
            <>
              <p>Your fee is decided by your room type. A room has not been allocated to you yet, so please contact the admin.</p>
              <div className="d-flex justify-content-end">
                <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>Close</button>
              </div>
            </>
          )}
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmModal title="Delete Fee Record" onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} busy={busy}>
          Delete the {rupees(deleteTarget.amount)} record for <strong>{deleteTarget.student}</strong> dated {deleteTarget.date}?
        </ConfirmModal>
      )}
    </div>
  );
}