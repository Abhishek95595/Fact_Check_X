import { PredictionResponse } from "@/lib/types";
import { CheckCircle2, AlertOctagon, HelpCircle, Info } from "lucide-react";

interface PredictionCardProps {
  prediction: PredictionResponse;
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  const isFake = prediction.predicted_label === "FAKE";
  const percentage = Math.round(prediction.model_score * 100);

  return (
    <div
      className="card"
      style={{
        borderLeft: `5px solid ${isFake ? "var(--color-fake)" : "var(--color-real)"}`,
        backgroundColor: "var(--bg-card)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
            Classification Outcome
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.35rem" }}>
            {isFake ? (
              <span className="badge badge-fake" style={{ fontSize: "1.1rem", padding: "0.4rem 0.9rem" }}>
                <AlertOctagon size={18} />
                Likely FAKE News
              </span>
            ) : (
              <span className="badge badge-real" style={{ fontSize: "1.1rem", padding: "0.4rem 0.9rem" }}>
                <CheckCircle2 size={18} />
                Likely REAL News
              </span>
            )}
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              via <strong>{prediction.model_name.replace(/_/g, " ").toUpperCase()}</strong> (v{prediction.model_version})
            </span>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
            Model Confidence Score
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: isFake ? "var(--color-fake)" : "var(--color-real)" }}>
            {percentage}%
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            (Estimated class probability: {prediction.model_score.toFixed(4)})
          </span>
        </div>
      </div>

      {/* Confidence Bar */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
          <span>REAL pattern score: {Math.round(prediction.class_probabilities.REAL * 100)}%</span>
          <span>FAKE pattern score: {Math.round(prediction.class_probabilities.FAKE * 100)}%</span>
        </div>
        <div className="meter-track" style={{ height: "10px" }}>
          <div
            className="meter-fill"
            style={{
              width: `${Math.round(prediction.class_probabilities.FAKE * 100)}%`,
              backgroundColor: isFake ? "var(--color-fake)" : "var(--color-real)",
            }}
          />
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.3rem" }}>
          <Info size={13} />
          <span>Note: Score reflects statistical resemblance to training text, not factual ground-truth probability.</span>
        </div>
      </div>

      {/* Human-Readable Explanation */}
      <div style={{ backgroundColor: "rgba(255,255,255,0.03)", padding: "1rem 1.25rem", borderRadius: "var(--radius-md)", marginBottom: "1.25rem", border: "1px solid var(--border-subtle)" }}>
        <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
          Model Explanation Summary
        </h4>
        <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
          {prediction.explanation}
        </p>
      </div>

      {/* Top Attributed Words in this Prediction */}
      {prediction.top_terms && prediction.top_terms.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.6rem" }}>
            Influential Words Driving Prediction Towards {prediction.predicted_label}:
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {prediction.top_terms.map((t, idx) => (
              <span
                key={idx}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.85rem",
                  padding: "0.3rem 0.65rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: isFake ? "var(--color-fake-bg)" : "var(--color-real-bg)",
                  color: isFake ? "var(--color-fake)" : "var(--color-real)",
                  border: `1px solid ${isFake ? "var(--color-fake-border)" : "var(--color-real-border)"}`,
                  fontWeight: 600,
                }}
              >
                "{t.term}"
                <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>({t.weight > 0 ? `+${t.weight.toFixed(3)}` : t.weight.toFixed(3)})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
        <strong>Human Review Required:</strong> {prediction.disclaimer}
      </div>
    </div>
  );
}
