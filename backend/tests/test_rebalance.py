"""Phase 4 rebalancer + Phase 5 form→rebalance cycle and reseed."""

from fastapi.testclient import TestClient

from app.config import settings
from app.engine.preprocess import build_cohort
from app.engine.rebalance import accept_replacement, remove_member
from app.main import app
from app.seed import COHORT_SIZE

client = TestClient(app)


def _healing_target(teams: list[dict], participants: list[dict]) -> tuple[dict, str]:
    """Pick a remove that the constrained rebalancer can actually heal."""
    cohort = build_cohort(
        participants,
        min_size=3,
        max_size=5,
        required_roles=tuple(settings.required_role_list),
    )
    roster = {t["id"]: list(t["member_ids"]) for t in teams}
    by_id = {t["id"]: t for t in teams}
    for team in teams:
        for mid in team["member_ids"]:
            wounded = remove_member(team["id"], mid, roster, cohort)
            if not wounded.gap_flag or not wounded.suggested_replacement_id:
                continue
            updated = {k: list(v) for k, v in roster.items()}
            updated[team["id"]] = wounded.team.member_ids
            try:
                healed = accept_replacement(
                    team["id"], wounded.suggested_replacement_id, updated, cohort
                )
            except ValueError:
                continue
            if healed.score_after > healed.score_before:
                return by_id[team["id"]], mid
    raise AssertionError("no healing rebalance exists on this partition")


def test_form_then_rebalance_cycle(session):
    """Remove returns a gap + suggestion; accept heals the team and raises score."""
    formed = client.post("/api/form-teams", json={"event_id": "demo", "min_size": 3, "max_size": 5})
    assert formed.status_code == 200, formed.text
    body = formed.json()
    assert body["fairness_ok"]
    assert body["teams"]
    people = client.get("/api/participants").json()["participants"]
    team, remove_id = _healing_target(body["teams"], people)

    removed = client.post(
        "/api/rebalance",
        json={"team_id": team["id"], "remove_member_id": remove_id},
    )
    assert removed.status_code == 200, removed.text
    wounded = removed.json()
    assert wounded["gap_flag"] is not None
    assert wounded["suggested_replacement_id"]
    assert remove_id not in wounded["team"]["member_ids"]

    accepted = client.post(
        "/api/rebalance",
        json={"team_id": team["id"], "accept_replacement_id": wounded["suggested_replacement_id"]},
    )
    assert accepted.status_code == 200, accepted.text
    healed = accepted.json()
    assert healed["gap_flag"] is None
    assert healed["suggested_replacement_id"] is None
    assert healed["score_after"] > healed["score_before"]
    assert wounded["suggested_replacement_id"] in healed["team"]["member_ids"]


def test_reseed_resets_the_demo_cohort(session):
    r = client.post("/api/dev/reseed")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.json()["participants"] == COHORT_SIZE
    listed = client.get("/api/participants")
    assert listed.status_code == 200
    assert len(listed.json()["participants"]) == COHORT_SIZE


def test_reseed_is_hidden_when_dev_mode_is_off(monkeypatch):
    monkeypatch.setattr(settings, "dev_mode", False)
    r = client.post("/api/dev/reseed")
    assert r.status_code == 404
    assert r.json() == {"detail": "not found"}
