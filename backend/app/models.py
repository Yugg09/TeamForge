"""SQLModel tables.

Skills/availability/interests are variable-length structures, so they live in JSON
columns rather than side tables — the engine reads whole participants anyway, and
this keeps the demo's schema migration-free.
"""

from typing import Any, Optional

from sqlalchemy import Column, ForeignKey
from sqlalchemy.types import JSON
from sqlmodel import Field, SQLModel


class ParticipantRow(SQLModel, table=True):
    __tablename__ = "participants"

    id: str = Field(primary_key=True)
    event_id: str = Field(default="demo", index=True)
    name: str
    bio: str = ""
    timezone_offset_min: int = 0
    skills: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    preferred_roles: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    interests: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    availability: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    ambition: str = "ship"
    work_style: str = "planner"
    sync_pref: str = "sync"


class TeamRow(SQLModel, table=True):
    __tablename__ = "teams"

    id: str = Field(primary_key=True)
    event_id: str = Field(default="demo", index=True)
    member_ids: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    role_assignments: dict[str, str] = Field(default_factory=dict, sa_column=Column(JSON))
    # The full TeamScore object (total, terms, penalties, flags) as contract JSON.
    score: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    # Lock status: when locked, the optimizer won't move members in/out
    locked: bool = Field(default=False)


class PartitionStatusRow(SQLModel, table=True):
    __tablename__ = "partition_status"

    event_id: str = Field(primary_key=True, default="demo")
    status: str = Field(default="pending")  # pending | accepted | rejected
    locked_teams: list[str] = Field(default_factory=list, sa_column=Column(JSON))


class StepLogRow(SQLModel, table=True):
    __tablename__ = "step_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: str = Field(default="demo", index=True)
    seq: int = 0
    op: str = "seed"
    teams_touched: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    total_score: float = 0.0
