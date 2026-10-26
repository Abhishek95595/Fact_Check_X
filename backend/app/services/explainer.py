from typing import List, Dict, Any, Tuple
import numpy as np
from app.services.model_service import model_service
from app.schemas.response import InfluentialTerm

def get_feature_attributions(
    headline: str, body_text: str, model_name: str = "ensemble", top_n: int = 8
) -> Tuple[List[InfluentialTerm], List[InfluentialTerm], str]:
    """
    Computes signed feature contributions for input text.
    For linear models (Logistic Regression), uses exact w_i * x_i weights.
    For the ensemble (Soft-voting of LR, NB, RF), uses component Logistic Regression
    linear feature attribution and notes its component provenance clearly.
    
    Returns:
        (top_fake_terms, top_real_terms, attribution_notes)
    """
    if not model_service.is_loaded:
        raise RuntimeError("Model service artifacts are not loaded.")

    # We use Logistic Regression coefficients as the primary interpretable proxy
    lr_model = model_service.models.get("logistic_regression")
    vectorizer = model_service.vectorizer

    if lr_model is None or vectorizer is None:
        return [], [], "Feature attribution model unavailable."

    # Transform text
    from app.services.preprocessor import clean_text
    cleaned = clean_text(headline, body_text)
    X = vectorizer.transform([cleaned])

    feature_names = vectorizer.get_feature_names_out()
    coef = lr_model.coef_[0]

    # Non-zero indices in sparse vector
    coo = X.tocoo()
    contributions = []

    for idx, val in zip(coo.col, coo.data):
        term = feature_names[idx]
        weight = float(coef[idx] * val)
        contributions.append((term, weight))

    # Sort: positive weights push towards FAKE (Class 1), negative push towards REAL (Class 0)
    contributions.sort(key=lambda x: x[1], reverse=True)

    fake_terms = [
        InfluentialTerm(
            term=term,
            weight=round(weight, 4),
            direction="FAKE"
        )
        for term, weight in contributions if weight > 0
    ][:top_n]

    real_terms = [
        InfluentialTerm(
            term=term,
            weight=round(weight, 4),
            direction="REAL"
        )
        for term, weight in reversed(contributions) if weight < 0
    ][:top_n]

    if model_name == "ensemble":
        notes = (
            "Logistic Regression-based proxy explanation: The soft-voting ensemble combines "
            "Logistic Regression, Naive Bayes, and Random Forest probabilities. The feature weights shown here "
            "are linear coefficients (w_i * x_i) from the component Logistic Regression model. They illustrate "
            "sensational vs formal writing cues found in the text, not a complete mathematical decomposition of the ensemble, "
            "nor proof of factual truth."
        )
    else:
        notes = (
            f"Direct TF-IDF feature contribution weights (w_i * x_i) for {model_name}. "
            "These highlight vocabulary associated with training labels, not definitive factual proof."
        )

    return fake_terms, real_terms, notes
