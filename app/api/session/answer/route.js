import { query } from "../../../../lib/db";
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
  return rows.length > 0;
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

    const owns = await assertOwnsSession(session.accountId, level, sessionId);
    if (!owns) {
      return Response.json({ error: "That session does not belong to your account" }, { status: 403 });
    }

    if (level === 1 || level === 2) {
      const { storyKey, decisionIndex, optionIndex } = body;
      if (!storyKey || decisionIndex === undefined || optionIndex === undefined) {
        return Response.json(
          { error: "storyKey, decisionIndex, and optionIndex are required" },
          { status: 400 }
        );
      }
      const table = level === 1 ? "l1_answers" : "l2_answers";
      await query(
        `insert into ${table} (session_id, story_key, decision_index, option_index)
         values ($1, $2, $3, $4)`,
        [sessionId, storyKey, decisionIndex, optionIndex]
      );
      return Response.json({ ok: true });
    }

    if (level === 3) {
      const { questionId, chosenOptionId } = body;
      if (!questionId || chosenOptionId === undefined) {
        return Response.json(
          { error: "questionId and chosenOptionId are required" },
          { status: 400 }
        );
      }
      const { rows } = await query(
        "select correct_option_id from content_l3_questions where id = $1",
        [questionId]
      );
      if (rows.length === 0) {
        return Response.json({ error: "Unknown questionId" }, { status: 404 });
      }
      const isCorrect = rows[0].correct_option_id === chosenOptionId;
      await query(
        `insert into l3_answers (session_id, question_id, chosen_option_id, is_correct)
         values ($1, $2, $3, $4)`,
        [sessionId, questionId, chosenOptionId, isCorrect]
      );
      return Response.json({ ok: true });
    }

    return Response.json({ error: "level must be 1, 2, or 3" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
