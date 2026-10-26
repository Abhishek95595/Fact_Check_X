"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  PredictionResponse,
  DetailedExplanationResponse,
  SupportedModel,
  SampleArticle,
} from "@/lib/types";
import SampleArticleSelector from "@/components/SampleArticleSelector";
import PredictionCard from "@/components/PredictionCard";
import WordAttributionView from "@/components/WordAttributionView";
import { Search, RotateCcw, AlertCircle, Sparkles } from "lucide-react";

export default function AnalysisPage() {
  const [headline, setHeadline] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [selectedModel, setSelectedModel] = useState<SupportedModel>("ensemble");
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [explanation, setExplanation] = useState<DetailedExplanationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Word count calculation
  const combinedText = `${headline} ${bodyText}`.trim();
  const wordCount = combinedText.length > 0 ? combinedText.split(/\s+/).length : 0;
  const isTooShort = wordCount > 0 && wordCount < 15;
  const isTooLong = wordCount > 2500;

  const handleSampleSelect = (sample: SampleArticle) => {
    setHeadline(sample.headline);
    setBodyText(sample.body_text);
    setPrediction(null);
    setExplanation(null);
    setErrorMessage(null);
  };

  const handleReset = () => {
    setHeadline("");
    setBodyText("");
    setPrediction(null);
    setExplanation(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !bodyText.trim()) {
      setErrorMessage("Please enter both a headline and article body text.");
      return;
    }
    if (wordCount < 15) {
      setErrorMessage(`Article is too short (${wordCount} words). A minimum of 15 words across headline and body is required.`);
      return;
    }
    if (wordCount > 2500) {
      setErrorMessage(`Article is too long (${wordCount} words). Maximum limit is 2,500 words.`);
      return;
    }

    setIsLoading(true);
    setIsExplaining(true);
    setErrorMessage(null);
    setPrediction(null);
    setExplanation(null);

    try {
      // 1. Fetch prediction
      const predRes = await api.predict({
        headline,
        body_text: bodyText,
        model: selectedModel,
      });
      setPrediction(predRes);
      setIsLoading(false);

      // 2. Fetch detailed explanation concurrently or immediately after
      try {
        const expRes = await api.explain(headline, bodyText, selectedModel);
        setExplanation(expRes);
      } catch (expErr: any) {
        console.warn("Detailed explanation fetch warning:", expErr);
      } finally {
        setIsExplaining(false);
      }
    } catch (err: any) {
      setIsLoading(false);
      setIsExplaining(false);
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while communicating with the backend.");
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
          Fake News Detection Analysis
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "800px" }}>
          Analyze news articles using classical Natural Language Processing (TF-IDF unigrams & bigrams) and an ensemble of five classifiers. The system identifies sensational vs institutional linguistic patterns to assist human editorial review.
        </p>
      </div>

      <div className="grid-2" style={{ alignItems: "flex-start", gap: "2rem" }}>
        {/* Left Column: Input Form & Sample Selector */}
        <div>
          <SampleArticleSelector onSelect={handleSampleSelect} disabled={isLoading} />

          <form onSubmit={handleSubmit} className="card" aria-label="News Analysis Form">
            <div className="form-group">
              <label htmlFor="headline-input" className="form-label">
                <span>Article Headline <span style={{ color: "var(--color-fake)" }}>*</span></span>
              </label>
              <input
                id="headline-input"
                type="text"
                className="form-input"
                placeholder="e.g. Officials announce review on economic indicators..."
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <div className="form-label">
                <label htmlFor="body-input">
                  Article Body Text <span style={{ color: "var(--color-fake)" }}>*</span>
                </label>
                <span
                  className="form-hint"
                  style={{
                    color: isTooShort || isTooLong ? "var(--color-fake)" : "var(--text-muted)",
                    fontWeight: isTooShort || isTooLong ? 600 : 400,
                  }}
                >
                  {wordCount} words {isTooShort && "(Min: 15 words)"} {isTooLong && "(Max: 2500 words)"}
                </span>
              </div>
              <textarea
                id="body-input"
                className="form-textarea"
                placeholder="Paste the full article text here for linguistic analysis..."
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={7}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="model-select" className="form-label">
                <span>Classification Model</span>
                <span className="form-hint">TF-IDF unigram + bigram pipeline</span>
              </label>
              <select
                id="model-select"
                className="form-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as SupportedModel)}
                disabled={isLoading}
              >
                <option value="ensemble">Soft-Voting Ensemble (LR + NB + RF) — Recommended (~88% F1)</option>
                <option value="logistic_regression">Logistic Regression (Linear baseline, highly interpretable)</option>
                <option value="naive_bayes">Multinomial Naive Bayes (Probabilistic text baseline)</option>
                <option value="linear_svm">Linear Support Vector Machine (Maximum margin)</option>
                <option value="random_forest">Random Forest Classifier (Non-linear tree ensemble)</option>
              </select>
            </div>

            {errorMessage && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "var(--radius-md)",
                  color: "#fca5a5",
                  fontSize: "0.875rem",
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                role="alert"
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={isLoading || isTooShort || isTooLong || !headline.trim() || !bodyText.trim()}
              >
                {isLoading ? (
                  <>
                    <span className="status-dot" style={{ animation: "pulse 1s infinite" }}></span>
                    Analyzing NLP Features...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Analyze Article
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
                disabled={isLoading || (!headline && !bodyText && !prediction)}
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Prediction Results & Feature Attribution */}
        <div>
          {isLoading ? (
            <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <div className="status-dot" style={{ width: "16px", height: "16px", margin: "0 auto 1rem", backgroundColor: "var(--accent-primary)" }}></div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                Extracting TF-IDF Features & Scoring
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Running text preprocessor, extracting unigrams/bigrams, and querying the {selectedModel.replace(/_/g, " ")} classifier...
              </p>
            </div>
          ) : prediction ? (
            <div>
              <PredictionCard prediction={prediction} />
              <WordAttributionView explanation={explanation} isLoading={isExplaining} />
            </div>
          ) : (
            <div
              className="card"
              style={{
                textAlign: "center",
                padding: "3.5rem 2rem",
                border: "2px dashed var(--border-medium)",
                backgroundColor: "transparent",
              }}
            >
              <Sparkles size={36} style={{ color: "var(--text-muted)", margin: "0 auto 1rem", opacity: 0.6 }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                No Analysis Performed Yet
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "400px", margin: "0 auto" }}>
                Select a verified held-out test sample from the dropdown or paste your own article text on the left to evaluate its linguistic patterns.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
