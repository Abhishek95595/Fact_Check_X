import Link from "next/link";

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>
            Fake News Detection Using Natural Language Processing
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.825rem", marginTop: "0.25rem" }}>
            HCLTech Career Shaper IV Year Industry Project (Project No. 31) • Model v1.0.0
          </p>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          <Link href="/about" style={{ textDecoration: "underline" }}>
            Model Card & Ethics
          </Link>
          <Link href="/dashboard" style={{ textDecoration: "underline" }}>
            Evaluation Metrics
          </Link>
          <Link href="/fairness" style={{ textDecoration: "underline" }}>
            Fairness Analysis
          </Link>
        </div>
      </div>
    </footer>
  );
}
