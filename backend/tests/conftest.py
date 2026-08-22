import pytest

from app.config import settings


@pytest.fixture
def mock_mode(monkeypatch):
    """Force MOCK_MODE=1 for a test."""
    monkeypatch.setattr(settings, "mock_mode", True)
    yield
