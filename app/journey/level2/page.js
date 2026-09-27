"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function Level2Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const studentId = params.get("studentId");
  const domainKey = params.get("domain");

  const [authChecked, setAuthChecked] = useState(false);
  const [phase, setPhase] = useState("intro");
  const [session, setSession] = useState(null);
  const [storyIdx, setStoryIdx] = useState(0);
  const [decisionIdx, setDecisionIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [careers, setCareers] = useState([]);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.loggedIn) return router.push("/login");
      setAuthChecked(true);
    });
    if (domainKey) {
      fetch(`/api/content/careers?domain=${domainKey}`).then((r) => r.json()).then((d) => setCareers(d.careers || []));
    }
  }, [router, domainKey]);

  async function begin() {
    setPhase("loading");
    try {
      const res = await fetch("/api/session/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 2, studentId, domainKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession(data);
      setStoryIdx(0); setDecisionIdx(0); setSelected(null);
      setPhase("playing");
    } catch (err) {
      setErrorMsg(err.message);
      setPhase("error");
    }
  }

  const currentStory = session?.stories?.[storyIdx];
  const currentDecision = currentStory?.decisions?.[decisionIdx];
  const totalStories = session?.stories?.length || 0;
  const isLast = storyIdx === totalStories - 1 && decisionIdx === (currentStory?.decisions?.length || 1) - 1;

  async function confirmAndAdvance() {
    if (selected === null) return;
    await fetch("/api/session/answer", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: 2, sessionId: session.sessionId, storyKey: currentStory.key, decisionIndex: decisionIdx, optionIndex: selected }),
    });
    if (isLast) {
      const res = await fetch("/api/session/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: 2, sessionId: session.sessionId }),
      });
      const data = await res.json();
      setResult(data);
      setPhase("result");
      return;
    }
    if (decisionIdx < currentStory.decisions.length - 1) setDecisionIdx(decisionIdx + 1);
    else { setStoryIdx(storyIdx + 1); setDecisionIdx(0); }
    setSelected(null);
  }

  if (!authChecked) return null;
  if (!domainKey) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <p>No domain selected. <Link href={`/journey/level1?studentId=${studentId}`}>Go to Level 1</Link></p>
      </main>
    );
  }

  const topCareerInfo = careers.find((c) => c.career_key === result?.topCareer);

  return (
    <div style={{ minHeight: "100vh" }}>
      <nav className="page-nav">
        <Link href="/" className="brand">
          <img src="/shikha-direct-icon.png" alt="" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Shikha</span>
        </Link>
        <span style={{ fontSize: 13, color: "var(--slate)" }}>Level 2 &middot; Narrow</span>
      </nav>

      <main style={{ display: "flex", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          {phase === "intro" && (
            <div className="card" style={{ padding: 40, textAlign: "center" }}>
              <div className="stop-notice">🛑 Stop. And read the instructions carefully.</div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 14 }}>Let&apos;s go deeper</h1>
              <p style={{ color: "var(--slate)", lineHeight: 1.6, textAlign: "left" }}>
                A few more stories, each stepping into a specific career for a moment. Same as
                before: no wrong answers, go with what feels right.
              </p>
              <button className="btn btn-primary" onClick={begin} style={{ marginTop: 10 }}>I am ready to proceed</button>
            </div>
          )}

          {phase === "loading" && <div className="card" style={{ padding: 40, textAlign: "center" }}><p>Loading...</p></div>}
          {phase === "error" && (
            <div className="card" style={{ padding: 40, textAlign: "center" }}>
              <div className="error-box">{errorMsg}</div>
              <button className="btn btn-primary" onClick={begin}>Try again</button>
            </div>
          )}

          {phase === "playing" && currentStory && (
            <>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
                {session.stories.map((_, i) => (
                  <span key={i} style={{
                    width: 9, height: 9, borderRadius: "50%",
                    background: i <= storyIdx ? "var(--flame)" : "var(--line)",
                    transform: i === storyIdx ? "scale(1.3)" : "scale(1)",
                  }} />
                ))}
              </div>
              <div className="card" style={{ padding: 32, borderTop: "4px solid var(--flame)" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 26 }}>{currentStory.icon}</span>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: 19, margin: 0 }}>{currentStory.title}</h2>
                </div>
                <p style={{ color: "var(--slate)", lineHeight: 1.7, marginBottom: 22 }}>{currentStory.text}</p>
                <div style={{ fontWeight: 600, marginBottom: 14 }}>{currentDecision.prompt}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
                  {currentDecision.options.map((opt) => (
                    <button key={opt.index} onClick={() => setSelected(opt.index)}
                      style={{
                        textAlign: "left", padding: "14px 16px", borderRadius: 11,
                        border: selected === opt.index ? "1.5px solid var(--flame)" : "1.5px solid var(--line)",
                        background: selected === opt.index ? "rgba(211,59,54,0.05)" : "white",
                        cursor: "pointer", fontSize: 14.5,
                      }}>
                      {opt.text}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" disabled={selected === null} onClick={confirmAndAdvance}>
                    {isLast ? "See result" : "Continue"}
                  </button>
                </div>
              </div>
            </>
          )}

          {phase === "result" && result && (
            <div className="card" style={{ padding: 36, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--slate-light)", marginBottom: 8 }}>CAREER FIT</div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--flame)", marginBottom: 20 }}>
                {topCareerInfo?.label}
              </h1>
              {topCareerInfo?.hasReadinessTest ? (
                <Link href={`/journey/level3?studentId=${studentId}&domain=${domainKey}&career=${result.topCareer}`} className="btn btn-primary">
                  Take the readiness check
                </Link>
              ) : (
                <>
                  <p style={{ color: "var(--slate-light)", fontSize: 14, marginBottom: 16 }}>
                    A readiness check for this career is coming soon.
                  </p>
                  <Link href={`/results?studentId=${studentId}`} className="btn btn-primary">See summary</Link>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Level2() {
  return <Suspense fallback={null}><Level2Inner /></Suspense>;
}
