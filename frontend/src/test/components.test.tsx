import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PredictionCard from "../components/PredictionCard";
import WordAttributionView from "../components/WordAttributionView";
import { PredictionResponse, DetailedExplanationResponse } from "../lib/types";

describe("Frontend Component Tests", () => {

  it("renders PredictionCard with FAKE prediction and attribution tags", () => {
    const fakePred: PredictionResponse = {
      predicted_label: "FAKE",
      model_name: "ensemble",
      model_score: 0.78,
      class_probabilities: { REAL: 0.22, FAKE: 0.78 },
      explanation: "Sensational patterns detected in article text.",
      top_terms: [
        { term: "shocking", weight: 0.12, direction: "FAKE" },
        { term: "deleted", weight: 0.08, direction: "FAKE" },
      ],
      disclaimer: "Human editorial review required.",
      model_version: "1.0.0",
      word_count: 55,
    };

    render(<PredictionCard prediction={fakePred} />);
    expect(screen.getByText(/Likely FAKE News/i)).toBeInTheDocument();
    expect(screen.getAllByText(/78%/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/"shocking"/i)).toBeInTheDocument();
    expect(screen.getByText(/"deleted"/i)).toBeInTheDocument();
  });

  it("renders WordAttributionView with signed directional terms", () => {
    const explanation: DetailedExplanationResponse = {
      predicted_label: "REAL",
      model_name: "ensemble",
      model_score: 0.92,
      explanation_method: "TF-IDF Linear Feature Attribution (w_i * x_i)",
      attribution_notes: "Component Logistic Regression weights from soft-voting ensemble.",
      top_fake_terms: [
        { term: "secret", weight: 0.05, direction: "FAKE" }
      ],
      top_real_terms: [
        { term: "committee", weight: -0.15, direction: "REAL" },
        { term: "review", weight: -0.22, direction: "REAL" }
      ],
      disclaimer: "Influential words highlight stylistic cues.",
    };

    render(<WordAttributionView explanation={explanation} isLoading={false} />);
    expect(screen.getByText(/Linguistic Feature Attribution Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/"committee"/i)).toBeInTheDocument();
    expect(screen.getByText(/"review"/i)).toBeInTheDocument();
    expect(screen.getByText(/"secret"/i)).toBeInTheDocument();
  });
});
