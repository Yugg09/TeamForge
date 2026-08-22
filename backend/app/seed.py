"""Synthetic cohort of 48 participants for the demo event.

Shaped so the optimizer has visible work:
  * a deliberate redundancy cluster — 15 ai_ml-primary people, far more than the
    number of teams — so a naive skill-sum ranker would stack them together and
    the skill_redundancy penalty has to break them apart;
  * three availability bands that barely overlap each other, so teams cannot be
    formed across bands without violating the 120 min/week hard constraint.

Generation is seeded, so the demo cohort is identical on every reseed.
"""

import random

from app.services.taxonomy import SKILLS, category_of

EVENT_ID = "demo"
COHORT_SIZE = 48
SEED = 20260822

FIRST_NAMES = [
    "Ada", "Ravi", "Mia", "Tomas", "Grace", "Yuki", "Noor", "Elias", "Priya", "Jonas",
    "Lena", "Omar", "Sofia", "Kai", "Amara", "Hugo", "Ines", "Diego", "Zara", "Felix",
    "Nadia", "Mateo", "Chloe", "Ibrahim", "Anya", "Tariq", "Freya", "Luca", "Ravneet", "Otto",
    "Simone", "Bilal", "Marta", "Jae", "Hana", "Viktor", "Rosa", "Ade", "Klara", "Nikhil",
    "Esme", "Dario", "Leila", "Sven", "Aiko", "Marco", "Tessa", "Kwame",
]
LAST_NAMES = [
    "Okafor", "Menon", "Lindqvist", "Rivera", "Amadi", "Tanaka", "Haddad", "Berg", "Shah", "Weber",
    "Novak", "Farouk", "Costa", "Nakamura", "Diallo", "Moreau", "Silva", "Castillo", "Ahmed", "Keller",
    "Petrov", "Alvarez", "Dubois", "Rahman", "Volkova", "Zaman", "Olsen", "Ferrari", "Sandhu", "Lang",
    "Rossi", "Chowdhury", "Kowalski", "Park", "Kimura", "Sokolov", "Mendes", "Balogun", "Horak", "Iyer",
    "Fontaine", "Greco", "Nasser", "Eriksen", "Sato", "Bianchi", "Visser", "Mensah",
]

# (primary role, count, core skills, flavour skills, interests)
ARCHETYPES: list[tuple[str, int, list[str], list[str], list[str]]] = [
    ("ai_ml", 15, ["pytorch", "nlp", "llm_apps"],
     ["python", "vector_search", "data_analysis", "computer_vision", "tensorflow", "statistics"],
     ["search", "healthcare", "creative tools", "education"]),
    ("backend", 10, ["python", "postgres", "rest_api"],
     ["go", "node", "redis", "graphql", "docker", "aws", "rust"],
     ["developer tools", "infrastructure", "fintech", "security"]),
    ("frontend", 9, ["react", "typescript", "css"],
     ["nextjs", "vue", "graphql", "flutter", "ui_design"],
     ["accessibility", "design systems", "creative tools", "gaming"]),
    ("design", 7, ["figma", "ui_design", "prototyping"],
     ["user_research", "motion_design", "css"],
     ["accessibility", "design systems", "creative tools", "education"]),
    ("product", 4, ["product_strategy", "roadmapping"],
     ["pitching", "user_research", "technical_writing"],
     ["fintech", "education", "social impact", "climate"]),
    ("devops", 2, ["docker", "kubernetes", "ci_cd"],
     ["aws", "terraform", "go"],
     ["infrastructure", "security", "developer tools"]),
    ("research", 1, ["literature_review", "experiment_design"],
     ["statistics", "nlp"],
     ["healthcare", "climate", "education"]),
]

# Three availability bands. Members inside a band overlap generously; across bands
# the overlap falls under the 120 min/week feasibility floor.
# (label, member_count, timezone_offset_min, band_start_utc, band_end_utc)
BANDS: list[tuple[str, int, int, int, int]] = [
    ("europe_afternoon", 28, 60, 780, 1260),
    ("americas_evening", 12, -300, 60, 480),
    ("apac_morning", 8, 480, 1170, 1439),
]

AMBITIONS = ["win", "win", "ship", "ship", "ship", "learn"]
WORK_STYLES = ["planner", "planner", "improviser"]
SYNC_PREFS = ["sync", "sync", "async"]

BIO_TEMPLATES = {
    "ai_ml": "ML engineer working on {focus}. {ambition_line} Comfortable with {tools}.",
    "backend": "Backend developer building {focus}. {ambition_line} Day to day I use {tools}.",
    "frontend": "Frontend developer focused on {focus}. {ambition_line} Mostly {tools}.",
    "design": "Product designer doing {focus}. {ambition_line} I work in {tools}.",
    "product": "Product person handling {focus}. {ambition_line} Strong on {tools}.",
    "devops": "Infrastructure engineer owning {focus}. {ambition_line} Tooling: {tools}.",
    "research": "Researcher studying {focus}. {ambition_line} Methods: {tools}.",
}

FOCUS = {
    "ai_ml": ["retrieval and ranking", "LLM applications", "multimodal models", "applied NLP"],
    "backend": ["APIs and data pipelines", "distributed services", "payments infrastructure"],
    "frontend": ["design systems", "data-heavy dashboards", "real-time interfaces"],
    "design": ["prototyping and user research", "interface systems", "end-to-end product design"],
    "product": ["discovery and roadmapping", "go-to-market and positioning"],
    "devops": ["deploys and observability", "container platforms"],
    "research": ["human-AI interaction", "evaluation methodology"],
}

AMBITION_LINE = {
    "win": "Here to win.",
    "ship": "Here to ship something real.",
    "learn": "New to hackathons and here to learn.",
}


def _availability(rng: random.Random, band_start: int, band_end: int) -> list[dict]:
    """Windows inside the member's band, jittered so overlap is imperfect.

    Everyone anchors on the weekend, which is what makes same-band teams feasible
    at all; a quarter of the cohort drops one anchor day, which is what makes
    availability a real discriminator between candidate teams rather than a
    constant. Weekday windows are extra slack the optimizer can find.
    """
    days = {5, 6}
    if rng.random() < 0.25:
        days.discard(rng.choice([5, 6]))
    days.update(rng.sample([0, 2, 3, 4], rng.randint(1, 2)))
    days = sorted(days)
    windows = []
    for day in days:
        start = band_start + rng.choice([0, 15, 30, 45])
        end = band_end - rng.choice([0, 15, 30, 45])
        if end - start < 150:  # keep every window comfortably above the floor
            start, end = band_start, band_end
        windows.append({"day": day, "start_utc": start, "end_utc": end})
    return windows


def _skills(rng: random.Random, core: list[str], flavour: list[str]) -> list[dict]:
    chosen = list(core)
    for extra in rng.sample(flavour, min(len(flavour), rng.randint(1, 2))):
        if extra not in chosen:
            chosen.append(extra)
    out = []
    for i, sid in enumerate(chosen):
        proficiency = rng.randint(3, 5) if i < len(core) else rng.randint(1, 3)
        out.append({"id": sid, "proficiency": proficiency, "verified": rng.random() < 0.3})
    return out


def build_cohort() -> list[dict]:
    """The 48-participant demo cohort as contract-shaped dicts."""
    rng = random.Random(SEED)

    roles: list[tuple[str, list[str], list[str], list[str]]] = []
    for role, count, core, flavour, interests in ARCHETYPES:
        roles.extend([(role, core, flavour, interests)] * count)
    assert len(roles) == COHORT_SIZE, f"archetypes sum to {len(roles)}, expected {COHORT_SIZE}"

    bands: list[tuple[int, int, int]] = []
    for _label, count, tz, start, end in BANDS:
        bands.extend([(tz, start, end)] * count)
    assert len(bands) == COHORT_SIZE

    # Shuffle band assignment so bands are not correlated with role blocks.
    rng.shuffle(bands)

    cohort: list[dict] = []
    for idx in range(COHORT_SIZE):
        role, core, flavour, interests = roles[idx]
        tz, band_start, band_end = bands[idx]
        skills = _skills(rng, core, flavour)
        ambition = rng.choice(AMBITIONS)
        chosen_interests = rng.sample(interests, min(len(interests), rng.randint(1, 3)))

        preferred = [role]
        # A third of people list a genuine secondary preference — the slack the
        # role matcher uses to cover gaps.
        secondary = sorted(
            {r for s in skills for r in SKILLS.get(s["id"], ("", ()))[1]} - {role}
        )
        if secondary and rng.random() < 0.35:
            preferred.append(rng.choice(secondary))

        bio = BIO_TEMPLATES[role].format(
            focus=rng.choice(FOCUS[role]),
            ambition_line=AMBITION_LINE[ambition],
            tools=", ".join(s["id"].replace("_", " ") for s in skills[:3]),
        )

        cohort.append({
            "id": f"p_{idx + 1:02d}",
            "name": f"{FIRST_NAMES[idx]} {LAST_NAMES[idx]}",
            "bio": bio,
            "timezone_offset_min": tz,
            "skills": skills,
            "preferred_roles": preferred,
            "interests": chosen_interests,
            "availability": _availability(rng, band_start, band_end),
            "ambition": ambition,
            "work_style": rng.choice(WORK_STYLES),
            "sync_pref": rng.choice(SYNC_PREFS),
        })
    return cohort


def seed_database(session, event_id: str = EVENT_ID, force: bool = False) -> int:
    """Insert the cohort. No-op if participants already exist unless force=True."""
    from sqlmodel import delete, select

    from app.models import ParticipantRow, StepLogRow, TeamRow

    existing = session.exec(
        select(ParticipantRow).where(ParticipantRow.event_id == event_id)
    ).all()
    if existing and not force:
        return len(existing)
    if force:
        for table in (StepLogRow, TeamRow, ParticipantRow):
            session.exec(delete(table).where(table.event_id == event_id))

    for row in build_cohort():
        session.add(ParticipantRow(event_id=event_id, **row))
    session.commit()
    return COHORT_SIZE


def category_mix(cohort: list[dict]) -> dict[str, int]:
    """Diagnostic: how many people hold a skill in each category."""
    counts: dict[str, int] = {}
    for p in cohort:
        for cat in {category_of(s["id"]) for s in p["skills"]}:
            counts[cat] = counts.get(cat, 0) + 1
    return dict(sorted(counts.items(), key=lambda kv: -kv[1]))
