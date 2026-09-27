"use client";
import { useState, useEffect } from "react";

export default function TestPayment() {
  const [me, setMe] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState("login"); // login | signup
  const [student, setStudent] = useState(null);
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);

  function addLog(msg) {
    setLog((l) => [...l, msg]);
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.loggedIn ? d : null));
  }, []);

  async function doAuth(e) {
    e.preventDefault();
    setBusy(true);
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body = mode === "login" ? { email, password } : { email, password, displayName };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return addLog("Auth error: " + data.error);
    setMe({ loggedIn: true, displayName: data.account?.displayName });
    addLog("Logged in.");
    loadStudents();
  }

  async function loadStudents() {
    const res = await fetch("/api/students");
    const data = await res.json();
    if (data.students?.length > 0) {
      setStudent(data.students[0]);
    }
  }

  async function createStudent() {
    setBusy(true);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Test Child" }),
    });
    const data = await res.json();
    setBusy(false);
    setStudent(data.student);
    addLog("Created test student: " + data.student.display_name);
  }

  async function post(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async function autoCompleteJourney() {
    setBusy(true);
    try {
      addLog("Starting Level 1...");
      const l1 = await post("/api/session/start", { level: 1, studentId: student.id });
      for (const s of l1.stories) {
        for (let di = 0; di < s.decisions.length; di++) {
          await post("/api/session/answer", {
            level: 1, sessionId: l1.sessionId, storyKey: s.key, decisionIndex: di, optionIndex: 0,
          });
        }
      }
      const r1 = await post("/api/session/submit", { level: 1, sessionId: l1.sessionId });
      addLog("Level 1 done. Top domain: " + r1.topDomain);

      addLog("Starting Level 2...");
      const l2 = await post("/api/session/start", { level: 2, studentId: student.id, domainKey: r1.topDomain });
      for (const s of l2.stories) {
        for (let di = 0; di < s.decisions.length; di++) {
          await post("/api/session/answer", {
            level: 2, sessionId: l2.sessionId, storyKey: s.key, decisionIndex: di, optionIndex: 0,
          });
        }
      }
      const r2 = await post("/api/session/submit", { level: 2, sessionId: l2.sessionId });
      addLog("Level 2 done. Top career: " + r2.topCareer);
      addLog("Journey complete. Ready to test the paywall.");
    } catch (err) {
      addLog("Error: " + err.message);
    }
    setBusy(false);
  }

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = resolve;
      document.body.appendChild(script);
    });
  }

  async function buyReport() {
    setBusy(true);
    try {
      addLog("Creating Razorpay order...");
      const order = await post("/api/payments/create-order", { studentId: student.id });
      addLog(`Order created: ${order.orderId} for ${order.amount} paise`);

      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Shikha Direct (TEST MODE)",
        description: "Unlock full career report",
        handler: async function (response) {
          addLog("Razorpay checkout returned a payment. Verifying signature server-side...");
          try {
            const verify = await post("/api/payments/verify", {
              studentId: student.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            addLog("Verified and unlocked: " + JSON.stringify(verify));
            const rep = await fetch(`/api/report?studentId=${student.id}`).then((r) => r.json());
            setReport(rep);
          } catch (err) {
            addLog("Verification failed: " + err.message);
          }
        },
        modal: {
          ondismiss: function () {
            addLog("Checkout closed without completing payment.");
          },
        },
        theme: { color: "#4F46E5" },
      });
      rzp.open();
    } catch (err) {
      addLog("Error: " + err.message);
    }
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "system-ui", padding: 20 }}>
      <h1>Phase 4 Payment Test Harness</h1>
      <p style={{ color: "#666" }}>
        Not the real product UI -- just enough to prove signup, the journey, and a real
        Razorpay test-mode payment all work together end to end.
      </p>

      {!me && (
        <form onSubmit={doAuth} style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
          <div>
            <button type="button" onClick={() => setMode("login")} style={{ fontWeight: mode === "login" ? "bold" : "normal" }}>Login</button>
            {" | "}
            <button type="button" onClick={() => setMode("signup")} style={{ fontWeight: mode === "signup" ? "bold" : "normal" }}>Sign up</button>
          </div>
          <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {mode === "signup" && (
            <input placeholder="your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          )}
          <button disabled={busy}>{mode === "login" ? "Log in" : "Sign up"}</button>
        </form>
      )}

      {me && !student && (
        <div>
          <p>Logged in as {me.displayName}. No student profile yet.</p>
          <button onClick={createStudent} disabled={busy}>Create test student</button>
        </div>
      )}

      {me && student && (
        <div>
          <p>Student: <b>{student.display_name}</b></p>
          <button onClick={autoCompleteJourney} disabled={busy} style={{ marginRight: 10 }}>
            Auto-complete Level 1 + 2
          </button>
          <button onClick={buyReport} disabled={busy} style={{ background: "#4F46E5", color: "white", padding: "8px 16px", border: "none", borderRadius: 6 }}>
            Buy full report (test payment)
          </button>
        </div>
      )}

      {report && (
        <div style={{ marginTop: 20, padding: 16, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8 }}>
          <h3>Report unlocked: {String(!report.locked)}</h3>
          {!report.locked && <p>{report.narrative?.intro}</p>}
        </div>
      )}

      <h3 style={{ marginTop: 30 }}>Log</h3>
      <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8, whiteSpace: "pre-wrap", fontSize: 13 }}>
        {log.join("\n")}
      </pre>
    </div>
  );
}
