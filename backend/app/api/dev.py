"""Dev-only helpers. Gated by DEV_MODE so they never ship into a demo by accident."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.config import settings
from app.db import get_session
from app.seed import COHORT_SIZE, EVENT_ID, seed_database

router = APIRouter(prefix="/api/dev", tags=["dev"])


@router.post("/reseed")
def reseed(event_id: str = EVENT_ID, session: Session = Depends(get_session)) -> dict:
    if not settings.dev_mode:
        raise HTTPException(status_code=404, detail="not found")
    count = seed_database(session, event_id=event_id, force=True)
    return {"status": "ok", "event_id": event_id, "participants": count or COHORT_SIZE}
