"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SampleArticle } from "@/lib/types";
import { FileText, ChevronDown } from "lucide-react";

interface SampleArticleSelectorProps {
  onSelect: (sample: SampleArticle) => void;
  disabled?: boolean;
}

export default function SampleArticleSelector({ onSelect, disabled }: SampleArticleSelectorProps) {
  const [samples, setSamples] = useState<SampleArticle[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    api.getSamples(1, 20, selectedTopic)
      .then((res) => {
        if (mounted) {
          setSamples(res.samples);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Failed to load samples:", err);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [selectedTopic]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    const found = samples.find((s) => s.article_id === id);
    if (found) {
      onSelect(found);
    }
  };

  return (
    <div style={{ marginBottom: "1.25rem", padding: "1rem", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <label htmlFor="sample-selector" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <FileText size={16} />
          Load Held-Out Test Sample Article:
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Topic Filter:</span>
          <select
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(e.target.value);
              setSelectedId("");
            }}
            disabled={disabled}
            style={{
              padding: "0.25rem 0.5rem",
              fontSize: "0.8rem",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <option value="all">All Topics</option>
            <option value="health">Health</option>
            <option value="economy">Economy</option>
            <option value="politics">Politics</option>
            <option value="technology">Technology</option>
            <option value="sports">Sports</option>
            <option value="environment">Environment</option>
          </select>
        </div>
      </div>

      <select
        id="sample-selector"
        className="form-select"
        value={selectedId}
        onChange={handleChange}
        disabled={disabled || isLoading}
        style={{ fontSize: "0.875rem" }}
      >
        <option value="">
          {isLoading ? "Loading verified samples from backend..." : "-- Select an article from the held-out test split --"}
        </option>
        {samples.map((s) => (
          <option key={s.article_id} value={s.article_id}>
            [{s.article_id}] ({s.topic.toUpperCase()}) {s.headline.slice(0, 80)}...
          </option>
        ))}
      </select>
      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
        Selecting a sample fills the form with authentic test data from <code>data/dataset.csv</code>. Click "Analyze Article" to execute fresh inference.
      </div>
    </div>
  );
}
