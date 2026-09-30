import { getSession } from "../../../../lib/auth";
import { accountHasCurrentConsent } from "../../../../lib/consent";

export async function GET(req) {
  const session = getSession(req);
  if (!session) {
    return Response.json({ loggedIn: false });
  }
  try {
    const consentCurrent = await accountHasCurrentConsent(session.accountId);
    return Response.json({ loggedIn: true, displayName: session.displayName, consentCurrent });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
