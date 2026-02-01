from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional, Union
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App settings
    app_name: str = "Consilium Agents"
    app_env: str = "development"
    debug: Union[bool, str] = False
    host: str = "0.0.0.0"
    port: int = 8000

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug(cls, v: Union[bool, str]) -> bool:
        """Parse debug setting from various formats."""
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            v_lower = v.lower().strip()
            if v_lower in ("true", "1", "yes", "on"):
                return True
            elif v_lower in ("false", "0", "no", "off", "", "*"):
                return False
        return False

    # API Keys
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    xai_api_key: Optional[str] = None

    # Redis (Upstash)
    upstash_redis_url: Optional[str] = None
    upstash_redis_token: Optional[str] = None

    # Database
    database_url: Optional[str] = None

    # Observability
    sentry_dsn: Optional[str] = None

    # Backend API URL
    backend_api_url: str = "http://localhost:3001"

    # CORS
    cors_origins: Union[list[str], str] = ["http://localhost:3000", "http://localhost:3001"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[list, str]) -> list[str]:
        """Parse CORS origins from string or list."""
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            # Split by comma and strip whitespace
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return ["http://localhost:3000", "http://localhost:3001"]

    class Config:
        # Load .env.local from project root
        # Path: apps/agents/src/shared/config/settings.py -> root (5 levels up)
        # settings.py -> config/ -> shared/ -> src/ -> agents/ -> apps/ -> ROOT
        _current = Path(__file__).resolve()
        _root = _current.parent.parent.parent.parent.parent.parent
        env_file = str(_root / ".env.local")
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra fields not defined in model


settings = Settings()
