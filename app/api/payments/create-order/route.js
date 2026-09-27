import { query } from "../../../../lib/db";
import { getSession } from "../../../../lib/auth";
import { createRazorpayOrder } from "../../../../lib/razorpay";

// Default price if not overridden by an env var -- Rs. 39
const DEFAULT_PRICE_PAISE = 3900;

export async function POST(req) {
  try {
    const session = getSession(req);
    if (!session) {
      return Response.json({ error: "You must be logged in" }, { status: 401 });
    }

    const { studentId } = await req.json();
    if (!studentId) {
      return Response.json({ error: "studentId is required" }, { status: 400 });
    }

    const { rows } = await query(
      "select id from students where id = $1 and account_id = $2",
      [studentId, session.accountId]
    );
    if (rows.length === 0) {
      return Response.json({ error: "That student does not belong to your account" }, { status: 403 });
    }

    // Already unlocked? Don't charge again.
    const { rows: unlockRows } = await query(
      "select student_id from report_unlocks where student_id = $1",
      [studentId]
    );
    if (unlockRows.length > 0) {
      return Response.json({ error: "This report is already unlocked" }, { status: 409 });
    }

    const amountPaise = Number(process.env.REPORT_PRICE_PAISE) || DEFAULT_PRICE_PAISE;
    // Keep this well under Razorpay's 56-character receipt limit -- a full
    // UUID plus timestamp was actually 57 characters, one over the limit.
    const receipt = `rpt_${studentId.slice(0, 8)}_${Date.now()}`;

    const order = await createRazorpayOrder({ amountPaise, receipt });

    await query(
      `insert into payments (account_id, student_id, razorpay_order_id, amount_paise, status)
       values ($1, $2, $3, $4, 'created')`,
      [session.accountId, studentId, order.id, amountPaise]
    );

    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
