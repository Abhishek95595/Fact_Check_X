import { ShieldCheck, BookOpen, AlertOctagon, Cpu, CheckCircle } from "lucide-react";

export default function AboutPage() {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
          Model Card, Ethics & Provenance
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "800px" }}>
          Technical specifications, limitations, and ethical boundaries for the Fake News Detection decision-support platform (HCLTech Career Shaper Project No. 31).
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Section 1: Overview */}
        <section className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Cpu size={22} style={{ color: "var(--accent-primary)" }} />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>System Architecture & Methodology</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1rem" }}>
            The pipeline is built using classical Natural Language Processing (NLP) designed for rapid, low-latency, and interpretable text classification:
          </p>
          <ul style={{ paddingLeft: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <li><strong>Text Preprocessing:</strong> Lowercasing, removal of URLs, stripping of digits and punctuation, and whitespace normalization.</li>
            <li><strong>Feature Representation:</strong> Term Frequency-Inverse Document Frequency (TF-IDF) using unigrams and bigrams (<code>ngram_range=(1,2)</code>, <code>min_df=2</code>, <code>max_features=20000</code>, <code>sublinear_tf=True</code>, English stop words removed).</li>
            <li><strong>Classifiers:</strong> Logistic Regression (linear baseline), Multinomial Naive Bayes (word count probabilistic model), Linear SVM (maximum margin), Random Forest (non-linear tree ensemble), and a Soft-Voting Ensemble averaging predicted class probabilities.</li>
          </ul>
        </section>

        {/* Section 2: Data Provenance & Synthetic Disclaimer */}
        <section className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <BookOpen size={22} style={{ color: "var(--color-warning)" }} />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Dataset Provenance & Benchmark Notes</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
            The dataset comprises <strong>1,185 English news articles</strong> (624 FAKE, 561 REAL) covering health, economy, politics, technology, sports, and environment.
          </p>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <strong>Important Provenance Disclosure:</strong> The corpus is synthetically generated with templated phrasing and approximately 4% simulated annotation noise. Consequently, the reported benchmark performance (~88% accuracy and F1) demonstrates the end-to-end pipeline and feature learning capabilities, rather than proven real-world resilience against evolving adversarial misinformation.
          </p>
        </section>

        {/* Section 3: Responsible Use & Prohibited Scenarios */}
        <section className="card" style={{ borderLeft: "4px solid var(--color-fake)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <AlertOctagon size={22} style={{ color: "var(--color-fake)" }} />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Ethical Boundaries & Intended Use</h2>
          </div>
          <div className="grid-2">
            <div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-real)", marginBottom: "0.5rem" }}>
                Permitted & Intended Uses
              </h4>
              <ul style={{ paddingLeft: "1.25rem", color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                <li>Decision-support triage for human fact-checkers and editors.</li>
                <li>Identifying articles with high densities of sensational or clickbait rhetorical markers.</li>
                <li>Educational and research demonstrations of NLP explainability.</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-fake)", marginBottom: "0.5rem" }}>
                Strictly Prohibited Uses
              </h4>
              <ul style={{ paddingLeft: "1.25rem", color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                <li>Autonomous censorship or content deletion without human review.</li>
                <li>Targeting or profiling specific journalists, individuals, or political groups.</li>
                <li>Claiming that an automated NLP score constitutes verified legal or factual proof.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Shortcut Prevention & Fairness */}
        <section className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <ShieldCheck size={22} style={{ color: "var(--color-real)" }} />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Shortcut Prevention Policy</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Publishing outlet (<code>source</code>) and ideological leaning (<code>political_lean</code>) are strictly excluded from model feature extraction. The models learn exclusively from the article headline and body text. While this prevents the model from directly associating specific publishers or ideologies with falsehood, reviewers must remain alert to indirect linguistic correlations.
          </p>
        </section>
      </div>
    </div>
  );
}
