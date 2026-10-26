import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Fake News Detection API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Text validation bounds (combined headline + body)
    MIN_WORD_COUNT: int = 15
    MAX_WORD_COUNT: int = 2500
    
    # Artifact directory relative to backend
    ARTIFACTS_DIR: str = os.getenv(
        "ARTIFACTS_DIR", 
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "artifacts")
    )
    
    # Data directory
    DATA_DIR: str = os.getenv(
        "DATA_DIR",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")
    )

    # Allowed CORS Origins (strictly configure for frontend development)
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
