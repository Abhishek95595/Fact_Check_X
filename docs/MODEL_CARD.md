# Model Card: Fake News Detection NLP Classifier
**Version:** 1.0.0  
**Date:** October 2026  
**Project:** HCLTech Career Shaper IV Year Industry Project (Project No. 31)  
**Learner:** Baibhav Pandey  
**Mentor:** Mr. Shivansh Mehta  

---

## 1. Model Details
- **Architecture:** Soft-voting ensemble combining Logistic Regression, Multinomial Naive Bayes, and Random Forest.
- **Feature Extraction:** TF-IDF unigrams and bigrams (`ngram_range=(1, 2)`, `min_df=2`, `max_features=20000`, `sublinear_tf=True`, English stop words removed).
- **Output:** Binary classification (`REAL` vs `FAKE`) with continuous model confidence scores ($0.0 \le score \le 1.0$).
- **Explainability:** Signed linear feature attributions ($w_i \cdot x_i$) highlighting sensational/informal versus institutional/reporting vocabulary.

---

## 2. Intended Use & Ethical Constraints
- **Intended Use:** Assistive decision-support system for editors, researchers, and human fact-checkers to triage and flag articles exhibiting suspicious linguistic patterns.
- **Out-of-Scope Use:**
  - Automated censorship or content deletion without human review.
  - Definitive factual verification (the system measures linguistic tone and style, not physical facts or ground truth).
  - Profiling individuals, publications, or political organizations.

---

## 3. Training & Evaluation Data
- **Dataset:** 1,185 English news articles (curated synthetic benchmark data generated with templated phrasing and approximately 4% simulated annotation noise).
- **Split:** Stratified 80/20 train/test split (`random_state=42`) yielding 948 training articles and 237 held-out test articles.
- **Data Integrity:** SHA-256 verified against `data/dataset.csv`. Zero missing values, zero duplicate IDs.
- **Feature Exclusion:** Publishing outlet (`source`) and political ideology (`political_lean`) were strictly excluded from model features to prevent shortcut learning.

---

## 4. Evaluation Metrics
Evaluated on the 237 held-out test articles:

| Model | Accuracy | Precision (FAKE) | Recall (FAKE) | F1-Score | ROC-AUC | 5-Fold CV F1 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 0.8565 | 0.8640 | 0.8640 | 0.8640 | 0.9069 | 0.8940 ± 0.0173 |
| **Multinomial Naive Bayes** | 0.8734 | 0.8862 | 0.8720 | 0.8790 | 0.9111 | 0.8891 ± 0.0162 |
| **Linear SVM (Calibrated)** | 0.8312 | 0.8346 | 0.8480 | 0.8413 | 0.9031 | 0.8855 ± 0.0135 |
| **Random Forest** | 0.8354 | 0.8525 | 0.8320 | 0.8421 | 0.8976 | 0.8691 ± 0.0044 |
| **Ensemble (LR + NB + RF)** | **0.8819** | **0.8819** | **0.8960** | **0.8889** | **0.9099** | **0.8909 ± 0.0215** |

---

## 5. Subgroup Fairness & Bias Analysis
In the synthetic dataset, FAKE articles correlate more heavily with right-leaning synthetic templates (49.2% of FAKE articles). To ensure transparency:
- Political lean is excluded from features.
- Held-out false positive and false negative rates are measured and exposed via the `/api/fairness` endpoint.
- Subgroup performance differences are diagnostic signals for reviewers to monitor threshold sensitivity, not proofs of demographic bias.

---

## 6. Caveats & Known Limitations
1. **Synthetic Corpus:** Because the dataset uses templated synthetic text, benchmark accuracy (~88%) overstates expected real-world performance on adversarial misinformation.
2. **Style vs. Truth:** The classifier identifies stylistic patterns (e.g. clickbait, exclamation marks, emotional rhetoric). Factual articles written in sensational language or well-crafted fabrications written in formal language may be misclassified.
3. **Language Limitation:** Valid only for English news articles.
