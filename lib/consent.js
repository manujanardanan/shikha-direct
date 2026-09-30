import { query } from "./db";
import { CONSENT_VERSION } from "./legal";

// True only if this account accepted the CURRENT version of the Terms/Privacy Policy.
export async function accountHasCurrentConsent(accountId) {
  const { rows } = await query(
    "select consent_version from accounts where id = $1",
    [accountId]
  );
  return rows.length > 0 && rows[0].consent_version === CONSENT_VERSION;
}

export const CONSENT_REQUIRED_RESPONSE = {
  error: "Please review and accept the Terms of Use and Privacy Policy first.",
  code: "CONSENT_REQUIRED",
};
