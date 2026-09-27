import crypto from "crypto";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

function getAuthHeader() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set.");
  }
  const token = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  return `Basic ${token}`;
}

// Creates a Razorpay order. Amount is in paise (e.g. 19900 = Rs. 199).
export async function createRazorpayOrder({ amountPaise, receipt }) {
  const res = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
    }),
  });

  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    // Razorpay (or a network layer in front of it) returned something that
    // isn't JSON at all -- surface a clean error instead of crashing on parse.
    throw new Error(
      `Razorpay did not return a valid response (HTTP ${res.status}). Raw response: ${rawText.slice(0, 200)}`
    );
  }

  if (!res.ok) {
    throw new Error(data?.error?.description || "Razorpay order creation failed");
  }
  return data; // { id, amount, currency, ... }
}

// Verifies the signature Razorpay's checkout returns after a successful
// payment. This is the step that actually proves the payment is real --
// never unlock anything based on the client's word alone.
export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET is not set.");
  }
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  // Timing-safe comparison -- avoids leaking info via response-time differences
  const expectedBuf = Buffer.from(expected, "hex");
  const givenBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== givenBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, givenBuf);
}
