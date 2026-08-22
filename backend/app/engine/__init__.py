"""Pure matching engine. No FastAPI, no SQLModel."""

from app.engine.solver import solve
from app.engine.types import Cohort, Config, SolveResult, TeamResult

__all__ = ["Cohort", "Config", "SolveResult", "TeamResult", "solve"]
