"""TeamForge API entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from sqlmodel import Session

from app.api import candidates, dev, explain, form_teams, member_explain, participants, projects, recommend, rebalance, team_adjust
from app.config import settings
from app.db import engine, init_db
from app.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables and make sure the demo cohort exists, so a bare checkout
    serves real data on first boot."""
    init_db()
    if not settings.mock_mode:
        with Session(engine) as session:
            seed_database(session)
    yield


app = FastAPI(
    title="TeamForge API",
    version="0.1.0",
    description="Cohort partitioning into balanced hackathon teams.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Every error leaves the API as {"detail": "..."} — the shape the frontend expects."""
    return JSONResponse(status_code=500, content={"detail": str(exc) or "internal server error"})


app.include_router(participants.router)
app.include_router(form_teams.router)
app.include_router(rebalance.router)
app.include_router(explain.router)
app.include_router(member_explain.router)
app.include_router(recommend.router)
app.include_router(team_adjust.router)
app.include_router(candidates.router)
app.include_router(projects.router)
app.include_router(dev.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
