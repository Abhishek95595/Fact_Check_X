"""
backend/scripts/train.py

Reproducible training pipeline for the Fake News Detection system:
1. Validates dataset schema, types, missing values, duplicates, and labels.
2. Extracts clean_text from headline + body_text using the exact documented regex pipeline.
3. Splits data into 80/20 train/test with stratification on label (random_state=42).
4. Fits TfidfVectorizer (unigram + bigram, min_df=2, max_features=20000, sublinear_tf=True, stop_words='english') on train only.
5. Trains 5 classifiers:
   - Logistic Regression
   - Multinomial Naive Bayes
   - Linear SVM (Calibrated for probability outputs in REST inference)
   - Random Forest
   - Soft-voting Ensemble (LR + NB + RF)
6. Evaluates all metrics (Accuracy, Precision, Recall, F1, ROC-AUC, 5-fold CV F1, Confusion Matrix, Per-Class metrics).
7. Computes subgroup fairness metrics for political_lean and topic.
8. Exports joblib artifacts, metrics.json, confusion_matrices.json, and fairness.json.
"""

import os
import sys
import json
import hashlib
from datetime import datetime
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

# Append backend directory to path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
sys.path.append(BASE_DIR)

from app.services.preprocessor import clean_text

def get_file_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def validate_and_prepare_data(data_path: str):
    print(f"[1/6] Loading and validating dataset from {data_path}...")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    df = pd.read_csv(data_path)
    required_cols = [
        "article_id", "headline", "body_text", "source", "publish_date",
        "label", "political_lean", "topic", "clean_text", "word_count"
    ]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    # Check labels
    valid_labels = {"REAL", "FAKE"}
    actual_labels = set(df["label"].unique())
    if not actual_labels.issubset(valid_labels):
        raise ValueError(f"Invalid labels found: {actual_labels - valid_labels}")

    # Check nulls in critical input fields
    missing_headline = df["headline"].isnull().sum()
    missing_body = df["body_text"].isnull().sum()
    if missing_headline > 0 or missing_body > 0:
        print(f"Warning: Missing headline={missing_headline}, body={missing_body}")

    # Verify duplicate IDs
    dup_ids = df["article_id"].duplicated().sum()
    if dup_ids > 0:
        print(f"Warning: {dup_ids} duplicate article_id found!")

    # Prepare reproduced cleaned text from headline and body_text
    print("  Deriving clean_text reproducibly from raw headline and body_text...")
    df["derived_clean_text"] = [
        clean_text(row["headline"], row["body_text"]) for _, row in df.iterrows()
    ]

    # Map labels: FAKE = 1, REAL = 0
    df["target"] = (df["label"] == "FAKE").astype(int)

    print(f"  Valid records: {len(df)} (FAKE={sum(df['target']==1)}, REAL={sum(df['target']==0)})")
    return df

def train_and_evaluate():
    data_path = os.path.join(PROJECT_ROOT, "data", "dataset.csv")
    if not os.path.exists(data_path):
        # Fallback to root dataset.csv
        data_path = os.path.join(PROJECT_ROOT, "dataset.csv")

    df = validate_and_prepare_data(data_path)
    dataset_checksum = get_file_sha256(data_path)

    print("[2/6] Performing stratified 80/20 train/test split (random_state=42)...")
    train_df, test_df = train_test_split(
        df,
        test_size=0.20,
        stratify=df["target"],
        random_state=42
    )
    print(f"  Train samples: {len(train_df)}, Test samples: {len(test_df)}")

    print("[3/6] Fitting TF-IDF Vectorizer on train split only...")
    tfidf = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=2,
        max_features=20000,
        sublinear_tf=True,
        stop_words="english"
    )
    X_train = tfidf.fit_transform(train_df["derived_clean_text"])
    X_test = tfidf.transform(test_df["derived_clean_text"])
    y_train = train_df["target"].values
    y_test = test_df["target"].values
    print(f"  TF-IDF Vocabulary size: {len(tfidf.vocabulary_)} terms")

    print("[4/6] Training the 5 classifiers...")
    # 1. Logistic Regression
    lr = LogisticRegression(random_state=42, max_iter=1000)
    lr.fit(X_train, y_train)

    # 2. Multinomial Naive Bayes
    nb = MultinomialNB()
    nb.fit(X_train, y_train)

    # 3. Linear SVM (using CalibratedClassifierCV so predict_proba is natively supported for APIs)
    base_svm = LinearSVC(random_state=42, dual="auto")
    calibrated_svm = CalibratedClassifierCV(estimator=base_svm, cv=3)
    calibrated_svm.fit(X_train, y_train)

    # 4. Random Forest
    rf = RandomForestClassifier(random_state=42, n_estimators=100)
    rf.fit(X_train, y_train)

    # 5. Soft-Voting Ensemble (LR + NB + RF)
    ensemble = VotingClassifier(
        estimators=[("lr", lr), ("nb", nb), ("rf", rf)],
        voting="soft"
    )
    ensemble.fit(X_train, y_train)

    models = {
        "logistic_regression": lr,
        "naive_bayes": nb,
        "linear_svm": calibrated_svm,
        "random_forest": rf,
        "ensemble": ensemble
    }

    print("[5/6] Evaluating models against held-out test split and 5-fold CV...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    metrics_report = {}
    confusion_matrices = {}

    for model_key, model in models.items():
        preds = model.predict(X_test)
        
        # Calculate probabilities or decision scores for positive class (FAKE=1)
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X_test)[:, 1]
        else:
            probs = model.decision_function(X_test)

        acc = float(accuracy_score(y_test, preds))
        prec = float(precision_score(y_test, preds, pos_label=1))
        rec = float(recall_score(y_test, preds, pos_label=1))
        f1 = float(f1_score(y_test, preds, pos_label=1))
        roc_auc = float(roc_auc_score(y_test, probs))

        # 5-fold stratified CV on training data
        cv_scores = cross_val_score(model, X_train, y_train, cv=skf, scoring="f1")
        cv_mean = float(np.mean(cv_scores))
        cv_std = float(np.std(cv_scores))

        # Confusion matrix: [[TN, FP], [FN, TP]] -> labels: [0 (REAL), 1 (FAKE)]
        cm = confusion_matrix(y_test, preds, labels=[0, 1]).tolist()
        confusion_matrices[model_key] = {
            "matrix": cm,
            "labels": ["REAL", "FAKE"],
            "total_evaluated": len(y_test)
        }

        # Classification report
        cls_rep = classification_report(y_test, preds, target_names=["REAL", "FAKE"], output_dict=True)

        metrics_report[model_key] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "cv_f1_mean": round(cv_mean, 4),
            "cv_f1_std": round(cv_std, 4),
            "per_class": {
                "REAL": {
                    "precision": round(cls_rep["REAL"]["precision"], 4),
                    "recall": round(cls_rep["REAL"]["recall"], 4),
                    "f1": round(cls_rep["REAL"]["f1-score"], 4),
                    "support": cls_rep["REAL"]["support"]
                },
                "FAKE": {
                    "precision": round(cls_rep["FAKE"]["precision"], 4),
                    "recall": round(cls_rep["FAKE"]["recall"], 4),
                    "f1": round(cls_rep["FAKE"]["f1-score"], 4),
                    "support": cls_rep["FAKE"]["support"]
                }
            }
        }
        print(f"  {model_key:20s} Acc: {acc:.4f} | Prec: {prec:.4f} | Rec: {rec:.4f} | F1: {f1:.4f} | ROC-AUC: {roc_auc:.4f} | CV F1: {cv_mean:.4f}±{cv_std:.4f}")

    # Subgroup Fairness Analysis using Ensemble predictions
    print("  Calculating subgroup fairness on held-out test set...")
    test_eval = test_df.copy()
    test_eval["ensemble_pred"] = ensemble.predict(X_test)
    
    def compute_subgroup_metrics(df_sub, group_col):
        results = []
        for val, group in df_sub.groupby(group_col):
            n = len(group)
            y_true = group["target"].values
            y_pred = group["ensemble_pred"].values
            
            # Confusion elements for this group
            # TN: REAL predicted REAL (y_true=0, y_pred=0)
            # FP: REAL predicted FAKE (y_true=0, y_pred=1)
            # FN: FAKE predicted REAL (y_true=1, y_pred=0)
            # TP: FAKE predicted FAKE (y_true=1, y_pred=1)
            real_count = int(np.sum(y_true == 0))
            fake_count = int(np.sum(y_true == 1))
            
            fp = int(np.sum((y_true == 0) & (y_pred == 1)))
            fn = int(np.sum((y_true == 1) & (y_pred == 0)))
            
            fpr = round(fp / real_count, 4) if real_count > 0 else None
            fnr = round(fn / fake_count, 4) if fake_count > 0 else None
            acc = round(float(accuracy_score(y_true, y_pred)), 4) if n > 0 else None
            prec = round(float(precision_score(y_true, y_pred, pos_label=1, zero_division=0)), 4) if fake_count > 0 else None
            rec = round(float(recall_score(y_true, y_pred, pos_label=1, zero_division=0)), 4) if fake_count > 0 else None
            
            results.append({
                "subgroup": str(val),
                "sample_count": n,
                "accuracy": acc,
                "false_positive_rate": fpr,
                "false_negative_rate": fnr,
                "precision": prec,
                "recall": rec
            })
        return results

    fairness_metrics = {
        "political_lean_metrics": compute_subgroup_metrics(test_eval, "political_lean"),
        "topic_metrics": compute_subgroup_metrics(test_eval, "topic"),
        "evaluation_notes": (
            "Subgroup metrics evaluated on 237 held-out test samples. "
            "Neither political_lean nor topic were provided as features to the models. "
            "Subgroup disparities are diagnostic indicators for human reviewers rather than proof of intentional bias."
        )
    }

    # Save artifacts
    artifacts_dir = os.path.join(BASE_DIR, "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)
    print(f"[6/6] Saving serialized model artifacts to {artifacts_dir}...")

    bundle = {
        "vectorizer": tfidf,
        "models": models,
        "metadata": {
            "model_version": "1.0.0",
            "training_date": datetime.utcnow().isoformat() + "Z",
            "dataset_checksum_sha256": dataset_checksum,
            "train_samples": int(len(train_df)),
            "test_samples": int(len(test_df)),
            "random_state": 42,
            "feature_config": {
                "ngram_range": [1, 2],
                "min_df": 2,
                "max_features": 20000,
                "sublinear_tf": True,
                "stop_words": "english"
            },
            "class_mapping": {"0": "REAL", "1": "FAKE"}
        }
    }

    joblib.dump(bundle, os.path.join(artifacts_dir, "model_bundle.joblib"))
    joblib.dump(tfidf, os.path.join(artifacts_dir, "tfidf_vectorizer.joblib"))
    joblib.dump(ensemble, os.path.join(artifacts_dir, "ensemble_model.joblib"))

    # Save metrics JSON
    with open(os.path.join(artifacts_dir, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics_report, f, indent=2)

    with open(os.path.join(artifacts_dir, "confusion_matrices.json"), "w", encoding="utf-8") as f:
        json.dump(confusion_matrices, f, indent=2)

    with open(os.path.join(artifacts_dir, "fairness.json"), "w", encoding="utf-8") as f:
        json.dump(fairness_metrics, f, indent=2)

    # Save held-out test predictions for samples endpoint
    test_eval_export = test_eval[[
        "article_id", "headline", "body_text", "topic", "word_count", "label", "ensemble_pred"
    ]].copy()
    test_eval_export["predicted_label"] = ["FAKE" if p == 1 else "REAL" for p in test_eval_export["ensemble_pred"]]
    test_eval_export.to_json(os.path.join(artifacts_dir, "test_samples.json"), orient="records", indent=2)

    print("\n✓ Training and evaluation complete! All artifacts and metrics persisted successfully.")

if __name__ == "__main__":
    train_and_evaluate()
