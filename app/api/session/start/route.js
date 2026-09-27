import { query } from "../../../../lib/db";
import { buildL1Session, buildL2Session, buildL3Session } from "../../../../lib/scoring";
import { getSession } from "../../../../lib/auth";

async function assertOwnsStudent(accountId, studentId) {
  const { rows } = await query("select id from students where id = $1 and account_id = $2", [
    studentId,
    accountId,
  ]);
  return rows.length > 0;
}

export async function POST(req) {
  try {
    const session = getSession(req);
    if (!session) {
      return Response.json({ error: "You must be logged in" }, { status: 401 });
    }

    const body = await req.json();
    const { level, studentId, domainKey, careerKey, aspirationDomainKey, aspirationCareerKey } = body;

    if (!level || !studentId) {
      return Response.json({ error: "level and studentId are required" }, { status: 400 });
    }
    if (!(await assertOwnsStudent(session.accountId, studentId))) {
      return Response.json({ error: "That student does not belong to your account" }, { status: 403 });
    }

    if (level === 1) {
      const { storyKeys, stories } = await buildL1Session();
      const { rows } = await query(
        `insert into l1_sessions (student_id, story_keys, aspiration_domain_key, aspiration_career_key)
         values ($1, $2, $3, $4) returning id`,
        [studentId, JSON.stringify(storyKeys), aspirationDomainKey || null, aspirationCareerKey || null]
      );
      return Response.json({ sessionId: rows[0].id, stories });
    }

    if (level === 2) {
      if (!domainKey) {
        return Response.json({ error: "domainKey is required for level 2" }, { status: 400 });
      }
      const { storyKeys, stories } = await buildL2Session(domainKey);
      const { rows } = await query(
        `insert into l2_sessions (student_id, domain_key, story_keys)
         values ($1, $2, $3) returning id`,
        [studentId, domainKey, JSON.stringify(storyKeys)]
      );
      return Response.json({ sessionId: rows[0].id, stories });
    }

    if (level === 3) {
      if (!domainKey || !careerKey) {
        return Response.json(
          { error: "domainKey and careerKey are required for level 3" },
          { status: 400 }
        );
      }
      const pairKey = `${domainKey}.${careerKey}`;
      const { rows: mapRows } = await query(
        "select test_key from content_l3_map where pair_key = $1",
        [pairKey]
      );
      if (mapRows.length === 0) {
        return Response.json(
          { error: `No Level 3 test is built yet for ${pairKey}` },
          { status: 404 }
        );
      }
      const testKey = mapRows[0].test_key;
      const { questionIds, questions } = await buildL3Session(testKey);
      const { rows } = await query(
        `insert into l3_sessions (student_id, test_key, domain_key, career_key, question_ids)
         values ($1, $2, $3, $4, $5) returning id`,
        [studentId, testKey, domainKey, careerKey, JSON.stringify(questionIds)]
      );
      return Response.json({ sessionId: rows[0].id, testKey, questions });
    }

    return Response.json({ error: "level must be 1, 2, or 3" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
