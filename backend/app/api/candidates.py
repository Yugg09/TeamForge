"""GET /api/candidates/search — semantic search over the cohort.

Uses sentence-transformers embeddings when available, falls back to keyword matching.
"""

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.config import settings
from app.db import get_session
from app.schemas import Participant, ParticipantsResponse
from app.seed import EVENT_ID
from app.services.embeddings import backend_name, similarity_matrix
from app.api.participants import load_cohort

router = APIRouter(prefix="/api", tags=["candidates"])


def _build_search_text(p: Participant) -> str:
    """Build searchable text from a participant."""
    text_parts = [
        p.name.lower(),
        p.bio.lower() if p.bio else "",
        " ".join(s.id.replace("_", " ") for s in (p.skills or [])),
        " ".join(p.preferred_roles or []),
        " ".join(p.interests or []),
    ]
    return " ".join(text_parts)


def _keyword_search(query: str, participants: list[Participant]) -> list[Participant]:
    """Simple keyword fallback when embeddings are unavailable."""
    query_lower = query.lower()
    terms = query_lower.split()

    scored: list[tuple[float, Participant]] = []
    for p in participants:
        text = _build_search_text(p)

        # Score: how many query terms match
        matches = sum(1 for term in terms if term in text)
        if matches > 0:
            scored.append((matches / len(terms), p))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in scored]


def _embedding_search(query: str, participants: list[Participant], top_k: int = 10) -> list[Participant]:
    """Semantic search using sentence-transformers embeddings."""
    if backend_name() == "jaccard":
        # Embeddings not available — use keyword search
        return _keyword_search(query, participants)

    # Build profiles for embedding
    profiles = {}
    for p in participants:
        profiles[p.id] = {
            "interests": p.interests or [],
            "text": _build_search_text(p),
        }

    # Compute similarity between query and all participants
    # Add query as a virtual participant
    profiles["__query__"] = {
        "interests": [],
        "text": query,
    }

    sim = similarity_matrix(profiles)

    # Rank by similarity to query
    scored: list[tuple[float, Participant]] = []
    p_map = {p.id: p for p in participants}
    for p in participants:
        score = sim.get(("__query__", p.id), sim.get((p.id, "__query__"), 0.0))
        scored.append((score, p_map[p.id]))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in scored[:top_k]]


@router.get("/candidates/search", response_model=ParticipantsResponse)
def search_candidates(
    q: str = Query(..., min_length=1, description="Search query"),
    session: Session = Depends(get_session),
) -> ParticipantsResponse:
    """Semantic search over the cohort.

    Uses sentence-transformers when available, falls back to keyword matching.
    """
    participants = load_cohort(session, event_id=EVENT_ID)
    if not participants:
        return ParticipantsResponse(participants=[])

    results = _embedding_search(q, participants)
    return ParticipantsResponse(participants=results)
