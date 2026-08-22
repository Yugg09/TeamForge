# TeamForge — FRONTEND Build Spec

**Hand this file directly to your coding agent.** It builds the React frontend for TeamForge, an intelligent hackathon team-formation platform that partitions a cohort of participants into *balanced* teams and lets a human rebalance them. The backend is built separately by another agent from a companion `BACKEND Build Spec`. The two connect **only** through the API contract in §2 — that block is identical in both specs and must not be altered.

---

## 0. Instructions to the agent

Read the whole file first. Rules:

1. **The product composes balanced teams, it doesn't rank people.** The UI's job is to make *team quality* legible — coverage, complementarity, availability, and gaps — not to show a leaderboard of individuals. The emotional peak of the app is the **Rebalancer** (§5): remove a key member, a gap flashes red, the system suggests a replacement, the team heals live.
2. **§2 is the frozen contract.** It is byte-identical in the backend spec. Never rename a field or change a shape when calling the API. The wire format is **snake_case**; map to your own casing inside the app if you like, but send/expect snake_case on the network.
3. **Build against a local mock from hour one (§3).** Do not wait for the backend. Ship a mock layer returning the exact §2 fixtures so every page works immediately; flip to the real API by changing one base URL.
4. **No browser storage** for app state — keep everything in React state (`useState`/`useReducer`/TanStack Query cache). No `localStorage`/`sessionStorage`.
5. Build in phase order (§7). Each phase has acceptance criteria.
6. Make it **look intentional** (§6). This is a hackathon demo; visual polish is scored.

---

## 1. Stack (fixed)

React · Vite · TypeScript (strict) · Tailwind CSS · shadcn/ui · React Router · TanStack Query · Recharts. Auth is **faked** — an identity switcher in the header, no login pages. Dev server proxies `/api/*` to the backend at `:8000` (configured in `vite.config.ts`), so there's no CORS in dev.

---

## 2. ▓▓▓ FROZEN API CONTRACT — IDENTICAL IN THE BACKEND SPEC — DO NOT MODIFY ▓▓▓

Four MVP endpoints. Wire format is **snake_case JSON**. The backend mirrors these exact shapes in Pydantic.

```text
GET  /api/participants     → 200 { "participants": Participant[] }
POST /api/participants     ← ParticipantIn                → 201 Participant
POST /api/form-teams       ← FormTeamsRequest             → 200 FormTeamsResponse
POST /api/rebalance        ← RebalanceRequest             → 200 RebalanceResponse
GET  /api/health           → 200 { "status": "ok" }
```

### Types (TypeScript — mirror of the backend's Pydantic; keep field names snake_case on the wire)

```ts
export type RoleId = "frontend" | "backend" | "ai_ml" | "design" | "product" | "research" | "devops";
export type Ambition = "win" | "ship" | "learn";

export interface Skill { id: string; proficiency: 1|2|3|4|5; verified: boolean }

export interface AvailabilityWindow { day: 0|1|2|3|4|5|6; start_utc: number; end_utc: number } // minutes 0..1439 UTC

export interface ParticipantIn {
  name: string;
  bio?: string;                       // free text; backend parses to structured fields
  timezone_offset_min?: number;
  skills?: Skill[];
  preferred_roles?: RoleId[];
  interests?: string[];
  availability?: AvailabilityWindow[];
  ambition?: Ambition;
  work_style?: "planner" | "improviser";
  sync_pref?: "sync" | "async";
}
export interface Participant extends ParticipantIn { id: string }

export interface TeamScoreTerms {
  coverage: number; complementarity: number; availability_overlap: number;
  goal_alignment: number; style_fit: number; interest_fit: number;   // each 0..1
}
export interface TeamScorePenalties {
  skill_redundancy: number; role_gaps: number; availability_starvation: number;
}
export type RiskFlag =
  | { kind: "missing_role"; payload: { role: RoleId } }
  | { kind: "single_point_of_failure"; payload: { skill: string; member_id: string } }
  | { kind: "availability_gap"; payload: { overlap_minutes: number } }
  | { kind: "goal_mismatch"; payload: { outlier_id: string } };

export interface TeamScore {
  total: number;                      // 0..1 — display as ×100
  terms: TeamScoreTerms;
  penalties: TeamScorePenalties;
  flags: RiskFlag[];
}
export interface Team {
  id: string;
  member_ids: string[];
  role_assignments: Record<string, RoleId>;   // member_id → role
  score: TeamScore;
}
export interface StepLogEntry { op: "seed"|"swap"|"move"; teams_touched: string[]; total_score: number }

export interface FormTeamsRequest { event_id?: string; min_size?: number; max_size?: number }
export interface FormTeamsResponse { teams: Team[]; step_log: StepLogEntry[]; fairness_ok: boolean }

export interface RebalanceRequest {
  team_id: string; remove_member_id?: string; accept_replacement_id?: string;
}
export interface RebalanceResponse {
  team: Team; gap_flag: RiskFlag | null; suggested_replacement_id: string | null;
  score_before: number; score_after: number;
}
```

### Canonical JSON examples (use these exact shapes as your mock fixtures)

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

## 3. API layer & the local mock (build unblocked)

```text
src/api/
├── client.ts          # fetch wrapper; base = import.meta.env.VITE_API_BASE_URL || "/api"
├── types.ts           # the TS types from §2
├── mock.ts            # returns the §2 fixtures + a synthetic 48-participant cohort
├── useParticipants.ts # TanStack Query: list + create
├── useFormTeams.ts    # mutation → FormTeamsResponse
└── useRebalance.ts    # mutation → RebalanceResponse (remove & accept)
```

- A single flag (`VITE_USE_MOCK=1`) routes all calls through `mock.ts`, which returns the §2 shapes with realistic latency. Every page must work fully in mock mode.
- Generate a plausible **48-participant** mock cohort (varied roles, ambitions, timezones) so lists and the dashboard look real in the demo even before the backend is wired.
- Flip to the real backend by setting `VITE_USE_MOCK=0`; no other code changes.

---

## 4. Pages & routes

```text
/                  Landing      — one-line pitch, "Enter demo" CTA
/dashboard         Dashboard    — cohort overview: role distribution, fairness banner, per-team health
/participants      Participants — cohort list + free-text intake panel
/participants/:id  Profile      — skills (with proficiency), availability (local + UTC), prefs
/teams             Teams        — the formed teams; the "Form teams" action + score-climb
/teams/:id         Team detail  — members with roles, score breakdown, radar, "why this team", rebalancer entry
/rebalance/:id     Rebalancer   — remove → gap → suggest → heal (may be embedded in Team detail)
```

Header has an **identity switcher** (pick "acting as" participant) instead of login. Phase-2 routes (`/teams/compare`, `/organizer`) are stubs.

### What each page renders from which endpoint
- **Participants** → `GET /api/participants`; intake panel → `POST /api/participants` (a name + free-text bio is enough; show the structured fields the backend returns).
- **Teams** → a "Form teams" button calls `POST /api/form-teams`; on response, animate the **score-climb** from `step_log`, then render team cards.
- **Team detail** → uses the `Team` from the form-teams response; renders score breakdown, radar, flags, explanation.
- **Rebalancer** → `POST /api/rebalance` with `remove_member_id`, then (on accept) with `accept_replacement_id`.

---

## 5. Key components

- **TeamCard** — team name, member chips with assigned role, a big score (`total×100`), and a one-line health summary. A flagged gap shows a subtle warning pip.
- **ScoreBreakdown** — horizontal bars for each of the six `terms` (0..1 ×100) and the three `penalties` shown as deductions. This is how the app proves it's not a skill-sum ranker — the named terms must be visible and labeled.
- **SkillRadar** (Recharts RadarChart) — coverage across role axes (frontend, backend, ai_ml, design, product, research, devops); a low axis = a gap. On a flagged gap, highlight the axis.
- **RiskFlags** — render `flags[]` as small labeled badges: "Missing role: backend", "Single point of failure: React (Riya)", "Low availability overlap", "Goal mismatch".
- **WhyThisTeam** — a plain-language explanation list derived from the top terms and any flags (e.g. ✓ Strong coverage, ✓ 11h/week overlap, ⚠ No product owner). If the backend returns prose, show it; otherwise derive it from the score object.
- **ScoreClimb** — an animated counter + a small line/step chart that plays the `step_log` (seed → swap → move …) so the score visibly *improves*. This is the "optimization" moment; make it satisfying (~1.5–2s).
- **Rebalancer** — the centerpiece interaction (§below).

### The Rebalancer interaction (the demo's climax — make it excellent)
1. On a team detail view, each member has a "remove" affordance.
2. Removing a member calls `/api/rebalance` with `remove_member_id`. When `gap_flag` returns, the affected role **flashes red** on the card and the radar axis dips; show "Missing: {role}" and the score dropping (`score_before` → `score_after`).
3. Show the **suggested replacement** (`suggested_replacement_id`) as a candidate card with an "Add" button.
4. Accepting calls `/api/rebalance` with `accept_replacement_id`; the member slots in, the gap clears, and the score animates back up (`score_before` → `score_after`). The red state resolves to green.

Keep this flow to a few seconds and visually obvious — a judge should understand the whole product from this one interaction.

---

## 6. Design direction (polish is scored)

- **One confident aesthetic, applied consistently.** Pick a restrained palette (one strong accent for the score/optimize moments, muted neutrals elsewhere) and a single type scale. Avoid the default-shadcn-everywhere look — set intentional spacing, a distinctive heading treatment, and consistent card styling.
- **Numbers are the hero.** Team scores, term bars, and the radar are the content — give them room and clear labels. Don't bury them in chrome.
- **Motion with meaning.** Animate only things that represent change: the score-climb during optimization, the gap flash and heal during rebalancing. No gratuitous transitions.
- **States are not optional.** Every data view has a loading skeleton, an empty state, and an error state (`{ detail }` from the API). A demo that shows a spinner forever loses.
- Fully responsive; the demo may be shown on a laptop or projected.

---

## 7. Phases & acceptance

### Phase 0 — Scaffold
Vite + React + TS strict + Tailwind + shadcn + Router + TanStack Query; `vite.config.ts` proxy `/api`→`:8000`; the `src/api` layer with `mock.ts` and `VITE_USE_MOCK`.
**Accept:** app runs in mock mode; a page reads `/api/health` (mock returns `{"status":"ok"}`).

### Phase 1 — Cohort & intake
Participants list + profile detail + free-text intake, all against the mock cohort.
**Accept:** a participant can be added from a name + bio and appears in the list with structured fields.

### Phase 2 — Teams & score legibility
"Form teams" → ScoreClimb animation → team cards → team detail with **ScoreBreakdown**, **SkillRadar**, **RiskFlags**, **WhyThisTeam**.
**Accept:** every team shows its six named term bars, the radar, any flags, and a legible explanation — all driven by the `TeamScore` object.

### Phase 3 — Rebalancer (centerpiece)
The full remove → gap flash → suggested replacement → accept → heal flow (§5).
**Accept:** the loop runs end to end against the mock, with the score visibly dropping then recovering and the gap flashing then clearing.

### Phase 4 — Dashboard & polish
Cohort dashboard (role distribution, fairness banner, per-team health); loading/empty/error states everywhere; responsive pass; a "reset demo" affordance.
**Accept:** cold run through Landing → Form teams → Team detail → Rebalance in under 3 minutes with no dead ends.

### Phase 5 — Real backend
Set `VITE_USE_MOCK=0`; verify every view against the live API.
**Accept:** all views work unchanged against the real backend because the shapes match §2.

---

## 8. Coordination with the backend agent

- You build against §2 fixtures via the mock, so when the backend ships, integration is a base-URL flip — provided **nobody changed §2**.
- If §2 ever needs to change, it changes in **both** specs and is communicated — no silent contract changes.
- Snake_case on the wire; the backend expects exactly the field names in §2.
