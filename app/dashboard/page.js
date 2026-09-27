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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.loggedIn) return router.push("/login");
        setMe(d);
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
    await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name, schoolName: school || null }),
    });
    setBusy(false);
    setName("");
    setSchool("");
    setShowAdd(false);
    loadStudents();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  function statusFor(s) {
    if (s.l3_completed_at) return { label: "Readiness check complete", next: "results" };
    if (s.l2_completed_at) return { label: "Level 2 done", next: "level3" };
    if (s.l1_completed_at) return { label: "Level 1 done", next: "level2" };
    return { label: "Not started", next: "level1" };
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
            <button className="btn btn-primary" disabled={busy}>{busy ? "Adding..." : "Add child"}</button>
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
                <Link
                  href={status.next === "results" ? `/results?studentId=${s.id}` : `/journey/${status.next}?studentId=${s.id}`}
                  className="btn btn-primary" style={{ padding: "9px 16px", fontSize: 14 }}>
                  {status.next === "results" ? "View result" : "Continue"}
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
