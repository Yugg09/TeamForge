"""Runtime settings. Everything has a working default so the app boots bare."""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_database_url(url: str) -> str:
    """Accept Render/Heroku `postgres://` URLs and require SSL for Render hosts."""
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://") :]
    elif url.startswith("postgresql://") and "+psycopg" not in url.split("://", 1)[0]:
        url = "postgresql+psycopg://" + url[len("postgresql://") :]
    if "render.com" in url and "sslmode=" not in url:
        url += ("&" if "?" in url else "?") + "sslmode=require"
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://teamforge:teamforge@localhost:5432/teamforge"
    # When Postgres is not reachable we degrade to this instead of failing to boot.
    fallback_database_url: str = "sqlite:///./teamforge.db"

    mock_mode: bool = False
    dev_mode: bool = True

    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    # Lets Vercel preview deployments talk to the API without listing every URL.
    cors_origin_regex: str = r"https://.*\.vercel\.app"
    embedding_model: str = "all-MiniLM-L6-v2"

    # LLM settings for bio parsing and explanations
    llm_api_key: str = ""
    llm_model: str = "meta-llama/llama-3.1-8b-instruct:free"
    llm_base_url: str = "https://openrouter.ai/api/v1"

    # Required roles for the demo event; a project brief may override.
    required_roles: str = "frontend,backend,ai_ml,design"

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_database_url(cls, value: str) -> str:
        return normalize_database_url(value) if isinstance(value, str) else value

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def required_role_list(self) -> list[str]:
        return [r.strip() for r in self.required_roles.split(",") if r.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
