import { query } from "../../../../lib/db";

export async function GET() {
  try {
    const { rows: domains } = await query("select key, label from content_domains order by label");
    const { rows: careers } = await query(
      "select domain_key, career_key, label from content_l2_careers order by order_index"
    );
    const grouped = domains.map((d) => ({
      domainKey: d.key,
      domainLabel: d.label,
      careers: careers.filter((c) => c.domain_key === d.key).map((c) => ({ careerKey: c.career_key, label: c.label })),
    }));
    return Response.json({ domains: grouped });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
