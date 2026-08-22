"""POST /api/rebalance."""

from fastapi import APIRouter, HTTPException

from app import mocks
from app.config import settings
from app.schemas import RebalanceRequest, RebalanceResponse

router = APIRouter(prefix="/api", tags=["teams"])


def _mock_rebalance(payload: RebalanceRequest) -> RebalanceResponse:
    if payload.accept_replacement_id:
        return mocks.MOCK_REBALANCE_ACCEPT
    if payload.remove_member_id:
        return mocks.MOCK_REBALANCE_REMOVE
    raise HTTPException(
        status_code=422,
        detail="rebalance requires either remove_member_id or accept_replacement_id",
    )


@router.post("/rebalance", response_model=RebalanceResponse)
def rebalance(payload: RebalanceRequest) -> RebalanceResponse:
    if settings.mock_mode:
        return _mock_rebalance(payload)
    return _mock_rebalance(payload)
