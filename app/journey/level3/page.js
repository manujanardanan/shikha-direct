"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function Level3Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const studentId = params.get("studentId");
  const domainKey = params.get("domain");
  const careerKey = params.get("career");

  const [authChecked, setAuthChecked] = useState(false);
  const [phase, setPhase] = useState("intro");
  const [session, setSession] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.loggedIn) return router.push("/login");
      setAuthChecked(true);
    });
  }, [router]);

  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function fmt(s) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  async function begin() {
    setPhase("loading");
    try {
      const res = await fetch("/api/session/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 3, studentId, domainKey, careerKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession(data);
      setQIdx(0); setAnswers({}); setElapsed(0);
      setPhase("playing");
    } catch (err) {
      setErrorMsg(err.message);
      setPhase("error");
    }
  }

  function pick(qid, idx) {
    setAnswers((a) => ({ ...a, [qid]: idx }));
  }

  async function submit() {
    setPhase("submitting");
    for (const q of session.questions) {
      const chosen = answers[q.id];
      if (chosen === undefined) continue;
      await fetch("/api/session/answer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 3, sessionId: session.sessionId, questionId: q.id, chosenOptionId: chosen }),
      });
    }
    await fetch("/api/session/submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: 3, sessionId: session.sessionId }),
    });
    router.push(`/results?studentId=${studentId}`);
  }

  if (!authChecked) return null;

  const q = session?.questions?.[qIdx];
  const total = session?.questions?.length || 0;
  const answeredCount = Object.keys(answers).length;

  return (
    <div style={{ minHeight: "100vh" }}>
      <nav className="page-nav">
        <Link href="/" className="brand">
          <img src="/shikha-direct-icon.png" alt="" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Shikha</span>
        </Link>
        {phase === "playing" && <span style={{ fontSize: 13, color: "var(--slate)" }}>⏱ {fmt(elapsed)} elapsed</span>}
      </nav>

      <main style={{ display: "flex", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          {phase === "intro" && (
            <div className="card" style={{ padding: 40, textAlign: "center" }}>
              <div className="stop-notice">🛑 Stop. And read the instructions carefully.</div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 14 }}>One more step: a readiness check</h1>
              <p style={{ color: "var(--slate)", lineHeight: 1.6, textAlign: "left" }}>
                A real, 15-question subject check for {careerKey}. There&apos;s no countdown and
                nothing forces submission — take the time you need. Most students take 25-30
                minutes.
              </p>
              <button className="btn btn-primary" onClick={begin} style={{ marginTop: 10 }}>I am ready to proceed</button>
            </div>
          )}

          {phase === "loading" && <div className="card" style={{ padding: 40, textAlign: "center" }}><p>Preparing questions...</p></div>}
          {phase === "submitting" && <div className="card" style={{ padding: 40, textAlign: "center" }}><p>Grading...</p></div>}
          {phase === "error" && (
            <div className="card" style={{ padding: 40, textAlign: "center" }}>
              <div className="error-box">{errorMsg}</div>
            </div>
          )}

          {phase === "playing" && q && (
            <>
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
                {session.questions.map((sq, i) => (
                  <span key={i} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: answers[sq.id] !== undefined ? "var(--flame)" : "var(--line)",
                    transform: i === qIdx ? "scale(1.4)" : "scale(1)",
                  }} />
                ))}
              </div>
              <div className="card" style={{ padding: 32 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--slate-light)", marginBottom: 12 }}>{q.subject}</div>
                <div style={{ fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>{q.question}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
                  {q.options.map((opt) => (
                    <button key={opt.index} onClick={() => pick(q.id, opt.index)}
                      style={{
                        textAlign: "left", padding: "14px 16px", borderRadius: 11,
                        border: answers[q.id] === opt.index ? "1.5px solid var(--flame)" : "1.5px solid var(--line)",
                        background: answers[q.id] === opt.index ? "rgba(211,59,54,0.05)" : "white",
                        cursor: "pointer", fontSize: 14.5,
                      }}>
                      {opt.text}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button className="btn btn-ghost" disabled={qIdx === 0} onClick={() => setQIdx(qIdx - 1)}>Back</button>
                  {qIdx < total - 1 ? (
                    <button className="btn btn-primary" onClick={() => setQIdx(qIdx + 1)}>Next ({answeredCount}/{total})</button>
                  ) : (
                    <button className="btn btn-primary" onClick={submit}>Submit ({answeredCount}/{total})</button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Level3() {
  return <Suspense fallback={null}><Level3Inner /></Suspense>;
}
