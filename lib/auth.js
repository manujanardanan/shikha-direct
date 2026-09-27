import jwt from "jsonwebtoken";

const COOKIE_NAME = "shikha_direct_session";
const SESSION_HOURS = 24 * 14; // 2 weeks - consumer product, longer-lived login than the school one

function getSecret() {
  if (!process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is not set.");
  }
  return process.env.AUTH_SECRET;
}

export function signSession(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: `${SESSION_HOURS}h` });
}

export function verifySessionToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    out[k] = decodeURIComponent(v.join("="));
  }
  return out;
}

export function getSession(req) {
  const cookies = parseCookies(req.headers.get("cookie"));
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySessionToken(token);
}

export function isLocalRequest(req) {
  const host = req.headers.get("host") || "";
  return host.includes("localhost") || host.includes("127.0.0.1");
}

export function setSessionCookie(token, isLocal) {
  const maxAge = SESSION_HOURS * 60 * 60;
  const secure = isLocal ? "" : " Secure;";
  return `${COOKIE_NAME}=${encodeURIComponent(
    token
  )}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie(isLocal) {
  const secure = isLocal ? "" : " Secure;";
  return `${COOKIE_NAME}=;HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=0`;
}
