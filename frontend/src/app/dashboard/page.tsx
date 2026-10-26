"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { MetricsResponse, ConfusionMatrixResponse, MetricDetail } from "@/lib/types";
import { BarChart3, Database, Layers, CheckCircle2, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const [metricsData, setMetricsData] = useState<MetricsResponse | null>(null);
  const [cmData, setCmData] = useState<ConfusionMatrixResponse | null>(null);
  const [selectedCmModel, setSelectedCmModel] = useState<string>("ensemble");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cmLoading, setCmLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    Promise.all([api.getMetrics(), api.getConfusionMatrix(selectedCmModel)])
      .then(([metricsRes, cmRes]) => {
        if (mounted) {
          setMetricsData(metricsRes);
          setCmData(cmRes);
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        if (mounted) {
          console.error("Dashboard metrics error:", err);
          setError(err.message || "Failed to load evaluation metrics.");
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleCmModelChange = (model: string) => {
    setSelectedCmModel(model);
    setCmLoading(true);
    api.getConfusionMatrix(model)
      .then((res) => {
        setCmData(res);
        setCmLoading(false);
      })
      .catch((err) => {
        console.error("Confusion matrix error:", err);
        setCmLoading(false);
      });
  };

  const modelLabels: Record<string, string> = {
    ensemble: "Soft-Voting Ensemble (LR+NB+RF)",
    logistic_regression: "Logistic Regression",
    naive_bayes: "Multinomial Naive Bayes",
    linear_svm: "Linear SVM (Calibrated)",
    random_forest: "Random Forest",
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 0" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading evaluation metrics from backend...</p>
      </div>
    );
  }

  if (error || !metricsData) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "3rem", borderColor: "var(--color-fake-border)" }}>
        <AlertCircle size={32} style={{ color: "var(--color-fake)", margin: "0 auto 1rem" }} />
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Unable to Load Evaluation Metrics
        </h3>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-secondary">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
          Model Evaluation & Performance Benchmarks
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "800px" }}>
          Evaluated on <strong>{metricsData.evaluation_test_size} held-out test articles</strong> (80/20 stratified split, random_state=42) using TF-IDF unigram and bigram features. Cross-validation reflects 5-fold stratified training stability.
        </p>
      </div>

      {/* Dataset & Evaluation Summary Cards */}
      <div className="grid-3" style={{ marginBottom: "2rem" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            <Database size={16} />
            DATASET PROVENANCE
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
            1,185 Articles
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Curated synthetic benchmark (624 FAKE, 561 REAL) with ~4% label noise.
          </p>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            <Layers size={16} />
            HELD-OUT TEST SPLIT
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
            237 Test Articles
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            20% stratified holdout strictly unseen during feature extraction and training.
          </p>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            <BarChart3 size={16} />
            BEST ENSEMBLE F1
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-real)" }}>
            {(metricsData.models.ensemble?.f1 * 100).toFixed(1)}%
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            ROC-AUC: {(metricsData.models.ensemble?.roc_auc * 100).toFixed(1)}% | CV F1: {(metricsData.models.ensemble?.cv_f1_mean! * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Model Comparison Table */}
      <div className="card" style={{ marginBottom: "2.5rem" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Comparative Performance Across All 5 Classifiers
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
          Target class for Precision, Recall, and F1 is <strong>FAKE</strong> news. Metrics are served live from <code>GET /api/metrics</code>.
        </p>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1-Score</th>
                <th>ROC-AUC</th>
                <th>5-Fold CV F1 (mean ± std)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metricsData.models).map(([key, m]) => {
                const isBest = key === "ensemble";
                return (
                  <tr key={key} style={isBest ? { backgroundColor: "rgba(59, 130, 246, 0.08)" } : {}}>
                    <td style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {modelLabels[key] || key}
                      {isBest && (
                        <span className="badge" style={{ backgroundColor: "rgba(59, 130, 246, 0.2)", color: "#60a5fa" }}>
                          Selected
                        </span>
                      )}
                    </td>
                    <td>{(m.accuracy * 100).toFixed(2)}%</td>
                    <td>{(m.precision * 100).toFixed(2)}%</td>
                    <td>{(m.recall * 100).toFixed(2)}%</td>
                    <td style={{ fontWeight: 700, color: isBest ? "var(--color-real)" : "inherit" }}>
                      {(m.f1 * 100).toFixed(2)}%
                    </td>
                    <td>{(m.roc_auc * 100).toFixed(2)}%</td>
                    <td>
                      {m.cv_f1_mean !== null && m.cv_f1_std !== null
                        ? `${(m.cv_f1_mean! * 100).toFixed(1)}% ± ${(m.cv_f1_std! * 100).toFixed(2)}%`
                        : "N/A"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confusion Matrix Section */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Confusion Matrix
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Detailed true vs predicted breakdown for the 237 test articles.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Select Model:</span>
            <select
              className="form-select"
              value={selectedCmModel}
              onChange={(e) => handleCmModelChange(e.target.value)}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem", width: "auto" }}
            >
              <option value="ensemble">Soft-Voting Ensemble</option>
              <option value="logistic_regression">Logistic Regression</option>
              <option value="naive_bayes">Multinomial Naive Bayes</option>
              <option value="linear_svm">Linear SVM</option>
              <option value="random_forest">Random Forest</option>
            </select>
          </div>
        </div>

        {cmLoading || !cmData ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>Updating matrix...</p>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem 0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "480px", width: "100%" }}>
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr", gap: "0.5rem", textAlign: "center", fontSize: "0.85rem", fontWeight: 600 }}>
                <div></div>
                <div style={{ color: "var(--text-secondary)" }}>Predicted REAL</div>
                <div style={{ color: "var(--text-secondary)" }}>Predicted FAKE</div>
              </div>

              {/* Row 1: Actual REAL */}
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr", gap: "0.5rem", alignItems: "center" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textAlign: "right", paddingRight: "0.5rem" }}>
                  Actual REAL
                </div>
                <div
                  style={{
                    padding: "1.25rem",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-real)" }}>
                    {cmData.matrix[0][0]}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-real)" }}>True Negative (TN)</div>
                </div>
                <div
                  style={{
                    padding: "1.25rem",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-fake)" }}>
                    {cmData.matrix[0][1]}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-fake)" }}>False Positive (FP)</div>
                </div>
              </div>

              {/* Row 2: Actual FAKE */}
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr", gap: "0.5rem", alignItems: "center" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textAlign: "right", paddingRight: "0.5rem" }}>
                  Actual FAKE
                </div>
                <div
                  style={{
                    padding: "1.25rem",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-fake)" }}>
                    {cmData.matrix[1][0]}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-fake)" }}>False Negative (FN)</div>
                </div>
                <div
                  style={{
                    padding: "1.25rem",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-real)" }}>
                    {cmData.matrix[1][1]}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-real)" }}>True Positive (TP)</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
