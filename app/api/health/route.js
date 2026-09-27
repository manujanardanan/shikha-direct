import { query } from "../../../lib/db";

export async function GET() {
  try {
    const { rows } = await query("select count(*)::int as n from content_domains");
    return Response.json({ status: "ok", domains_loaded: rows[0].n });
  } catch (err) {
    return Response.json({ status: "error", message: err.message }, { status: 500 });
  }
}
