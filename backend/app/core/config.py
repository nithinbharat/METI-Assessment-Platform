import os
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "METI Assessment Platform API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "meti_super_secret_jwt_key_2026_change_in_production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # SQLite async default fallback if POSTGRES DB is not provided
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./meti_assessment.db")

    # pyrefly: ignore [unexpected-keyword]
    model_config = ConfigDict(case_sensitive=True)

settings = Settings()
