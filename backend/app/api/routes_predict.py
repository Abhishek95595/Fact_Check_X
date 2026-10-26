from fastapi import APIRouter, HTTPException, status
from app.schemas.request import NewsAnalysisRequest, ExplanationRequest
from app.schemas.response import PredictionResponse, DetailedExplanationResponse
from app.services.model_service import model_service
from app.services.explainer import get_feature_attributions
from app.services.preprocessor import count_words
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["Inference & Explainability"])

def validate_article_length(headline: str, body_text: str):
    combined = f"{headline or ''} {body_text or ''}".strip()
    words = count_words(combined)
    
    if not headline.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Headline must not be empty."
        )
    if not body_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Article body must not be empty."
        )
    if words < settings.MIN_WORD_COUNT:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Article text is too short ({words} words). Minimum required is {settings.MIN_WORD_COUNT} words across headline and body."
        )
    if words > settings.MAX_WORD_COUNT:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Article text is too long ({words} words). Maximum allowed is {settings.MAX_WORD_COUNT} words."
        )

@router.post("/predict", response_model=PredictionResponse)
def predict_news(request: NewsAnalysisRequest):
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=model_service.error_detail or "Model artifacts are not loaded."
        )

    validate_article_length(request.headline, request.body_text)

    try:
        result = model_service.predict(
            headline=request.headline,
            body_text=request.body_text,
            model_name=request.model or "ensemble"
        )
        
        # Retrieve top influential terms
        fake_terms, real_terms, _ = get_feature_attributions(
            headline=request.headline,
            body_text=request.body_text,
            model_name=request.model or "ensemble",
            top_n=5
        )
        
        top_terms = fake_terms if result["predicted_label"] == "FAKE" else real_terms

        return PredictionResponse(
            predicted_label=result["predicted_label"],
            model_name=result["model_name"],
            model_score=result["model_score"],
            class_probabilities=result["class_probabilities"],
            explanation=result["explanation"],
            top_terms=top_terms,
            model_version=result["model_version"],
            word_count=result["word_count"]
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Prediction error: {str(e)}")

@router.post("/explain", response_model=DetailedExplanationResponse)
def explain_news(request: ExplanationRequest):
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=model_service.error_detail or "Model artifacts are not loaded."
        )

    validate_article_length(request.headline, request.body_text)

    try:
        pred = model_service.predict(
            headline=request.headline,
            body_text=request.body_text,
            model_name=request.model or "ensemble"
        )
        
        fake_terms, real_terms, notes = get_feature_attributions(
            headline=request.headline,
            body_text=request.body_text,
            model_name=request.model or "ensemble",
            top_n=10
        )

        return DetailedExplanationResponse(
            predicted_label=pred["predicted_label"],
            model_name=pred["model_name"],
            model_score=pred["model_score"],
            explanation_method="TF-IDF Linear Feature Attribution (w_i * x_i)",
            attribution_notes=notes,
            top_fake_terms=fake_terms,
            top_real_terms=real_terms,
            disclaimer=(
                "Influential words highlight stylistic and rhetorical cues learned during training. "
                "A word pushing towards FAKE indicates sensational or informal usage in the dataset, "
                "not proof that the factual assertion is untrue."
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Explanation error: {str(e)}")
