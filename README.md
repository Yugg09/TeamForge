# TeamForge

> **Build better teams, not just bigger teams.**

An intelligent team-formation platform that partitions a cohort of participants into **balanced teams** — optimizing for complementary skills, role coverage, real availability overlap, goal alignment, and individual preferences — then explains every team and lets a human rebalance it.

TeamForge treats team formation as a **global optimization problem**, not a candidate search. The core differentiator: *we don't find the best individuals, we find the best combination.*

---

## Why TeamForge?

Most tools rank individuals by skill level. That gives you a team of four AI engineers — high individual scores, zero coverage. TeamForge asks a different question:

> **Which combination of people will work best together for this specific context?**

| Naive Top-Skills | TeamForge |
|---|---|
| 4× AI Engineer | 1× AI Engineer |
| High individual scores | 1× Backend Developer |
| Missing frontend, design | 1× Frontend Developer |
| | 1× UI/UX Designer |
| | Lower individual scores, strong coverage + complementarity |

TeamForge scores the balanced team **above** the stacked team — because the objective penalizes redundancy and rewards coverage.

---

## Features

- **Cohort Partitioning** — partitions all participants into balanced teams, nobody left out
- **Multi-Factor Scoring** — coverage, complementarity, availability overlap, goal alignment, style fit, and interest fit, minus redundancy and gap penalties
- **Skill Gap Detection** — surfaces missing roles and single points of failure per team
- **Explainable AI** — plain-language explanation of why each team was formed
- **Live Rebalancer** — remove a member, see the gap flash, accept a suggested replacement, watch the team heal
- **Fairness Guarantee** — everyone is placed, every team is viable
- **Availability as a Hard Constraint** — teams that can't meet are rejected, not merely lower-scored
- **Score Climb Animation** — watch the optimizer improve teams in real time

---

## Architecture

```
┌─────────────────────────┐         ┌─────────────────────────┐
│   React + Vite (UI)     │  HTTP   │   FastAPI (API)         │
│                         │◄───────►│                         │
│  • Team cards & radar   │  JSON   │  • Participant CRUD     │
│  • Score breakdown      │         │  • Form teams           │
│  • Rebalancer           │         │  • Rebalance            │
│  • Score climb anim     │         │                         │
└─────────────────────────┘         └────────────┬────────────┘
                                                 │
                                     ┌───────────▼───────────┐
                                     │   Matching Engine     │
                                     │   (Pure Python)       │
                                     │                       │
                                     │  • Objective function │
                                     │  • OR-Tools CP-SAT    │
                                     │  • Local search       │
                                     │  • NetworkX roles     │
                                     └───────────────────────┘
```

**Key design rule:** The matching engine is pure Python — no FastAPI or database imports — making it fully unit-testable in isolation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Recharts |
| Backend | FastAPI, Pydantic, SQLModel, PostgreSQL |
| Engine | OR-Tools (CP-SAT), NetworkX, NumPy, SciPy, sentence-transformers (local) |
| DevOps | Docker Compose (PostgreSQL), Vite dev proxy |

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Docker (for PostgreSQL)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Start PostgreSQL
docker compose up -d

# Set environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL

# Seed the database with ~48 synthetic participants
python -m app.seed

# Start the server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api to :8000)
npm run dev
```

The app is available at `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/participants` | List all participants |
| `POST` | `/api/participants` | Add a participant (free-text bio is parsed automatically) |
| `POST` | `/api/form-teams` | Partition the cohort into balanced teams |
| `POST` | `/api/rebalance` | Remove/replace a team member and see the score change |
| `GET` | `/api/health` | Health check |

---

## How the Engine Works

### Objective Function

A team's score is a weighted sum of positive terms minus penalties, normalized to `[0, 1]`:

```
score = coverage + complementarity + availability + goals + style + interest
      − redundancy_penalty − role_gap_penalty − starvation_penalty
```

The **skill redundancy penalty** is the critical line — it prevents five identical experts from outscoring a balanced team.

### Solver Pipeline

1. **Preprocess** — resolve skills to roles, build availability sets, attach similarity scores
2. **Solve** — OR-Tools CP-SAT partition maximizing the global objective under hard constraints, with a fallback to greedy seed + local search
3. **Optimize** — accept only moves that improve the global total score
4. **Explain** — decompose each team's score into plain language

### Hard Constraints

- Team size within `[3, 5]`
- Shared availability ≥ 120 min/week
- No participant on two teams
- Every participant placed exactly once

---

## Demo Flow

1. **Set the trap** — show naive top-skills grouping producing a stacked, unbalanced team
2. **Form teams** — one click, watch the score animate upward as the optimizer improves
3. **Open a team** — view coverage radar, score breakdown, and plain-language explanation
4. **Rebalance** — remove a key member → gap flashes red → accept suggested replacement → team heals live
5. **Show fairness** — dashboard shows everyone placed, no team non-viable

---

## Project Structure

```
teamforge/
├── README.md
├── PROJECT-MASTER.md          # Source of truth for architecture & planning
├── backend/
│   ├── BACKEND-SPEC.md        # Backend build specification
│   ├── docker-compose.yml
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py
│   │   ├── api/               # REST endpoints
│   │   ├── engine/            # Pure Python matching engine
│   │   └── services/          # Embeddings, availability, taxonomy
│   └── tests/
└── frontend/
    ├── FRONTEND-SPEC.md       # Frontend build specification
    ├── vite.config.ts
    └── src/
        ├── api/               # Client, types, mock, hooks
        ├── pages/             # Landing, Dashboard, Participants, Teams
        └── components/        # TeamCard, ScoreBreakdown, SkillRadar, etc.
```

---

## Environment Variables

### Frontend

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |
| `VITE_USE_MOCK` | `0` | Set to `1` to use local mock data |

### Backend

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `MOCK_MODE` | No | Set to `1` to return mock fixtures |
| `LLM_API_KEY` | No | Only needed for Phase 2+ prose explanations |
| `EMBEDDING_API_KEY` | No | Only needed for Phase 2+ hosted embeddings |

---

## Development Workflow

- **Branches:** `main` (stable) ← `dev` ← `feature/*`
- **Commits:** Conventional format — `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- **Contract:** The API contract is frozen and shared between frontend and backend — no silent breaking changes

---

## Roadmap

### Phase 1 — MVP
Participant profiles · free-text intake (LLM) · cohort partition · team scoring with named-term breakdown · skill coverage & gap visualization · risk flags · explainable recommendations · fairness guarantee

### Phase 2 — Enhancement
Live rebalancer · alternative team options · project-anchored forming · pgvector semantic search · working-style compatibility depth

### Phase 3 — Advanced
Team risk prediction · health scoring · team evolution tracking · organizer multi-team dashboard · GitHub skill verification

---

## License

MIT
