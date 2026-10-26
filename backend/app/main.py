from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.services.model_service import model_service
from app.schemas.response import HealthResponse
from app.api.routes_predict import router as predict_router
from app.api.routes_metrics import router as metrics_router
from app.api.routes_samples import router as samples_router

# Initialize structured logging
setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML artifacts into memory once
    logger.info("Initializing Fake News Detection API...")
    loaded = model_service.load_artifacts()
    if loaded:
        logger.info("ML models ready for inference.")
    else:
        logger.warning("ML models could not be loaded at startup.")
    yield
    # Shutdown
    logger.info("Shutting down Fake News Detection API.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-ready REST API for Fake News Detection using TF-IDF and Soft-Voting Ensemble Learning.",
    lifespan=lifespan
)

# Configure CORS strictly
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Register routers
app.include_router(predict_router)
app.include_router(metrics_router)
app.include_router(samples_router)

@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """
    Returns API health status, loaded model versions, and artifact availability.
    """
    models_available = list(model_service.models.keys()) if model_service.is_loaded else []
    return HealthResponse(
        status="healthy" if model_service.is_loaded else "degraded",
        models_loaded=model_service.is_loaded,
        available_models=models_available,
        model_version=model_service.metadata.get("model_version") if model_service.is_loaded else None,
        error_detail=model_service.error_detail
    )

@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_url": "/api/health"
    }
