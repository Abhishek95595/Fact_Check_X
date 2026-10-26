from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.response import SamplesListResponse, SampleArticle
from app.services.model_service import model_service

router = APIRouter(prefix="/api", tags=["Sample Articles"])

@router.get("/samples", response_model=SamplesListResponse)
def get_sample_articles(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=10, ge=1, le=50, description="Items per page"),
    topic: Optional[str] = Query(default=None, description="Filter by topic (e.g. economy, health, politics)")
):
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=model_service.error_detail or "Model artifacts are not loaded."
        )

    all_samples = model_service.test_samples

    if topic and topic.lower() != "all":
        filtered = [s for s in all_samples if s.get("topic", "").lower() == topic.lower()]
    else:
        filtered = all_samples

    total_count = len(filtered)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size

    sliced = filtered[start_idx:end_idx]

    articles = [
        SampleArticle(
            article_id=s["article_id"],
            headline=s["headline"],
            body_text=s["body_text"],
            topic=s["topic"],
            word_count=int(s["word_count"]),
            actual_label=s.get("label"),
            historical_prediction=s.get("predicted_label")
        )
        for s in sliced
    ]

    return SamplesListResponse(
        total_count=total_count,
        page=page,
        page_size=page_size,
        samples=articles
    )
