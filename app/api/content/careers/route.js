import { query } from "../../../../lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const domainKey = searchParams.get("domain");
    if (!domainKey) {
      return Response.json({ error: "domain query param is required" }, { status: 400 });
    }
    const { rows } = await query(
      `select career_key, label, blurb, note
       from content_l2_careers where domain_key = $1 order by order_index`,
      [domainKey]
    );
    const { rows: mapRows } = await query(
      "select pair_key from content_l3_map where pair_key like $1",
      [`${domainKey}.%`]
    );
    const readyCareers = new Set(mapRows.map((r) => r.pair_key.split(".")[1]));
    const careers = rows.map((c) => ({ ...c, hasReadinessTest: readyCareers.has(c.career_key) }));
    return Response.json({ careers });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
