import os
import json
import joblib
from typing import Dict, Any, List, Optional, Tuple
from app.core.config import settings
from app.core.logging import logger
from app.services.preprocessor import clean_text, count_words

class ModelService:
    def __init__(self):
        self.is_loaded: bool = False
        self.vectorizer = None
        self.models: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
        self.metrics: Dict[str, Any] = {}
        self.confusion_matrices: Dict[str, Any] = {}
        self.fairness_data: Dict[str, Any] = {}
        self.test_samples: List[Dict[str, Any]] = []
        self.error_detail: Optional[str] = None

    def load_artifacts(self) -> bool:
        """
        Loads the pre-trained model bundle and associated metrics.
        Executed once during FastAPI lifespan startup.
        """
        bundle_path = os.path.join(settings.ARTIFACTS_DIR, "model_bundle.joblib")
        metrics_path = os.path.join(settings.ARTIFACTS_DIR, "metrics.json")
        cm_path = os.path.join(settings.ARTIFACTS_DIR, "confusion_matrices.json")
        fairness_path = os.path.join(settings.ARTIFACTS_DIR, "fairness.json")
        samples_path = os.path.join(settings.ARTIFACTS_DIR, "test_samples.json")

        if not os.path.exists(bundle_path):
            self.error_detail = f"Model bundle not found at {bundle_path}. Please execute `python scripts/train.py` first."
            logger.error(self.error_detail)
            self.is_loaded = False
            return False

        try:
            logger.info(f"Loading model bundle from {bundle_path}...")
            bundle = joblib.load(bundle_path)
            self.vectorizer = bundle["vectorizer"]
            self.models = bundle["models"]
            self.metadata = bundle.get("metadata", {})

            if os.path.exists(metrics_path):
                with open(metrics_path, "r", encoding="utf-8") as f:
                    self.metrics = json.load(f)

            if os.path.exists(cm_path):
                with open(cm_path, "r", encoding="utf-8") as f:
                    self.confusion_matrices = json.load(f)

            if os.path.exists(fairness_path):
                with open(fairness_path, "r", encoding="utf-8") as f:
                    self.fairness_data = json.load(f)

            if os.path.exists(samples_path):
                with open(samples_path, "r", encoding="utf-8") as f:
                    self.test_samples = json.load(f)

            self.is_loaded = True
            self.error_detail = None
            logger.info("Successfully loaded all ML artifacts and metrics.")
            return True
        except Exception as e:
            self.error_detail = f"Failed to load artifacts: {str(e)}"
            logger.error(self.error_detail, exc_info=True)
            self.is_loaded = False
            return False

    def predict(
        self, headline: str, body_text: str, model_name: str = "ensemble"
    ) -> Dict[str, Any]:
        """
        Executes binary prediction for REAL vs FAKE news on input text.
        """
        if not self.is_loaded:
            raise RuntimeError("Model service artifacts are not loaded.")

        if model_name not in self.models:
            raise ValueError(f"Unknown model: {model_name}. Supported models: {list(self.models.keys())}")

        cleaned = clean_text(headline, body_text)
        total_words = count_words(f"{headline} {body_text}")

        # Vectorize
        X = self.vectorizer.transform([cleaned])

        model = self.models[model_name]

        # Calculate class probabilities
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X)[0]
            prob_real = float(probs[0])
            prob_fake = float(probs[1])
        else:
            # Fallback for models with decision_function
            score = float(model.decision_function(X)[0])
            import math
            prob_fake = 1.0 / (1.0 + math.exp(-score))
            prob_real = 1.0 - prob_fake

        # Class 1 is FAKE, Class 0 is REAL
        predicted_idx = 1 if prob_fake >= 0.5 else 0
        predicted_label = "FAKE" if predicted_idx == 1 else "REAL"
        model_score = prob_fake if predicted_label == "FAKE" else prob_real

        # Generate a human-readable explanation summary
        if predicted_label == "FAKE":
            explanation = (
                f"The classifier predicted this article as FAKE with a linguistic pattern match score of {model_score:.1%}. "
                "The text exhibits stylistic markers and rhetorical patterns frequently found in sensational or fabricated claims. "
                "Human editorial verification is strongly advised."
            )
        else:
            explanation = (
                f"The classifier predicted this article as REAL with a linguistic pattern match score of {model_score:.1%}. "
                "The text predominantly features vocabulary, institutional phrasing, and syntax characteristic of verified reporting. "
                "This indicates stylistic alignment with factual journalism rather than external factual verification."
            )

        return {
            "predicted_label": predicted_label,
            "model_name": model_name,
            "model_score": round(model_score, 4),
            "class_probabilities": {
                "REAL": round(prob_real, 4),
                "FAKE": round(prob_fake, 4)
            },
            "explanation": explanation,
            "model_version": self.metadata.get("model_version", "1.0.0"),
            "word_count": total_words,
            "cleaned_text": cleaned,
            "X_tfidf": X
        }

model_service = ModelService()
