import os
import tempfile

# Point the app at a throwaway SQLite file before anything imports app.db.
_TEST_DB = os.path.join(tempfile.gettempdir(), "teamforge_test.db")
if os.path.exists(_TEST_DB):
    os.remove(_TEST_DB)
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB}"

import pytest  # noqa: E402
from sqlmodel import Session  # noqa: E402

from app.config import settings  # noqa: E402
from app.db import engine, init_db  # noqa: E402
from app.seed import seed_database  # noqa: E402


@pytest.fixture
def mock_mode(monkeypatch):
    """Force MOCK_MODE=1 for a test."""
    monkeypatch.setattr(settings, "mock_mode", True)
    yield


@pytest.fixture(scope="session")
def seeded_db():
    init_db()
    with Session(engine) as session:
        seed_database(session, force=True)
    yield engine


@pytest.fixture
def session(seeded_db):
    with Session(seeded_db) as s:
        yield s
