import Link from "next/link";
import { EFFECTIVE_DATE } from "../../lib/legal";

export default function LegalShell({ title, children }) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <nav className="page-nav">
        <Link href="/" className="brand">
          <img src="/shikha-direct-icon.png" alt="" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Shikha</span>
        </Link>
        <Link href="/" className="btn btn-ghost">Back to home</Link>
      </nav>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, margin: "0 0 6px" }}>{title}</h1>
        <p style={{ fontSize: 13, color: "var(--slate-light)", margin: "0 0 28px" }}>
          Effective {EFFECTIVE_DATE}
        </p>
        <div className="legal-body">{children}</div>
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--line)", fontSize: 13, color: "var(--slate-light)" }}>
          <Link href="/terms">Terms of Use</Link> &nbsp;·&nbsp; <Link href="/privacy">Privacy Policy</Link>
        </div>
      </main>
    </div>
  );
}
