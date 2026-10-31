const crypto = require("crypto");
const httpError = require("../utils/httpError");

const keyId = () => process.env.RAZORPAY_KEY_ID;
const keySecret = () => process.env.RAZORPAY_KEY_SECRET;

function assertConfigured() {
  if (!keyId() || !keySecret()) {
    throw httpError(503, "Online payment is not set up yet. Please contact the admin.");
  }
}

async function createOrder({ amountRupees, receipt, notes }) {
  assertConfigured();
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${keyId()}:${keySecret()}`).toString("base64"),
    },
    body: JSON.stringify({
      amount: Math.round(amountRupees * 100),
      currency: "INR",
      receipt: String(receipt).slice(0, 40),
      notes,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Razorpay order error:", data);
    throw httpError(502, "Could not start the payment. Please try again.");
  }
  return data;
}

function verifySignature({ orderId, paymentId, signature }) {
  assertConfigured();
  const expected = crypto.createHmac("sha256", keySecret()).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { createOrder, verifySignature, keyId };
