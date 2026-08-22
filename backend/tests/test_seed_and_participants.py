"""Phase 2: the seeded cohort has the shape the optimizer needs, and the
participants endpoints serve real data."""

import itertools

from fastapi.testclient import TestClient
from sqlmodel import select

from app.main import app
from app.models import ParticipantRow
from app.seed import COHORT_SIZE, build_cohort
from app.services import availability as av
from app.services.bio_parse import enrich, parse_bio

client = TestClient(app)


def test_cohort_size_and_unique_ids():
    cohort = build_cohort()
    assert len(cohort) == COHORT_SIZE == 48
    assert len({p["id"] for p in cohort}) == 48


def test_cohort_is_deterministic():
    assert build_cohort() == build_cohort()


def test_cohort_contains_a_redundant_ai_ml_cluster():
    """The redundancy penalty needs something to bite on."""
    cohort = build_cohort()
    ai_ml = [p for p in cohort if p["preferred_roles"][0] == "ai_ml"]
    assert len(ai_ml) >= 12
    # far more ai_ml people than the ~10-16 teams a 48-person cohort produces
    assert len(ai_ml) > len([p for p in cohort if p["preferred_roles"][0] == "design"])


def test_cohort_has_non_overlapping_availability_bands():
    cohort = build_cohort()
    sets = {p["id"]: av.to_week_intervals(p["availability"]) for p in cohort}
    bands = {}
    for p in cohort:
        bands.setdefault(p["timezone_offset_min"], []).append(p["id"])
    assert len(bands) >= 3

    # Someone from each pair of bands cannot meet the 120 min floor together.
    for band_a, band_b in itertools.combinations(bands.values(), 2):
        cross = av.overlap_minutes([sets[band_a[0]], sets[band_b[0]]])
        assert cross < 120


def test_every_participant_has_some_availability():
    for p in build_cohort():
        assert av.total_minutes(av.to_week_intervals(p["availability"])) > 0


def test_seeded_database_serves_real_participants(seeded_db, session):
    rows = session.exec(select(ParticipantRow)).all()
    assert len(rows) == 48

    r = client.get("/api/participants")
    assert r.status_code == 200
    body = r.json()["participants"]
    assert len(body) == 48
    assert body[0]["skills"] and body[0]["availability"]


def test_bio_parsing_extracts_structured_fields():
    parsed = parse_bio(
        "Backend developer using Golang and k8s. Here to win. Into developer tools, prefer async."
    )
    assert "go" in parsed["skills"]
    assert "kubernetes" in parsed["skills"]
    assert "backend" in parsed["preferred_roles"]
    assert parsed["ambition"] == "win"
    assert parsed["sync_pref"] == "async"


def test_bio_parsing_never_overwrites_explicit_input():
    payload = {
        "name": "X",
        "bio": "Frontend developer using React.",
        "preferred_roles": ["design"],
        "skills": [{"id": "figma", "proficiency": 5}],
    }
    out = enrich(payload)
    assert out["preferred_roles"] == ["design"]
    assert out["skills"] == [{"id": "figma", "proficiency": 5}]


def test_post_participant_persists_and_parses_bio(seeded_db):
    r = client.post(
        "/api/participants",
        json={"name": "Parsed Person", "bio": "ML engineer working with PyTorch on NLP. Here to learn."},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["id"]
    assert {s["id"] for s in body["skills"]} >= {"pytorch", "nlp"}
    assert "ai_ml" in body["preferred_roles"]
    assert body["ambition"] == "learn"

    listed = client.get("/api/participants").json()["participants"]
    assert any(p["id"] == body["id"] for p in listed)
