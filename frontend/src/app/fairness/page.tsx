"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FairnessResponse, SubgroupFairnessMetric } from "@/lib/types";
import { Scale, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

export default function FairnessPage() {
  const [fairnessData, setFairnessData] = useState<FairnessResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api.getFairness()
      .then((res) => {
        if (mounted) {
          setFairnessData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || "Failed to load fairness metrics.");
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const renderMetric = (val: number | null | undefined, isPercent: boolean = true) => {
    if (val === null || val === undefined) {
      return <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>N/A</span>;
    }
    return isPercent ? `${(val * 100).toFixed(1)}%` : val.toString();
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 0" }}>
        <p style={{ color: "var(--text-muted)" }}>Evaluating subgroup fairness on held-out test data...</p>
      </div>
    );
  }

  if (error || !fairnessData) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
        <p style={{ color: "var(--color-fake)" }}>{error || "Unable to display fairness dashboard."}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
          Subgroup Fairness & Bias Analysis
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "800px" }}>
          Diagnostic evaluation of error rates across ideological categories and topic domains. To prevent shortcut learning, <strong>political leaning and publisher outlet were strictly excluded from model feature extraction</strong>.
        </p>
      </div>

      {/* Critical Methodology Callout */}
      <div
        className="card"
        style={{
          backgroundColor: "rgba(59, 130, 246, 0.08)",
          borderColor: "rgba(59, 130, 246, 0.25)",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <Scale size={24} style={{ color: "#60a5fa", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#93c5fd", marginBottom: "0.3rem" }}>
              How to Interpret These Diagnostic Disparities
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
              In synthetic training corpora, rhetorical templates frequently correlate with metadata (e.g. sensational templates generated with right-leaning flags). The models never inspect ideological metadata. Subgroup differences reflect varying stylistic density across categories rather than intentional bias. These metrics serve as alert thresholds for human fact-checkers.
            </p>
          </div>
        </div>
      </div>

      {/* Political Leaning Subgroup Table */}
      <div className="card" style={{ marginBottom: "2.5rem" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.4rem" }}>
          Performance by Political Leaning (Held-Out Test Set)
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
          Analysis across <code>left</code>, <code>center</code>, and <code>right</code> leaning test samples.
        </p>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ideological Leaning</th>
                <th>Test Samples (N)</th>
                <th>Accuracy</th>
                <th>False Positive Rate (FPR)</th>
                <th>False Negative Rate (FNR)</th>
                <th>Precision</th>
                <th>Recall</th>
              </tr>
            </thead>
            <tbody>
              {fairnessData.political_lean_metrics.map((m) => (
                <tr key={m.subgroup}>
                  <td style={{ fontWeight: 600, textTransform: "capitalize" }}>
                    {m.subgroup}
                  </td>
                  <td>{m.sample_count}</td>
                  <td style={{ fontWeight: 600 }}>{renderMetric(m.accuracy)}</td>
                  <td style={{ color: m.false_positive_rate && m.false_positive_rate > 0.15 ? "var(--color-fake)" : "inherit" }}>
                    {renderMetric(m.false_positive_rate)}
                  </td>
                  <td style={{ color: m.false_negative_rate && m.false_negative_rate > 0.15 ? "var(--color-fake)" : "inherit" }}>
                    {renderMetric(m.false_negative_rate)}
                  </td>
                  <td>{renderMetric(m.precision)}</td>
                  <td>{renderMetric(m.recall)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Topic Domain Subgroup Table */}
      <div className="card">
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.4rem" }}>
          Performance by Topical Domain
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
          Diagnostic error rates across 6 news subjects: economy, health, politics, technology, sports, and environment.
        </p>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Topical Subject</th>
                <th>Test Samples (N)</th>
                <th>Accuracy</th>
                <th>False Positive Rate</th>
                <th>False Negative Rate</th>
                <th>Precision</th>
                <th>Recall</th>
              </tr>
            </thead>
            <tbody>
              {fairnessData.topic_metrics.map((m) => (
                <tr key={m.subgroup}>
                  <td style={{ fontWeight: 600, textTransform: "capitalize" }}>
                    {m.subgroup}
                  </td>
                  <td>{m.sample_count}</td>
                  <td style={{ fontWeight: 600 }}>{renderMetric(m.accuracy)}</td>
                  <td>{renderMetric(m.false_positive_rate)}</td>
                  <td>{renderMetric(m.false_negative_rate)}</td>
                  <td>{renderMetric(m.precision)}</td>
                  <td>{renderMetric(m.recall)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
