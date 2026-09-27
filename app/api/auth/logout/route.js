import { clearSessionCookie, isLocalRequest } from "../../../../lib/auth";

export async function POST(req) {
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", clearSessionCookie(isLocalRequest(req)));
  return res;
}
