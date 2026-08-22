"""Engine/session wiring. Falls back to SQLite when Postgres is unreachable so the
demo boots with no infrastructure at all."""

import logging
from collections.abc import Iterator

from sqlmodel import Session, SQLModel, create_engine

from app import models  # noqa: F401  (import registers the tables on SQLModel.metadata)
from app.config import settings

log = logging.getLogger(__name__)


def _build_engine():
    try:
        eng = create_engine(settings.database_url, pool_pre_ping=True)
        with eng.connect():
            pass
        return eng
    except Exception as exc:  # unreachable server, missing driver, bad URL
        log.warning("Primary database unavailable (%s); falling back to %s", exc, settings.fallback_database_url)
        return create_engine(settings.fallback_database_url, connect_args={"check_same_thread": False})


engine = _build_engine()


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
