import { DetailedExplanationResponse, InfluentialTerm } from "@/lib/types";
import { Info, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface WordAttributionViewProps {
  explanation: DetailedExplanationResponse | null;
  isLoading: boolean;
}

export default function WordAttributionView({ explanation, isLoading }: WordAttributionViewProps) {
  if (isLoading) {
    return (
      <div className="card" style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        <p>Calculating detailed TF-IDF feature attributions...</p>
      </div>
    );
  }

  if (!explanation) {
    return null;
  }

  return (
    <div className="card" style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Linguistic Feature Attribution Analysis
            </h3>
            {explanation.model_name === "ensemble" && (
              <span className="badge" style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                Logistic Regression-Based Proxy
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Method: <code>{explanation.explanation_method}</code>
          </p>
        </div>
      </div>

      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem", padding: "0.75rem 1rem", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
        <Info size={14} style={{ display: "inline", marginRight: "6px" }} />
        {explanation.attribution_notes}
      </div>

      <div className="grid-2">
        {/* Terms pushing toward FAKE */}
        <div style={{ padding: "1rem", backgroundColor: "var(--bg-input)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span className="badge badge-fake" style={{ padding: "0.2rem 0.5rem" }}>
              Pushing Toward FAKE
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>(Sensational / Informal)</span>
          </div>

          {explanation.top_fake_terms.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              No terms strongly pushed this article towards FAKE.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {explanation.top_fake_terms.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.35rem 0.6rem",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--color-fake-bg)",
                    border: "1px solid var(--color-fake-border)",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--color-fake)" }}>
                    "{item.term}"
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-fake)", display: "flex", alignItems: "center", gap: "2px" }}>
                    <ArrowUpRight size={13} />
                    +{item.weight.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Terms pushing toward REAL */}
        <div style={{ padding: "1rem", backgroundColor: "var(--bg-input)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span className="badge badge-real" style={{ padding: "0.2rem 0.5rem" }}>
              Pushing Toward REAL
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>(Institutional / Reporting)</span>
          </div>

          {explanation.top_real_terms.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              No terms strongly pushed this article towards REAL.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {explanation.top_real_terms.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.35rem 0.6rem",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--color-real-bg)",
                    border: "1px solid var(--color-real-border)",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--color-real)" }}>
                    "{item.term}"
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-real)", display: "flex", alignItems: "center", gap: "2px" }}>
                    <ArrowDownRight size={13} />
                    {item.weight.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.775rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
        {explanation.disclaimer}
      </div>
    </div>
  );
}
