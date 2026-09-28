"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResultsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const studentId = params.get("studentId");

  const [authChecked, setAuthChecked] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.loggedIn) return router.push("/login");
      setAuthChecked(true);
    });
  }, [router]);

  useEffect(() => {
    if (!authChecked || !studentId) return;
    fetch(`/api/report?studentId=${studentId}`).then((r) => r.json()).then(setReport);
  }, [authChecked, studentId]);

  function loadRazorpay() {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = resolve;
      document.body.appendChild(s);
    });
  }

  async function unlock() {
    setBusy(true);
    setError("");
    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error);

      await loadRazorpay();

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Shikha",
        description: "Full career discovery report",
        handler: async function (response) {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          if (!verifyRes.ok) {
            const d = await verifyRes.json();
            setError(d.error || "Payment verification failed");
            return;
          }
          const fresh = await fetch(`/api/report?studentId=${studentId}`).then((r) => r.json());
          setReport(fresh);
        },
        theme: { color: "#D33B36" },
      });
      rzp.open();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  if (!authChecked || !report) return null;

  return (
    <div style={{ minHeight: "100vh" }}>
      <nav className="page-nav">
        <Link href="/" className="brand">
          <img src="/shikha-direct-icon.png" alt="" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Shikha</span>
        </Link>
        <Link href="/dashboard" className="btn btn-ghost">Back to dashboard</Link>
      </nav>

      <main style={{ display: "flex", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 620 }}>

          {/* ---- MANDATORY SAFETY INTERSTITIAL -- cannot be skipped ---- */}
          {!acknowledged && (
            <div className="card" style={{ padding: 36 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--flame)", marginBottom: 12 }}>
                BEFORE YOU SEE THIS
              </div>
              <p style={{ lineHeight: 1.7, color: "var(--ink)", marginBottom: 14 }}>
                This result is <b>not a ranking</b>, not a comparison with other students, and
                not a measure of {report.student}&apos;s worth or your family&apos;s standing.
                It reflects one afternoon&apos;s worth of answers, nothing more.
              </p>
              <p style={{ lineHeight: 1.7, color: "var(--ink)", marginBottom: 14 }}>
                Whatever it says, it&apos;s a starting point for a conversation — not a verdict
                on anything.
              </p>
              <div style={{ background: "var(--paper-warm)", borderRadius: 12, padding: 18, marginBottom: 20 }}>
                <b style={{ fontSize: 13.5 }}>A note if you&apos;re a parent reading this:</b>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--slate)", margin: "8px 0 0" }}>
                  If this result surprises you, please resist comparing it to siblings,
                  relatives, or other students. Interests at this age shift substantially with
                  more exposure — this is a snapshot, not a prediction.
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setAcknowledged(true)} style={{ width: "100%" }}>
                I understand — show me the result
              </button>
            </div>
          )}

          {/* ---- LOCKED TEASER ---- */}
          {acknowledged && report.locked && (
            <div className="card" style={{ padding: 36, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--slate-light)", marginBottom: 6 }}>{report.student}&apos;s result</div>
              {report.topDomainLabel && (
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: "0 0 6px" }}>{report.topDomainLabel}</h1>
              )}
              {report.topCareerLabel && (
                <p style={{ color: "var(--slate)", fontSize: 15, margin: "0 0 16px" }}>Leaning toward: {report.topCareerLabel}</p>
              )}
              {report.readinessBand && (
                <span style={{
                  display: "inline-block", background: "var(--teal-glow)", color: "var(--teal)",
                  padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, marginBottom: 24,
                }}>
                  Readiness: {report.readinessBand}
                </span>
              )}

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 22, marginTop: 6 }}>
                <p style={{ fontSize: 14, color: "var(--slate)", marginBottom: 16 }}>
                  Unlock the full report for the reasoning behind this, real career details,
                  and honest context for reading it well.
                </p>
                {error && <div className="error-box">{error}</div>}
                <button className="btn btn-primary" onClick={unlock} disabled={busy} style={{ fontSize: 16, padding: "13px 26px" }}>
                  {busy ? "Please wait..." : "Unlock full report — ₹39"}
                </button>
              </div>
            </div>
          )}

          {/* ---- FULL REPORT ---- */}
          {acknowledged && !report.locked && (
            <div className="card report-print-area" style={{ padding: 36 }}>
              <div className="print-only-header" style={{ display: "none" }}>
                <img src="/shikha-direct-icon.png" alt="" style={{ height: 22 }} />
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>Shikha &mdash; Career Discovery Report</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginBottom: 4 }}>{report.student}&apos;s recommended direction</div>
                  <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: 0 }}>
                    {report.l2?.career?.label || report.l1?.domain?.label}
                  </h1>
                  {report.riasec && (
                    <p style={{ fontSize: 13, color: "var(--slate-light)", margin: "4px 0 0" }}>
                      RIASEC profile: {report.riasec.name} ({report.riasec.code})
                    </p>
                  )}
                </div>
                <button className="btn btn-ghost no-print" onClick={() => window.print()} style={{ fontSize: 13, padding: "8px 14px", flexShrink: 0 }}>
                  Print / Save as PDF
                </button>
              </div>

              {report.l3 && (
                <div style={{ margin: "14px 0 0" }}>
                  <span style={{
                    display: "inline-block", background: "var(--teal-glow)", color: "var(--teal)",
                    padding: "5px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                  }}>
                    {report.l3.safeBand} &middot; {report.l3.score}%
                  </span>
                </div>
              )}

              <div style={{ background: "var(--paper-warm)", borderRadius: 12, padding: 18, margin: "20px 0" }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--flame)", marginBottom: 6, letterSpacing: "0.04em" }}>WHY THIS RECOMMENDATION</div>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--slate)", margin: 0 }}>{report.narrative?.intro}</p>
              </div>

              {report.narrative?.body?.map((p, i) => (
                <p key={i} style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink)", marginBottom: 14 }}>{p}</p>
              ))}

              {/* ---- LEVEL 1 BREAKDOWN CHART ---- */}
              {report.l1?.tallyBreakdown && (
                <div style={{ marginTop: 26 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, marginBottom: 12 }}>
                    Level 1 breakdown &mdash; across all six domains
                  </h3>
                  {report.l1.tallyBreakdown.map((row) => (
                    <div key={row.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, fontSize: 12.5 }}>
                      <span style={{ width: 110, flexShrink: 0, color: "var(--slate)", fontFamily: "monospace" }}>{row.label}</span>
                      <div style={{ flex: 1, background: "var(--paper-warm)", borderRadius: 5, height: 9, overflow: "hidden" }}>
                        <div style={{ width: `${row.percent}%`, height: "100%", background: "var(--flame)", borderRadius: 5 }} />
                      </div>
                      <span style={{ width: 34, flexShrink: 0, color: "var(--slate-light)", fontFamily: "monospace", textAlign: "right" }}>{row.percent}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ---- LEVEL 2 BREAKDOWN CHART ---- */}
              {report.l2?.tallyBreakdown && (
                <div style={{ marginTop: 22 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, marginBottom: 12 }}>
                    Level 2 breakdown &mdash; careers within {report.l1?.domain?.label}
                  </h3>
                  {report.l2.tallyBreakdown.map((row) => (
                    <div key={row.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, fontSize: 12.5 }}>
                      <span style={{ width: 110, flexShrink: 0, color: "var(--slate)", fontFamily: "monospace" }}>{row.label}</span>
                      <div style={{ flex: 1, background: "var(--paper-warm)", borderRadius: 5, height: 9, overflow: "hidden" }}>
                        <div style={{ width: `${row.percent}%`, height: "100%", background: "var(--teal)", borderRadius: 5 }} />
                      </div>
                      <span style={{ width: 34, flexShrink: 0, color: "var(--slate-light)", fontFamily: "monospace", textAlign: "right" }}>{row.percent}%</span>
                    </div>
                  ))}
                </div>
              )}

              {report.careerDetail && (
                <div style={{ marginTop: 26 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 8 }}>What this could actually look like</h3>
                  <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.65, marginBottom: 18 }}>{report.careerDetail.diverseRoles}</p>

                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 8 }}>Where people in this field work</h3>
                  <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.65, marginBottom: 18 }}>{report.careerDetail.exampleCompanies}</p>

                  {report.careerDetail.entrepreneurshipNote && (
                    <>
                      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 8 }}>If you&apos;re drawn to entrepreneurship</h3>
                      <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.65, marginBottom: 18 }}>{report.careerDetail.entrepreneurshipNote}</p>
                    </>
                  )}

                  {report.careerDetail.demandOutlook && (
                    <>
                      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 8 }}>Why this field, looking ahead</h3>
                      <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.65, marginBottom: 18 }}>{report.careerDetail.demandOutlook}</p>
                    </>
                  )}
                </div>
              )}

              {report.l3?.weakTopics?.length > 0 && (
                <div style={{ marginTop: 4, marginBottom: 22 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 8 }}>Topics worth another look</h3>
                  <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.65 }}>
                    Based on the readiness check, these specific topics are worth some extra attention: {report.l3.weakTopics.join(", ")}.
                  </p>
                </div>
              )}

              {report.caveats && (
                <div style={{ background: "var(--paper-warm)", borderRadius: 12, padding: 20, marginTop: 10 }}>
                  <b style={{ fontSize: 13.5 }}>Important context for reading this</b>
                  <ul style={{ margin: "10px 0 0", paddingLeft: 18 }}>
                    {report.caveats.map((c, i) => (
                      <li key={i} style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.6, marginBottom: 8 }}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Results() {
  return <Suspense fallback={null}><ResultsInner /></Suspense>;
}
