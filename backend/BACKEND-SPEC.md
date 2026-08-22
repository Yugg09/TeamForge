# TeamForge — BACKEND Build Spec

**Hand this file directly to your coding agent.** It builds the FastAPI backend + matching engine for TeamForge, an intelligent hackathon team-formation platform. The frontend is built separately by another agent from a companion `FRONTEND Build Spec`. The two connect **only** through the API contract in §2 — that block is identical in both specs and must not be altered.

---

## 0. Instructions to the agent

Read the whole file first. Rules:

1. **This is a global optimization problem, not a ranking problem.** You partition the whole cohort of participants into balanced teams that maximize a global objective under hard constraints. Never reduce it to "score each person and sort." Doing so fails the build.
2. **§2 is the frozen contract.** It is byte-identical in the frontend spec. Never rename a field, change a shape, or alter the JSON. The wire format is **snake_case**.
3. **Ship mock endpoints first (Phase 1)** returning the exact fixtures in §2 before building the engine. This unblocks the frontend agent immediately.
4. **The engine is pure Python** (`app/engine/**`): no FastAPI imports, no SQLModel imports — plain data in, plain data out — so it's unit-testable with no server.
5. **Deterministic core, optional intelligence.** Scoring and constraints are fully deterministic. Embeddings run locally via `sentence-transformers` with a Jaccard fallback; the app must boot and demo with **zero API keys**.
6. Build in phase order (§7). Each phase has acceptance criteria.

---

## 1. Stack (fixed)

FastAPI · Pydantic · SQLModel · PostgreSQL · OR-Tools (CP-SAT) · NetworkX · numpy · scipy · sentence-transformers (local) with a Jaccard fallback. Auth is **faked** — no login; requests carry an identity header or none. CORS is enabled for the frontend origin. Postgres runs via `docker compose`.

---

## 2. ▓▓▓ FROZEN API CONTRACT — IDENTICAL IN THE FRONTEND SPEC — DO NOT MODIFY ▓▓▓

Four MVP endpoints. Wire format is **snake_case JSON**.

```text
GET  /api/participants     → 200 { "participants": Participant[] }
POST /api/participants     ← ParticipantIn                → 201 Participant
POST /api/form-teams       ← FormTeamsRequest             → 200 FormTeamsResponse
POST /api/rebalance        ← RebalanceRequest             → 200 RebalanceResponse
GET  /api/health           → 200 { "status": "ok" }
```

### Types (Pydantic — your side)

```python
from pydantic import BaseModel
from typing import Literal, Optional

RoleId   = Literal["frontend","backend","ai_ml","design","product","research","devops"]
Ambition = Literal["win","ship","learn"]

class Skill(BaseModel):
    id: str                       # canonical taxonomy id, e.g. "react"
    proficiency: int              # 1..5
    verified: bool = False

class AvailabilityWindow(BaseModel):
    day: int                      # 0..6 (Mon=0)
    start_utc: int                # 0..1439 minutes from midnight UTC
    end_utc: int

class ParticipantIn(BaseModel):
    name: str
    bio: str = ""                 # free text → parse to structured fields
    timezone_offset_min: int = 0
    skills: list[Skill] = []
    preferred_roles: list[RoleId] = []
    interests: list[str] = []
    availability: list[AvailabilityWindow] = []
    ambition: Ambition = "ship"
    work_style: Literal["planner","improviser"] = "planner"
    sync_pref: Literal["sync","async"] = "sync"

class Participant(ParticipantIn):
    id: str

class TeamScoreTerms(BaseModel):
    coverage: float; complementarity: float; availability_overlap: float
    goal_alignment: float; style_fit: float; interest_fit: float

class TeamScorePenalties(BaseModel):
    skill_redundancy: float; role_gaps: float; availability_starvation: float

class RiskFlag(BaseModel):
    kind: Literal["missing_role","single_point_of_failure","availability_gap","goal_mismatch"]
    payload: dict                 # {"role":...} | {"skill":...,"member_id":...}
                                  # | {"overlap_minutes":...} | {"outlier_id":...}

class TeamScore(BaseModel):
    total: float                  # 0..1 (frontend displays ×100)
    terms: TeamScoreTerms
    penalties: TeamScorePenalties
    flags: list[RiskFlag]

class Team(BaseModel):
    id: str
    member_ids: list[str]
    role_assignments: dict[str, RoleId]   # member_id → role
    score: TeamScore

class StepLogEntry(BaseModel):
    op: Literal["seed","swap","move"]
    teams_touched: list[str]
    total_score: float            # cohort total after this step

class FormTeamsRequest(BaseModel):
    event_id: str = "demo"; min_size: int = 3; max_size: int = 5

class FormTeamsResponse(BaseModel):
    teams: list[Team]; step_log: list[StepLogEntry]; fairness_ok: bool

class RebalanceRequest(BaseModel):
    team_id: str
    remove_member_id: Optional[str] = None
    accept_replacement_id: Optional[str] = None

class RebalanceResponse(BaseModel):
    team: Team
    gap_flag: Optional[RiskFlag] = None
    suggested_replacement_id: Optional[str] = None
    score_before: float
    score_after: float
```

### Canonical JSON examples (these exact shapes are the fixtures; frontend builds against them)

`POST /api/form-teams` request → response:
```json
{ "event_id": "demo", "min_size": 3, "max_size": 5 }
```
```json
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
```

`POST /api/rebalance` — remove (request → response):
```json
{ "team_id": "team_1", "remove_member_id": "p_04" }
```
```json
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
```

`POST /api/rebalance` — accept (request → response):
```json
{ "team_id": "team_1", "accept_replacement_id": "p_47" }
```
```json
{ "team": { "id":"team_1", "member_ids":["p_11","p_23","p_39","p_47"],
            "role_assignments":{"p_11":"frontend","p_23":"ai_ml","p_39":"design","p_47":"backend"},
            "score": { "total":0.86, "terms":{"coverage":0.92,"complementarity":0.82,
                       "availability_overlap":0.79,"goal_alignment":1.0,"style_fit":0.66,"interest_fit":0.70},
                       "penalties":{"skill_redundancy":0.05,"role_gaps":0.0,"availability_starvation":0.0},
                       "flags":[] } },
  "gap_flag": null, "suggested_replacement_id": null,
  "score_before": 0.71, "score_after": 0.86 }
```

▓▓▓ END FROZEN CONTRACT ▓▓▓

---

## 3. Project structure

```text
backend/
├── docker-compose.yml           # postgres
├── pyproject.toml               # fastapi sqlmodel ortools networkx sentence-transformers numpy scipy
├── .env.example                 # DATABASE_URL, MOCK_MODE
├── app/
│   ├── main.py                  # app, CORS, routers, MOCK_MODE flag, /api/health
│   ├── config.py                # settings: DATABASE_URL, MOCK_MODE, model name
│   ├── db.py                    # engine, session, init_db
│   ├── models.py                # SQLModel tables
│   ├── schemas.py               # the Pydantic contract from §2
│   ├── seed.py                  # ~48 synthetic participants
│   ├── mocks.py                 # fixtures returned when MOCK_MODE=1
│   ├── api/
│   │   ├── participants.py      # GET/POST /api/participants
│   │   ├── form_teams.py        # POST /api/form-teams
│   │   └── rebalance.py         # POST /api/rebalance
│   ├── engine/                  # PURE — no fastapi, no sqlmodel
│   │   ├── types.py             # dataclasses; imports nothing app-side
│   │   ├── objective.py         # scoring (§4)
│   │   ├── constraints.py       # hard constraints + risk flags (§5)
│   │   ├── solver.py            # OR-Tools ▸ local search, step log (§6)
│   │   ├── roles.py             # NetworkX bipartite matching
│   │   └── explain.py           # score → template ▸ optional prose
│   └── services/
│       ├── embeddings.py        # sentence-transformers ▸ Jaccard fallback
│       ├── availability.py      # UTC interval intersection
│       └── taxonomy.py          # canonical skills + skill→role mapping
└── tests/
    └── test_engine.py           # engine acceptance tests (no server)
```

**Purity rules (enforce):** `app/engine/**` imports no FastAPI/SQLModel; `app/engine/types.py` imports nothing app-side; the wire is snake_case everywhere.

---

## 4. The matching engine — objective function (`objective.py`)

Team score = weighted positive terms − penalties, normalized to `[0,1]`.

```python
WEIGHTS   = {"coverage":0.28,"complementarity":0.20,"availability_overlap":0.18,
             "goal_alignment":0.14,"style_fit":0.08,"interest_fit":0.12}
PENALTIES = {"skill_redundancy":0.15,"role_gaps":0.30,"availability_starvation":0.25}
```

- **coverage** — fraction of required roles covered by ≥1 member (via `preferred_roles` ∪ skill-implied roles).
- **complementarity** — normalized Shannon entropy of the skill-category distribution (`scipy.stats.entropy`). Rewards spread, not stacking.
- **availability_overlap** — shared weekly minutes squashed by `min(overlap/600, 1)`.
- **goal_alignment** — `1 − normalized_variance(ambition)` over {learn:0, ship:1, win:2}.
- **style_fit** — agreement on `work_style`/`sync_pref` (mild).
- **interest_fit** — mean pairwise interest/embedding similarity; also enforces fairness.
- **skill_redundancy** *(critical penalty)* — for each skill held by >1 member above threshold, add redundancy mass. **This is what makes five same-role members score below a balanced team. Without it the build is just a skill-sum ranker.**
- **role_gaps** *(penalty)* — absolute magnitude of unfilled required roles.
- **availability_starvation** *(penalty)* — fires when shared overlap < 120 min/week.

Required roles for the demo default to a standard hackathon set: frontend, backend, ai_ml, design (config-driven; a project brief may override).

---

## 5. Hard constraints (`constraints.py`) — gate feasibility, not scored

- Team size in `[min_size, max_size]` (from the request; default 3–5).
- Shared availability overlap ≥ 120 min/week — else infeasible.
- No participant on two teams.
- Every participant placed exactly once (fairness).

Also derive **risk flags** here: `missing_role`, `single_point_of_failure` (a required skill held by exactly one member), `availability_gap` (overlap near the floor), `goal_mismatch` (an ambition outlier).

**Availability math** (`services/availability.py`): weekly UTC intervals; team overlap = intersection of all members' interval sets in minutes. Unit-test this.

---

## 6. Solver (`solver.py`)

```
1. Preprocess: resolve skills→roles, build availability sets, attach similarity.
2. Solve:
   - Primary: OR-Tools CP-SAT partition maximizing the SUMMED objective under
     hard constraints, ~3s budget.
   - Fallback (timeout/infeasible): greedy seed (round-robin around the
     least-placeable participant) + local search with SWAP(a,b)/MOVE(a) and
     simulated-annealing acceptance.
3. Accept a move only if it raises the GLOBAL summed score.
4. Emit step_log: ordered (op, teams_touched, total_score). REQUIRED — the
   frontend animates the score climbing from this.
```

**Rebalancer** (`/api/rebalance`) reuses the pipeline in a **constrained mode**: on remove, freeze all teams but the affected one, flag the gap, and search a single healing MOVE from the free-agent pool for the best `suggested_replacement_id`; on accept, slot the member and rescore. Sub-second, not a full re-solve.

**Role assignment** (`roles.py`): after teams form, assign each member a role via NetworkX max-weight bipartite matching (members ↔ required roles; weight = role-relevant proficiency × preference rank).

**Explanation** (`explain.py`): deterministic template decomposing terms/penalties/flags into plain language; optional LLM rewrite that may never invent facts absent from the score object.

---

## 7. Phases & acceptance

### Phase 0 — Scaffold
FastAPI app, `docker compose` Postgres, CORS for the frontend origin, `/api/health`.
**Accept:** `GET /api/health` → `{"status":"ok"}`.

### Phase 1 — Mock endpoints (do this before the engine)
All four endpoints return the §2 fixtures behind `MOCK_MODE=1` (`mocks.py`).
**Accept:** `/form-teams` and `/rebalance` return valid contract-shaped JSON. *(This unblocks the frontend agent.)*

### Phase 2 — Data & seed
SQLModel models; `seed.py` generating **~48 realistic participants** with **deliberate redundant clusters** (e.g. several ai_ml-heavy people) and **availability mismatches** (some non-overlapping windows) so the optimizer has visible work. `GET/POST /api/participants` real; free-text `bio` parsed to structured fields.
**Accept:** seed populates 48; participants endpoint returns real data.

### Phase 3 — Engine
Implement §4–§6. Swap `MOCK_MODE` off for `/form-teams`; persist teams + scores + flags.
**Accept (tests/test_engine.py, no server):**
- Five identical-role members score **below** five complementary ones.
- A cohort with an unmeetable subset never yields a team under 120 min overlap.
- `form_teams(cohort)` places **100%** of participants exactly once.
- The solver's accepted step_log is **monotonically non-decreasing** in total score.

### Phase 4 — Rebalancer
`/api/rebalance` real (constrained mode). 
**Accept:** remove returns a `gap_flag` + `suggested_replacement_id`; accept returns the healed team with `gap_flag: null` and a higher score.

### Phase 5 — Hardening
A dev-only reseed path (so the demo can reset); loading of the local embedding model with graceful Jaccard fallback; error responses shaped as `{"detail": "..."}`.
**Accept:** app boots and serves a full form→rebalance cycle with no API keys set.

---

## 8. Coordination with the frontend agent

- The frontend builds against §2 from the start (via its own local mock if your server isn't up yet), so **your Phase 1 fixtures must match §2 exactly.**
- If anything in §2 ever needs to change, it must change in **both** specs and be communicated — no silent contract changes.
- Snake_case on the wire is non-negotiable; the frontend maps to its own casing internally.
