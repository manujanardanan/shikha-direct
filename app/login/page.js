"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body = mode === "login" ? { email, password } : { email, password, displayName };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error);
    router.push("/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav className="page-nav">
        <Link href="/" className="brand">
          <img src="/shikha-direct-icon.png" alt="" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Shikha</span>
        </Link>
      </nav>
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div className="card" style={{ padding: 40, width: "100%", maxWidth: 400 }}>
          <div style={{ display: "flex", gap: 20, marginBottom: 24, borderBottom: "1px solid var(--line)" }}>
            <button
              onClick={() => setMode("signup")}
              style={{
                background: "none", border: "none", padding: "0 0 12px", cursor: "pointer",
                fontWeight: 600, fontSize: 15,
                color: mode === "signup" ? "var(--flame)" : "var(--slate-light)",
                borderBottom: mode === "signup" ? "2px solid var(--flame)" : "2px solid transparent",
              }}
            >
              Create account
            </button>
            <button
              onClick={() => setMode("login")}
              style={{
                background: "none", border: "none", padding: "0 0 12px", cursor: "pointer",
                fontWeight: 600, fontSize: 15,
                color: mode === "login" ? "var(--flame)" : "var(--slate-light)",
                borderBottom: mode === "login" ? "2px solid var(--flame)" : "2px solid transparent",
              }}
            >
              Log in
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <div>
                <label style={labelStyle}>Your name</label>
                <input style={inputStyle} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
              </div>
            )}
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              {mode === "signup" && (
                <p style={{ fontSize: 12, color: "var(--slate-light)", margin: "6px 0 0" }}>At least 8 characters</p>
              )}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 8 }} disabled={busy}>
              {busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--slate)" };
const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid var(--line)",
  fontSize: 15, fontFamily: "var(--font-body)", boxSizing: "border-box",
};
