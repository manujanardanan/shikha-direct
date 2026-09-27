import { query } from "../../../../lib/db";
import { getSession } from "../../../../lib/auth";
import { verifyRazorpaySignature } from "../../../../lib/razorpay";

export async function POST(req) {
  try {
    const session = getSession(req);
    if (!session) {
      return Response.json({ error: "You must be logged in" }, { status: 401 });
    }

    const { studentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!studentId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return Response.json({ error: "Missing required payment details" }, { status: 400 });
    }

    const { rows: studentRows } = await query(
      "select id from students where id = $1 and account_id = $2",
      [studentId, session.accountId]
    );
    if (studentRows.length === 0) {
      return Response.json({ error: "That student does not belong to your account" }, { status: 403 });
    }

    // Confirm this order was actually the one we created for this student --
    // prevents someone replaying a valid signature from a different order.
    const { rows: paymentRows } = await query(
      `select id from payments
       where razorpay_order_id = $1 and student_id = $2 and status = 'created'`,
      [razorpay_order_id, studentId]
    );
    if (paymentRows.length === 0) {
      return Response.json({ error: "No matching pending order found for this student" }, { status: 404 });
    }
    const paymentId = paymentRows[0].id;

    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      // Don't mark the order as permanently failed here -- a genuine retry
      // with the correct signature (e.g. after a transient client-side
      // hiccup) should still be able to succeed. Just reject this attempt.
      return Response.json({ error: "Payment signature verification failed" }, { status: 400 });
    }

    await query(
      "update payments set status = 'paid', razorpay_payment_id = $2 where id = $1",
      [paymentId, razorpay_payment_id]
    );
    await query(
      `insert into report_unlocks (student_id, payment_id) values ($1, $2)
       on conflict (student_id) do nothing`,
      [studentId, paymentId]
    );

    return Response.json({ ok: true, unlocked: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
