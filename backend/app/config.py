"""Runtime settings. Everything has a working default so the app boots bare."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://teamforge:teamforge@localhost:5432/teamforge"
    # When Postgres is not reachable we degrade to this instead of failing to boot.
    fallback_database_url: str = "sqlite:///./teamforge.db"

    mock_mode: bool = False
    dev_mode: bool = True

    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    embedding_model: str = "all-MiniLM-L6-v2"

    # Required roles for the demo event; a project brief may override.
    required_roles: str = "frontend,backend,ai_ml,design"

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
