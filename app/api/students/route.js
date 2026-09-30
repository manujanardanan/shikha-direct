import { query } from "../../../lib/db";
import { getSession } from "../../../lib/auth";
import { accountHasCurrentConsent, CONSENT_REQUIRED_RESPONSE } from "../../../lib/consent";

export async function GET(req) {
  const session = getSession(req);
  if (!session) {
    return Response.json({ error: "You must be logged in" }, { status: 401 });
  }
  try {
    const { rows } = await query(
      `select
         s.id, s.display_name, s.school_name, s.created_at,
         l1.completed_at as l1_completed_at,
         l1.result_domain as l1_result_domain,
         l2.completed_at as l2_completed_at,
         l2.domain_key as l2_domain_key,
         l2.result_career as l2_result_career,
         (l2.result_career is not null and exists (
            select 1 from content_l3_map m
            where m.pair_key = l2.domain_key || '.' || l2.result_career
         )) as has_l3_test,
         l3.computed_at as l3_completed_at,
         (ru.student_id is not null) as report_unlocked
       from students s
       left join lateral (
         select completed_at, result_domain from l1_sessions
         where student_id = s.id and completed_at is not null
         order by completed_at desc limit 1
       ) l1 on true
       left join lateral (
         select completed_at, domain_key, result_career from l2_sessions
         where student_id = s.id and completed_at is not null
         order by completed_at desc limit 1
       ) l2 on true
       left join lateral (
         select computed_at from l3_results
         where student_id = s.id
         order by computed_at desc limit 1
       ) l3 on true
       left join report_unlocks ru on ru.student_id = s.id
       where s.account_id = $1
       order by s.created_at`,
      [session.accountId]
    );
    return Response.json({ students: rows });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = getSession(req);
  if (!session) {
    return Response.json({ error: "You must be logged in" }, { status: 401 });
  }
  try {
    if (!(await accountHasCurrentConsent(session.accountId))) {
      return Response.json(CONSENT_REQUIRED_RESPONSE, { status: 403 });
    }
    const { displayName, schoolName, guardianConfirmed } = await req.json();
    if (!displayName) {
      return Response.json({ error: "displayName is required" }, { status: 400 });
    }
    if (guardianConfirmed !== true) {
      return Response.json(
        { error: "Please confirm you are this child's parent or legal guardian." },
        { status: 400 }
      );
    }
    const { rows } = await query(
      `insert into students (account_id, display_name, school_name, guardian_confirmed_at)
       values ($1, $2, $3, now()) returning id, display_name, school_name`,
      [session.accountId, displayName, schoolName || null]
    );
    return Response.json({ student: rows[0] });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
