import { query } from "../../../../lib/db";
import { gradeL1, gradeL2, gradeL3 } from "../../../../lib/scoring";
import { getSession } from "../../../../lib/auth";

const TABLES = { 1: "l1_sessions", 2: "l2_sessions", 3: "l3_sessions" };

async function assertOwnsSession(accountId, level, sessionId) {
  const table = TABLES[level];
  const { rows } = await query(
    `select s.student_id from ${table} s
     join students st on st.id = s.student_id
     where s.id = $1 and st.account_id = $2`,
    [sessionId, accountId]
  );
  return rows.length > 0 ? rows[0].student_id : null;
}

export async function POST(req) {
  try {
    const session = getSession(req);
    if (!session) {
      return Response.json({ error: "You must be logged in" }, { status: 401 });
    }

    const body = await req.json();
    const { level, sessionId } = body;
    if (!level || !sessionId) {
      return Response.json({ error: "level and sessionId are required" }, { status: 400 });
    }

    const studentId = await assertOwnsSession(session.accountId, level, sessionId);
    if (!studentId) {
      return Response.json({ error: "That session does not belong to your account" }, { status: 403 });
    }

    if (level === 1) {
      const { tally, topDomain } = await gradeL1(sessionId);
      await query(
        `update l1_sessions set completed_at = now(), result_domain = $2, result_tally = $3 where id = $1`,
        [sessionId, topDomain, JSON.stringify(tally)]
      );
      return Response.json({ topDomain, tally });
    }

    if (level === 2) {
      const { tally, topCareer } = await gradeL2(sessionId);
      await query(
        `update l2_sessions set completed_at = now(), result_career = $2, result_tally = $3 where id = $1`,
        [sessionId, topCareer, JSON.stringify(tally)]
      );
      return Response.json({ topCareer, tally });
    }

    if (level === 3) {
      const result = await gradeL3(sessionId);
      await query(`update l3_sessions set completed_at = now() where id = $1`, [sessionId]);
      await query(
        `insert into l3_results (session_id, student_id, score, band, weak_topics)
         values ($1, $2, $3, $4, $5)`,
        [sessionId, studentId, result.score, result.band, result.weakTopics]
      );
      return Response.json(result);
    }

    return Response.json({ error: "level must be 1, 2, or 3" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
