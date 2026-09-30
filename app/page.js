import Link from "next/link";

export default function Home() {
  return (
    <div>
      <nav className="page-nav">
        <Link href="/" className="brand">
          <img src="/shikha-direct-icon.png" alt="" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
            Shikha
          </span>
        </Link>
        <Link href="/login" className="btn btn-primary">
          Get started
        </Link>
      </nav>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--flame)", letterSpacing: "0.08em", marginBottom: 16 }}>
          FOR FAMILIES
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, lineHeight: 1.15, margin: "0 0 20px" }}>
          Help your child find their path — grounded in real psychology, not a guess.
        </h1>
        <p style={{ fontSize: 17, color: "var(--slate)", lineHeight: 1.6, margin: "0 0 32px" }}>
          A guided journey through stories and a real readiness check, based on Holland&apos;s
          RIASEC theory — the same framework used by career counselors worldwide.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ fontSize: 16, padding: "14px 28px" }}>
          Start your child&apos;s journey
        </Link>
        <p style={{ marginTop: 16, fontSize: 13, color: "var(--slate-light)" }}>
          Free to complete. A small fee unlocks the full detailed report.
        </p>
      </main>
      <footer style={{ textAlign: "center", padding: "0 20px 32px", fontSize: 12.5, color: "var(--slate-light)" }}>
        <Link href="/terms">Terms of Use</Link> &nbsp;·&nbsp; <Link href="/privacy">Privacy Policy</Link>
      </footer>
    </div>
  );
}
