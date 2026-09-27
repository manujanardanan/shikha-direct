import { query } from "../../../../lib/db";
import { signSession, setSessionCookie, isLocalRequest } from "../../../../lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: "email and password are required" }, { status: 400 });
    }

    const { rows } = await query(
      `select id, display_name from accounts
       where email = $1 and password_hash = crypt($2, password_hash)`,
      [email.toLowerCase(), password]
    );

    if (rows.length === 0) {
      return Response.json({ error: "Incorrect email or password" }, { status: 401 });
    }

    const account = rows[0];
    const token = signSession({ accountId: account.id, displayName: account.display_name });
    const res = Response.json({ ok: true, account: { id: account.id, displayName: account.display_name } });
    res.headers.set("Set-Cookie", setSessionCookie(token, isLocalRequest(req)));
    return res;
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
