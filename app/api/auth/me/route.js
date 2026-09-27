import { getSession } from "../../../../lib/auth";

export async function GET(req) {
  const session = getSession(req);
  if (!session) {
    return Response.json({ loggedIn: false });
  }
  return Response.json({ loggedIn: true, displayName: session.displayName });
}
