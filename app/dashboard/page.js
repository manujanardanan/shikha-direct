"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [students, setStudents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [consentTick, setConsentTick] = useState(false);
  const [addError, setAddError] = useState("");
  const [guardianTick, setGuardianTick] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.loggedIn) return router.push("/login");
        setMe(d);
        if (d.consentCurrent === false) setNeedsConsent(true);
        loadStudents();
      });
  }, [router]);

  function loadStudents() {
    fetch("/api/students")
      .then((r) => r.json())
      .then((d) => setStudents(d.students || []));
  }

  async function addChild(e) {
    e.preventDefault();
    setBusy(true);
    setAddError("");
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name, schoolName: school || null, guardianConfirmed: guardianTick }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json();
      if (d.code === "CONSENT_REQUIRED") setNeedsConsent(true);
      else setAddError(d.error || "Could not add child");
      return;
    }
    setName("");
    setSchool("");
    setGuardianTick(false);
    setShowAdd(false);
    loadStudents();
  }

  async function acceptConsent() {
    setBusy(true);
    const res = await fetch("/api/auth/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: true }),
    });
    setBusy(false);
    if (res.ok) setNeedsConsent(false);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  // Works out where "Continue" should really go for this child. Each later step
  // needs to know the result of the one before it, so the link must carry it.
  function statusFor(s) {
    const id = s.id;
    if (s.l3_completed_at) {
      return { label: "Readiness check complete", href: `/results?studentId=${id}`, cta: "View result" };
    }
    if (s.l2_completed_at) {
      if (s.has_l3_test) {
        return {
          label: "Level 2 done",
          href: `/journey/level3?studentId=${id}&domain=${s.l2_domain_key}&career=${s.l2_result_career}`,
          cta: "Continue",
        };
      }
      // No readiness check exists yet for this career -- the journey ends at the summary.
      return { label: "Journey complete", href: `/results?studentId=${id}`, cta: "View result" };
    }
    if (s.l1_completed_at) {
      return {
        label: "Level 1 done",
        href: `/journey/level2?studentId=${id}&domain=${s.l1_result_domain}`,
        cta: "Continue",
      };
    }
    return { label: "Not started", href: `/journey/level1?studentId=${id}`, cta: "Continue" };
  }

  if (!me) return null;

  return (
    <div>
      <nav className="page-nav">
        <Link href="/" className="brand">
          <img src="/shikha-direct-icon.png" alt="" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Shikha</span>
        </Link>
        <button className="btn btn-ghost" onClick={logout}>Log out</button>
      </nav>

      {needsConsent ? (
        <main style={{ maxWidth: 520, margin: "0 auto", padding: "60px 20px" }}>
          <div className="card" style={{ padding: 32 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--flame)", marginBottom: 10 }}>ONE QUICK STEP</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: "0 0 12px" }}>Please review our Terms and Privacy Policy</h1>
            <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.65, margin: "0 0 18px" }}>
              Before we can collect any information about your child, we need you to review and accept the
              current Terms of Use and Privacy Policy.
            </p>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.55, color: "var(--slate)", cursor: "pointer", marginBottom: 20 }}>
              <input type="checkbox" checked={consentTick} onChange={(e) => setConsentTick(e.target.checked)}
                style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }} />
              <span>
                I am 18 or older and the parent or legal guardian of any child I add. I agree to the{" "}
                <Link href="/terms" target="_blank" style={{ color: "var(--flame)", fontWeight: 600 }}>Terms of Use</Link>{" "}
                and consent to my child’s information being handled as described in the{" "}
                <Link href="/privacy" target="_blank" style={{ color: "var(--flame)", fontWeight: 600 }}>Privacy Policy</Link>.
              </span>
            </label>
            <button className="btn btn-primary" style={{ width: "100%" }} disabled={!consentTick || busy} onClick={acceptConsent}>
              {busy ? "Please wait..." : "Accept and continue"}
            </button>
          </div>
        </main>
      ) : (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: 0 }}>Your children</h1>
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancel" : "+ Add a child"}
          </button>
        </div>

        {showAdd && (
          <form onSubmit={addChild} className="card" style={{ padding: 20, marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <input placeholder="Child's name" value={name} onChange={(e) => setName(e.target.value)} required
              style={{ padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--line)" }} />
            <input placeholder="School (optional)" value={school} onChange={(e) => setSchool(e.target.value)}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--line)" }} />
            <p style={{ fontSize: 12, color: "var(--slate-light)", margin: 0, lineHeight: 1.5 }}>
              A first name or nickname is enough. School is optional and only ever used in combined
              totals (for example, how many students from a school use Shikha), never with your child’s
              name or results.
            </p>
            {addError && <div className="error-box" style={{ marginBottom: 0 }}>{addError}</div>}
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.55, color: "var(--slate)", cursor: "pointer" }}>
              <input type="checkbox" checked={guardianTick} onChange={(e) => setGuardianTick(e.target.checked)}
                style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0 }} />
              <span>
                I am this child’s parent or legal guardian, and I consent to Shikha handling their
                information as described in the{" "}
                <Link href="/privacy" target="_blank" style={{ color: "var(--flame)", fontWeight: 600 }}>Privacy Policy</Link>.
              </span>
            </label>
            <button className="btn btn-primary" disabled={busy || !guardianTick}>{busy ? "Adding..." : "Add child"}</button>
          </form>
        )}

        {students.length === 0 && !showAdd && (
          <p style={{ color: "var(--slate)" }}>Add your first child to get started.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {students.map((s) => {
            const status = statusFor(s);
            return (
              <div key={s.id} className="card" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{s.display_name}</div>
                  <div style={{ fontSize: 13, color: "var(--slate-light)" }}>{status.label}</div>
                </div>
                <Link href={status.href} className="btn btn-primary" style={{ padding: "9px 16px", fontSize: 14 }}>
                  {status.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </main>
      )}
    </div>
  );
}
