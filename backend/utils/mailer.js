const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return null;

  const port = Number(SMTP_PORT || 465);
  transporter = nodemailer.createTransport({
    host: SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function sendOtpEmail({ to, otp }) {
  const ttl = Number(process.env.OTP_TTL_MINUTES || 10);
  const t = getTransporter();

  if (!t) {
    console.log("\n----- OTP email (SMTP not configured, console fallback) -----");
    console.log("To:", to);
    console.log("OTP:", otp);
    console.log("------\n");
    return false;
  }

  await t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Your Hostel Management password reset code",
    text: `Your password reset code is ${otp}. It expires in ${ttl} minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #e3e8f0;border-radius:12px">
        <h2 style="margin:0 0 8px;color:#10213f">Hostel Management System</h2>
        <p style="color:#555">Use this code to reset your password:</p>
        <div style="font-size:32px;letter-spacing:8px;font-weight:700;color:#2f6fed;margin:16px 0">${otp}</div>
        <p style="color:#777;font-size:13px">This code expires in ${ttl} minutes. If you didn't request it, you can safely ignore this email.</p>
      </div>`,
  });
  return true;
}
async function sendCredentialsEmail({ to, name, password, role }) {
  const t = getTransporter();
  const loginUrl = process.env.CLIENT_URL || "http://localhost:5173";

  if (!t) {
    console.log("\n----- Login details email (SMTP not configured, console fallback) -----");
    console.log("To:", to);
    console.log("Username:", to);
    console.log("Password:", password);
    console.log("------\n");
    return false;
  }

  await t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Your Hostel Management System login details",
    text: `Hello ${name},\n\nAn account has been created for you on the Hostel Management System (${role}).\n\nUsername: ${to}\nPassword: ${password}\n\nLogin here: ${loginUrl}/login\n\nPlease change your password after your first login (Profile > Change Password).`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:460px;margin:auto;padding:24px;border:1px solid #e3e8f0;border-radius:12px">
        <h2 style="margin:0 0 8px;color:#10213f">Hostel Management System</h2>
        <p style="color:#555">Hello ${escapeHtml(name)}, an account has been created for you (${escapeHtml(role)}).</p>
        <table style="margin:16px 0;font-size:15px;color:#10213f">
          <tr><td style="padding:4px 14px 4px 0;color:#777">Username</td><td><strong>${escapeHtml(to)}</strong></td></tr>
          <tr><td style="padding:4px 14px 4px 0;color:#777">Password</td><td><strong style="font-family:monospace;font-size:17px">${escapeHtml(password)}</strong></td></tr>
        </table>
        <p><a href="${escapeHtml(loginUrl)}/login" style="color:#2f6fed">Log in here</a></p>
        <p style="color:#777;font-size:13px">Please change your password after your first login (Profile &gt; Change Password).</p>
      </div>`,
  });
  return true;
}

module.exports = { sendOtpEmail, sendCredentialsEmail };
