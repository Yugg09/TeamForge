"""Pure matching engine. No FastAPI, no SQLModel."""

from app.engine.rebalance import accept_replacement, remove_member
from app.engine.solver import solve
from app.engine.types import Cohort, Config, RebalanceResult, SolveResult, TeamResult

__all__ = [
    "Cohort",
    "Config",
    "RebalanceResult",
    "SolveResult",
    "TeamResult",
    "accept_replacement",
    "remove_member",
    "solve",
]
