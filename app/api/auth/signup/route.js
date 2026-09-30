import { query } from "../../../../lib/db";
import { signSession, setSessionCookie, isLocalRequest } from "../../../../lib/auth";
import { CONSENT_VERSION } from "../../../../lib/legal";

export async function POST(req) {
  try {
    const { email, password, displayName, consent, guardianDeclaration } = await req.json();
    if (!email || !password || !displayName) {
      return Response.json(
        { error: "email, password, and displayName are required" },
        { status: 400 }
      );
    }
    if (guardianDeclaration !== true) {
      return Response.json(
        { error: "You must confirm you are 18 or older and a parent or legal guardian to create an account." },
        { status: 400 }
      );
    }
    if (consent !== true) {
      return Response.json(
        { error: "You must accept the Terms of Use and Privacy Policy to create an account." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const { rows: existing } = await query("select id from accounts where email = $1", [
      email.toLowerCase(),
    ]);
    if (existing.length > 0) {
      return Response.json({ error: "An account with that email already exists" }, { status: 409 });
    }

    // The consent version is set by the server, never trusted from the browser.
    const { rows } = await query(
      `insert into accounts (email, password_hash, display_name, consented_at, consent_version)
       values ($1, crypt($2, gen_salt('bf')), $3, now(), $4)
       returning id, display_name`,
      [email.toLowerCase(), password, displayName, CONSENT_VERSION]
    );

    const account = rows[0];
    const token = signSession({ accountId: account.id, displayName: account.display_name });
    const res = Response.json({ ok: true, account: { id: account.id, displayName: account.display_name } });
    res.headers.set("Set-Cookie", setSessionCookie(token, isLocalRequest(req)));
    return res;
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
