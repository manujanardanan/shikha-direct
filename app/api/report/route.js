import { query } from "../../../lib/db";
import { getSession } from "../../../lib/auth";
import { buildStudentReport } from "../../../lib/report";

export async function GET(req) {
  const session = getSession(req);
  if (!session) {
    return Response.json({ error: "You must be logged in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) {
    return Response.json({ error: "studentId is required" }, { status: 400 });
  }

  try {
    const { rows } = await query(
      "select id from students where id = $1 and account_id = $2",
      [studentId, session.accountId]
    );
    if (rows.length === 0) {
      return Response.json({ error: "That student does not belong to your account" }, { status: 403 });
    }

    const report = await buildStudentReport(studentId);
    if (!report) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }
    return Response.json(report);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
