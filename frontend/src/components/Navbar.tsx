"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link href="/" className="nav-brand">
          <div className="nav-logo-badge">NLP</div>
          <span>Fake News Detector</span>
        </Link>

        <nav aria-label="Main Navigation">
          <ul className="nav-links">
            <li>
              <Link
                href="/"
                className={`nav-link ${pathname === "/" ? "active" : ""}`}
              >
                Analysis
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard"
                className={`nav-link ${pathname === "/dashboard" ? "active" : ""}`}
              >
                Evaluation Metrics
              </Link>
            </li>
            <li>
              <Link
                href="/fairness"
                className={`nav-link ${pathname === "/fairness" ? "active" : ""}`}
              >
                Subgroup Fairness
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className={`nav-link ${pathname === "/about" ? "active" : ""}`}
              >
                Model Card & Ethics
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
