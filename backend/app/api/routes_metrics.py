from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.response import (
    MetricsResponse, MetricDetail, ConfusionMatrixResponse, FairnessResponse
)
from app.services.model_service import model_service

router = APIRouter(prefix="/api", tags=["Evaluation & Fairness"])

@router.get("/metrics", response_model=MetricsResponse)
def get_metrics():
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=model_service.error_detail or "Model artifacts are not loaded."
        )

    models_data = {}
    for name, m in model_service.metrics.items():
        models_data[name] = MetricDetail(
            accuracy=m["accuracy"],
            precision=m["precision"],
            recall=m["recall"],
            f1=m["f1"],
            roc_auc=m["roc_auc"],
            cv_f1_mean=m.get("cv_f1_mean"),
            cv_f1_std=m.get("cv_f1_std"),
            per_class=m.get("per_class")
        )

    summary = {
        "dataset_name": "Synthetic News Dataset (HCLTech Career Shaper Project 31)",
        "total_articles": 1185,
        "train_split": 948,
        "test_split": 237,
        "class_balance": {"FAKE": 624, "REAL": 561}
    }

    return MetricsResponse(
        models=models_data,
        dataset_summary=summary,
        evaluation_test_size=len(model_service.test_samples) or 237,
        model_version=model_service.metadata.get("model_version", "1.0.0"),
        disclaimer=(
            "Benchmark metrics reflect performance on a synthetic held-out evaluation corpus. "
            "Real-world news involves adversarial nuances and changing language that require human review."
        )
    )

@router.get("/confusion-matrix", response_model=ConfusionMatrixResponse)
def get_confusion_matrix(model: str = Query(default="ensemble", description="Model name")):
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=model_service.error_detail or "Model artifacts are not loaded."
        )

    cm_dict = model_service.confusion_matrices.get(model)
    if not cm_dict:
        valid_models = list(model_service.confusion_matrices.keys())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown model '{model}'. Valid options: {valid_models}"
        )

    return ConfusionMatrixResponse(
        model_name=model,
        labels=cm_dict.get("labels", ["REAL", "FAKE"]),
        matrix=cm_dict["matrix"],
        total_evaluated=cm_dict.get("total_evaluated", 237)
    )

@router.get("/fairness", response_model=FairnessResponse)
def get_fairness():
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=model_service.error_detail or "Model artifacts are not loaded."
        )

    return FairnessResponse(
        political_lean_metrics=model_service.fairness_data.get("political_lean_metrics", []),
        topic_metrics=model_service.fairness_data.get("topic_metrics", []),
        evaluation_notes=model_service.fairness_data.get(
            "evaluation_notes",
            "Subgroup fairness diagnostics calculated on held-out test data."
        )
    )
