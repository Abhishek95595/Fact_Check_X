# Fake News Detection Web Application Using Natural Language Processing (NLP)

**Academic Industry Project:** HCLTech Career Shaper Programme | Project No. 31  
**Domain:** Digital-Data-AI / AIML  
**Author:** Baibhav Pandey  
**Mentor:** Mr. Shivansh Mehta  
**Model Version:** 1.0.0  

---

## 1. Project Overview & Objective

This project provides an assistive, interpretable decision-support platform for evaluating news articles. Using classical Natural Language Processing (unigram and bigram TF-IDF) and a soft-voting ensemble of five scikit-learn classifiers, the system analyzes text patterns and outputs:

1. **Predicted Class:** `REAL` vs `FAKE` news.
2. **Model Confidence Score:** Estimated class probability ($0.0 \le score \le 1.0$), clearly framed as a statistical pattern score rather than verified factual truth.
3. **Signed Feature Attribution:** Key vocabulary items pushing toward `FAKE` (sensational or conspiratorial rhetoric) versus `REAL` (formal reporting vocabulary). For the soft-voting ensemble, this is explicitly identified as a **Logistic Regression-based proxy explanation**.
4. **Human-Readable Summary:** Natural language synthesis of the classification rationale.
5. **Persistent Safety Disclaimer:** Clear notices across all views stating that automated NLP is not a substitute for independent fact-checking and must assist human reviewers rather than censor content.

---

## 2. Repository Structure

```
Fact_Check_X/
├── backend/
│   ├── app/
│   │   ├── api/                  # REST routes: predict, explain, metrics, fairness, samples
│   │   ├── core/                 # App configuration (CORS, word bounds) and structured logging
│   │   ├── schemas/              # Pydantic v2 request/response models
│   │   ├── services/             # Preprocessor, model inference service, explainer engine
│   │   └── main.py               # FastAPI entrypoint with lifespan loader & CORS
│   ├── artifacts/                # Serialized model bundles, TF-IDF vectorizer, and JSON evaluation data
│   ├── scripts/
│   │   └── train.py              # Reproducible training, validation, and evaluation pipeline
│   ├── tests/
│   │   └── test_api.py           # 12 automated unit, integration, and latency benchmark tests
│   ├── requirements.txt          # Pinned Python package versions
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        # App layout with responsive navigation and footer
│   │   │   ├── page.tsx          # Main analysis page (/)
│   │   │   ├── dashboard/        # Live metrics and interactive confusion matrix (/dashboard)
│   │   │   ├── fairness/         # Subgroup FPR/FNR analysis by ideology & topic (/fairness)
│   │   │   └── about/            # Model card, ethical boundaries, and limitations (/about)
│   │   ├── components/           # Reusable UI components (Navbar, PredictionCard, WordAttributionView)
│   │   ├── lib/                  # Typed fetch client (`api.ts`) and TypeScript schemas (`types.ts`)
│   │   └── test/                 # Vitest frontend component tests
│   ├── package.json              # Next.js 14, React 18, Vitest, Lucide React
│   ├── tsconfig.json
│   └── README.md
├── data/                         # Verified project datasets
│   ├── dataset.csv               # 1,185 news articles (SHA-256 verified)
│   ├── data_dictionary.csv       # Column schema specifications
│   ├── model_results.csv         # Historical benchmark table
│   └── predictions.csv           # Historical held-out test predictions
├── docs/                         # Project reports and documentation
│   ├── MODEL_CARD.md             # Formal model card and ethics declaration
│   └── Fake_News_Detection_Project_Report updated.docx
├── .gitignore                    # Git rules for venv, node_modules, joblib binaries, and .env files
└── README.md                     # Root project documentation (this file)
```

---

## 3. Technology Stack

- **Backend:** Python 3.13 / FastAPI 0.162, Uvicorn, Pydantic v2, scikit-learn 1.6+, pandas 2.2+, numpy 2.5+, joblib, pytest.
- **Frontend:** Next.js 14.2 (App Router), React 18.3, TypeScript 5.6, Vanilla CSS design tokens, Lucide React, Vitest 2.1.
- **Machine Learning:** Unigram + Bigram TF-IDF vectorizer (`ngram_range=(1,2)`, `min_df=2`, `max_features=20000`, `sublinear_tf=True`), calibrated SVM, soft-voting ensemble.

---

## 4. Dataset Provenance & Safeguards

- **Total Records:** 1,185 articles (624 FAKE, 561 REAL), 0 missing values, 0 duplicate IDs.
- **Held-Out Test Split:** Stratified 80/20 split (`random_state=42`) with 948 training articles and 237 test articles.
- **Synthetic Data Disclosure:** The corpus is a curated synthetic benchmark generated with templated phrasing and ~4% simulated label noise. Benchmark accuracy (~88%) overstates expected real-world performance against evolving misinformation.
- **Shortcut Prevention Policy:** `source` (publisher outlet) and `political_lean` (ideology) were strictly excluded from model feature extraction. The model learns exclusively from `headline` and `body_text`.

---

## 5. Evaluation Benchmarks (Held-Out Split of 237 Articles)

| Classifier | Accuracy | Precision (FAKE) | Recall (FAKE) | F1-Score | ROC-AUC | 5-Fold Stratified CV F1 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 85.65% | 86.40% | 86.40% | 86.40% | 0.9069 | 89.40% ± 0.0173 |
| **Multinomial Naive Bayes** | 87.34% | 88.62% | 87.20% | 87.90% | 0.9111 | 88.91% ± 0.0162 |
| **Linear SVM (Calibrated)** | 83.12% | 83.46% | 84.80% | 84.13% | 0.9031 | 88.55% ± 0.0135 |
| **Random Forest** | 83.54% | 85.25% | 83.20% | 84.21% | 0.8976 | 86.91% ± 0.0044 |
| **Soft-Voting Ensemble** | **88.19%** | **88.19%** | **89.60%** | **88.89%** | **0.9099** | **89.09% ± 0.0215** |

- **Historical Agreement:** Freshly trained ensemble predictions agree with `data/predictions.csv` on 232 of 237 test samples (97.9% concordance).
- **Latency Benchmark:** Measured inference latency averages **3.12 ms** (P95: 4.04 ms).

---

## 6. Installation & Running Instructions

### Terminal 1: Backend Server (FastAPI)
```bash
cd /Users/abhishekverma/Desktop/Fact_Check_X/backend

# Activate virtual environment
source .venv/bin/activate

# (Optional) Re-train models and persist artifacts
python scripts/train.py

# Run backend unit tests
pytest tests/test_api.py -v

# Launch API server on port 8000
uvicorn app.main:app --reload --port 8000
```
Interactive API documentation: `http://localhost:8000/docs`.

### Terminal 2: Frontend Web Application (Next.js)
```bash
cd /Users/abhishekverma/Desktop/Fact_Check_X/frontend

# Install dependencies (if not already done)
npm install

# Run frontend unit tests
npm test

# Build production bundle
npm run build

# Start local server on port 3000
npm run dev
```
Web application: `http://localhost:3000`.

---

## 7. API Reference

- `GET /api/health` — Service readiness and loaded model status.
- `POST /api/predict` — Submit headline and body text (15 to 2,500 words) for binary prediction (`REAL`/`FAKE`), confidence score, explanation, and top terms.
- `POST /api/explain` — Signed feature attribution terms ($w_i \cdot x_i$) split into `top_fake_terms` and `top_real_terms`.
- `GET /api/metrics` — All evaluation metrics, 5-fold CV statistics, and class support.
- `GET /api/confusion-matrix?model=ensemble` — $2 \times 2$ matrix (`[[TN, FP], [FN, TP]]`).
- `GET /api/fairness` — Diagnostic false-positive and false-negative rates by political lean and topic.
- `GET /api/samples?page=1&page_size=10&topic=health` — Paginated held-out test articles for one-click testing.

---

## 8. Troubleshooting & Common Questions

- **Port Conflicts:** Ensure port 8000 (FastAPI) and port 3000 (Next.js) are free. If port 8000 is occupied, run `lsof -ti:8000 | xargs kill -9`.
- **CORS Errors:** In development, the backend permits `http://localhost:3000` and `http://127.0.0.1:3000`. Update `backend/app/core/config.py` if serving from a custom domain.
- **Python Version:** Python 3.13 is supported using `numpy>=2.1.0` binary wheels on macOS ARM64.
- **Sample Count:** `GET /api/samples` supports pagination (`page` and `page_size`, defaulting to 10). Passing `page_size=2` in smoke tests returned 2 samples intentionally to test pagination parameters without loading all 237 samples at once.
