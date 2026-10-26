from typing import Optional, Literal
from pydantic import BaseModel, Field

SupportedModel = Literal[
    "ensemble",
    "logistic_regression",
    "naive_bayes",
    "linear_svm",
    "random_forest"
]

class NewsAnalysisRequest(BaseModel):
    headline: str = Field(..., description="Headline or title of the news article")
    body_text: str = Field(..., description="Full body text of the news article")
    model: Optional[SupportedModel] = Field(
        default="ensemble",
        description="Classifier to use: ensemble, logistic_regression, naive_bayes, linear_svm, random_forest"
    )

class ExplanationRequest(BaseModel):
    headline: str = Field(..., description="Headline of the article to explain")
    body_text: str = Field(..., description="Body of the article to explain")
    model: Optional[SupportedModel] = Field(
        default="ensemble",
        description="Classifier for term attribution context"
    )
