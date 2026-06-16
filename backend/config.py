from pydantic_settings import BaseSettings
from pathlib import Path
import os

class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "llm_platform"
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATASETS_PATH: str = str(BASE_DIR / "datasets")
    MODELS_PATH: str = str(BASE_DIR / "trained_models")
    LOGS_PATH: str = str(BASE_DIR / "logs")
    REPORTS_PATH: str = str(BASE_DIR / "reports")
    
    PORT: int = 8000
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.DATASETS_PATH, exist_ok=True)
os.makedirs(settings.MODELS_PATH, exist_ok=True)
os.makedirs(settings.LOGS_PATH, exist_ok=True)
os.makedirs(settings.REPORTS_PATH, exist_ok=True)
