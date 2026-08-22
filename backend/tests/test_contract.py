"""Guards the frozen §2 contract: responses must match the spec's canonical JSON."""

import json

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

SPEC_FORM_TEAMS = json.loads("""
{
  "teams": [
    {
      "id": "team_1",
      "member_ids": ["p_04","p_11","p_23","p_39"],
      "role_assignments": {"p_04":"backend","p_11":"frontend","p_23":"ai_ml","p_39":"design"},
      "score": {
        "total": 0.84,
        "terms": {"coverage":0.92,"complementarity":0.80,"availability_overlap":0.78,
                  "goal_alignment":1.0,"style_fit":0.66,"interest_fit":0.71},
        "penalties": {"skill_redundancy":0.05,"role_gaps":0.0,"availability_starvation":0.0},
        "flags": [{"kind":"missing_role","payload":{"role":"product"}}]
      }
    }
  ],
  "step_log": [
    {"op":"seed","teams_touched":["team_1"],"total_score":0.61},
    {"op":"swap","teams_touched":["team_1","team_2"],"total_score":0.73},
    {"op":"move","teams_touched":["team_1"],"total_score":0.84}
  ],
  "fairness_ok": true
}
""")

SPEC_REBALANCE_REMOVE = json.loads("""
{
  "team": { "id":"team_1", "member_ids":["p_11","p_23","p_39"],
            "role_assignments":{"p_11":"frontend","p_23":"ai_ml","p_39":"design"},
            "score": { "total":0.71,
                       "terms":{"coverage":0.75,"complementarity":0.70,"availability_overlap":0.78,
                                "goal_alignment":1.0,"style_fit":0.66,"interest_fit":0.71},
                       "penalties":{"skill_redundancy":0.05,"role_gaps":0.30,"availability_starvation":0.0},
                       "flags":[{"kind":"missing_role","payload":{"role":"backend"}}] } },
  "gap_flag": {"kind":"missing_role","payload":{"role":"backend"}},
  "suggested_replacement_id": "p_47",
  "score_before": 0.84,
  "score_after": 0.71
}
""")

SPEC_REBALANCE_ACCEPT = json.loads("""
{ "team": { "id":"team_1", "member_ids":["p_11","p_23","p_39","p_47"],
            "role_assignments":{"p_11":"frontend","p_23":"ai_ml","p_39":"design","p_47":"backend"},
            "score": { "total":0.86, "terms":{"coverage":0.92,"complementarity":0.82,
                       "availability_overlap":0.79,"goal_alignment":1.0,"style_fit":0.66,"interest_fit":0.70},
                       "penalties":{"skill_redundancy":0.05,"role_gaps":0.0,"availability_starvation":0.0},
                       "flags":[] } },
  "gap_flag": null, "suggested_replacement_id": null,
  "score_before": 0.71, "score_after": 0.86 }
""")


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_mock_form_teams_matches_spec_fixture(mock_mode):
    r = client.post("/api/form-teams", json={"event_id": "demo", "min_size": 3, "max_size": 5})
    assert r.status_code == 200
    assert r.json() == SPEC_FORM_TEAMS


def test_mock_rebalance_remove_matches_spec_fixture(mock_mode):
    r = client.post("/api/rebalance", json={"team_id": "team_1", "remove_member_id": "p_04"})
    assert r.status_code == 200
    assert r.json() == SPEC_REBALANCE_REMOVE


def test_mock_rebalance_accept_matches_spec_fixture(mock_mode):
    r = client.post("/api/rebalance", json={"team_id": "team_1", "accept_replacement_id": "p_47"})
    assert r.status_code == 200
    assert r.json() == SPEC_REBALANCE_ACCEPT


def test_participants_shape(mock_mode):
    r = client.get("/api/participants")
    assert r.status_code == 200
    body = r.json()
    assert "participants" in body
    p = body["participants"][0]
    # snake_case on the wire, every contract field present
    assert set(p) >= {
        "id", "name", "bio", "timezone_offset_min", "skills", "preferred_roles",
        "interests", "availability", "ambition", "work_style", "sync_pref",
    }


def test_create_participant_returns_201(mock_mode):
    r = client.post("/api/participants", json={"name": "Test Person"})
    assert r.status_code == 201
    assert r.json()["name"] == "Test Person"
    assert r.json()["id"]
