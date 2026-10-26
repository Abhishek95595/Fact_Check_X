from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class InfluentialTerm(BaseModel):
    term: str
    weight: float = Field(..., description="Signed contribution; positive pushes towards FAKE, negative pushes towards REAL")
    direction: str = Field(..., description="'FAKE' or 'REAL'")

class PredictionResponse(BaseModel):
    predicted_label: str = Field(..., description="'REAL' or 'FAKE'")
    model_name: str
    model_score: float = Field(
        ...,
        description="Model confidence / probability for the predicted class [0.0 - 1.0]. Represents linguistic pattern match score, NOT verified factual truth."
    )
    class_probabilities: Dict[str, float] = Field(
        ...,
        description="Scores / estimated probabilities for each class (REAL, FAKE)"
    )
    explanation: str = Field(..., description="Human-readable summary of the prediction result")
    top_terms: List[InfluentialTerm] = Field(default_factory=list, description="Top terms contributing to the prediction")
    disclaimer: str = Field(
        default="Automated NLP classification is an assistive decision-support tool based on linguistic patterns, not a verified fact check. Human editorial review is required before taking any action.",
        description="Safety and limitations disclaimer"
    )
    model_version: str
    word_count: int

class DetailedExplanationResponse(BaseModel):
    predicted_label: str
    model_name: str
    model_score: float
    explanation_method: str = Field(..., description="Explanation methodology used (e.g. TF-IDF feature attribution)")
    attribution_notes: str
    top_fake_terms: List[InfluentialTerm] = Field(default_factory=list, description="Terms pushing towards FAKE")
    top_real_terms: List[InfluentialTerm] = Field(default_factory=list, description="Terms pushing towards REAL")
    disclaimer: str

class MetricDetail(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float
    cv_f1_mean: Optional[float] = None
    cv_f1_std: Optional[float] = None
    per_class: Optional[Dict[str, Dict[str, float]]] = None

class MetricsResponse(BaseModel):
    models: Dict[str, MetricDetail]
    dataset_summary: Dict[str, Any]
    evaluation_test_size: int
    model_version: str
    disclaimer: str

class ConfusionMatrixResponse(BaseModel):
    model_name: str
    labels: List[str] = ["REAL", "FAKE"]
    matrix: List[List[int]] = Field(
        ..., 
        description="2x2 matrix: [[True REAL, False FAKE], [False REAL, True FAKE]]"
    )
    total_evaluated: int

class SubgroupFairnessMetric(BaseModel):
    subgroup: str
    sample_count: int
    accuracy: Optional[float] = None
    false_positive_rate: Optional[float] = None
    false_negative_rate: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None

class FairnessResponse(BaseModel):
    political_lean_metrics: List[SubgroupFairnessMetric]
    topic_metrics: List[SubgroupFairnessMetric]
    evaluation_notes: str

class SampleArticle(BaseModel):
    article_id: str
    headline: str
    body_text: str
    topic: str
    word_count: int
    actual_label: Optional[str] = None
    historical_prediction: Optional[str] = None

class SamplesListResponse(BaseModel):
    total_count: int
    page: int
    page_size: int
    samples: List[SampleArticle]

class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
    available_models: List[str]
    model_version: Optional[str] = None
    error_detail: Optional[str] = None
