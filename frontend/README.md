# Fake News Detection Web Application — Next.js Frontend

A modern Next.js 14 App Router frontend with React and TypeScript for interactive news text analysis, model evaluation, and subgroup fairness exploration.

## Prerequisites & Architecture
- Communicates with the FastAPI backend at `http://localhost:8000`.
- Typed API client in `src/lib/api.ts` matching backend Pydantic schemas.
- Styled using custom accessible Vanilla CSS tokens (`src/app/globals.css`).

## Setup & Running

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Ensure `frontend/.env.local` contains:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

### 5. Launch Development Server
```bash
npm run dev
```
The application will be accessible at: `http://localhost:3000`.

## Application Routes

- `/` — Interactive News Analysis Page (Input headline/body, test sample articles, run predictions with soft-voting ensemble, view word-level attributions and safety disclaimers).
- `/dashboard` — Model Evaluation Dashboard (Comparative metric cards, accuracy/precision/recall/F1/ROC-AUC table, 5-fold CV statistics, live confusion matrix).
- `/fairness` — Subgroup Fairness Dashboard (Error rates, FPR/FNR segmented across political leaning and topic domains).
- `/about` — Model Card & Ethical Declaration (NLP methodology, dataset provenance, shortcut prevention policy, permitted vs prohibited use).
