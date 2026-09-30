import { query } from "../../../../lib/db";
import { getSession } from "../../../../lib/auth";
import { CONSENT_VERSION } from "../../../../lib/legal";

// Records that the logged-in parent/guardian accepted the current Terms + Privacy Policy.
export async function POST(req) {
  const session = getSession(req);
  if (!session) {
    return Response.json({ error: "You must be logged in" }, { status: 401 });
  }
  try {
    const { consent } = await req.json();
    if (consent !== true) {
      return Response.json({ error: "Consent must be given explicitly." }, { status: 400 });
    }
    await query(
      "update accounts set consented_at = now(), consent_version = $2 where id = $1",
      [session.accountId, CONSENT_VERSION]
    );
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
