# Fake News Detection Backend API

FastAPI backend and machine learning pipeline for binary Fake News detection using TF-IDF features and a soft-voting ensemble.

## Setup Instructions

### 1. Virtual Environment Activation
```bash
cd backend
source .venv/bin/activate
```

### 2. Run Reproducible Model Training & Evaluation
```bash
python scripts/train.py
```
This trains the 5 classifiers on `data/dataset.csv`, computes metrics across 5-fold cross validation and held-out test splits, evaluates subgroup fairness, and saves serialized artifacts to `backend/artifacts/`.

### 3. Run Automated Tests
```bash
pytest tests/test_api.py -v
```

### 4. Start the FastAPI Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger API documentation will be available at: `http://localhost:8000/docs`.

## API Endpoints

- `GET /api/health` — Service readiness and model status.
- `POST /api/predict` — Analyze article headline and body text (`REAL` vs `FAKE`).
- `POST /api/explain` — Return signed token-level feature attributions ($w_i \cdot x_i$).
- `GET /api/metrics` — Return accuracy, precision, recall, F1, ROC-AUC, and 5-fold CV metrics.
- `GET /api/confusion-matrix?model=ensemble` — Return 2x2 confusion matrix.
- `GET /api/fairness` — Return false positive/negative rates across `political_lean` and `topic`.
- `GET /api/samples` — Retrieve held-out test articles for one-click UI testing.
