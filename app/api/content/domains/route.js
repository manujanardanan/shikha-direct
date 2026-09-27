import { query } from "../../../../lib/db";

export async function GET() {
  try {
    const { rows } = await query(
      "select key, label, icon, color, blurb, stream from content_domains order by key"
    );
    return Response.json({ domains: rows });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
