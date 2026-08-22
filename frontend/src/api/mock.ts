import type {
  FormTeamsRequest,
  FormTeamsResponse,
  Participant,
  ParticipantIn,
  RebalanceRequest,
  RebalanceResponse,
  RoleId,
  Team,
  TeamScore,
} from "./types";

const MOCK_LATENCY_MIN_MS = 280;
const MOCK_LATENCY_MAX_MS = 520;

/** Canonical §2 fixtures */
const CANONICAL_TEAM_1: Team = {
  id: "team_1",
  member_ids: ["p_04", "p_11", "p_23", "p_39"],
  role_assignments: {
    p_04: "backend",
    p_11: "frontend",
    p_23: "ai_ml",
    p_39: "design",
  },
  score: {
    total: 0.84,
    terms: {
      coverage: 0.92,
      complementarity: 0.8,
      availability_overlap: 0.78,
      goal_alignment: 1.0,
      style_fit: 0.66,
      interest_fit: 0.71,
    },
    penalties: {
      skill_redundancy: 0.05,
      role_gaps: 0.0,
      availability_starvation: 0.0,
    },
    flags: [{ kind: "missing_role", payload: { role: "product" } }],
  },
};

const CANONICAL_STEP_LOG: FormTeamsResponse["step_log"] = [
  { op: "seed", teams_touched: ["team_1"], total_score: 0.61 },
  { op: "swap", teams_touched: ["team_1", "team_2"], total_score: 0.73 },
  { op: "move", teams_touched: ["team_1"], total_score: 0.84 },
];

const REBALANCE_REMOVE_RESPONSE: RebalanceResponse = {
  team: {
    id: "team_1",
    member_ids: ["p_11", "p_23", "p_39"],
    role_assignments: {
      p_11: "frontend",
      p_23: "ai_ml",
      p_39: "design",
    },
    score: {
      total: 0.71,
      terms: {
        coverage: 0.75,
        complementarity: 0.7,
        availability_overlap: 0.78,
        goal_alignment: 1.0,
        style_fit: 0.66,
        interest_fit: 0.71,
      },
      penalties: {
        skill_redundancy: 0.05,
        role_gaps: 0.3,
        availability_starvation: 0.0,
      },
      flags: [{ kind: "missing_role", payload: { role: "backend" } }],
    },
  },
  gap_flag: { kind: "missing_role", payload: { role: "backend" } },
  suggested_replacement_id: "p_47",
  score_before: 0.84,
  score_after: 0.71,
};

const REBALANCE_ACCEPT_RESPONSE: RebalanceResponse = {
  team: {
    id: "team_1",
    member_ids: ["p_11", "p_23", "p_39", "p_47"],
    role_assignments: {
      p_11: "frontend",
      p_23: "ai_ml",
      p_39: "design",
      p_47: "backend",
    },
    score: {
      total: 0.86,
      terms: {
        coverage: 0.92,
        complementarity: 0.82,
        availability_overlap: 0.79,
        goal_alignment: 1.0,
        style_fit: 0.66,
        interest_fit: 0.7,
      },
      penalties: {
        skill_redundancy: 0.05,
        role_gaps: 0.0,
        availability_starvation: 0.0,
      },
      flags: [],
    },
  },
  gap_flag: null,
  suggested_replacement_id: null,
  score_before: 0.71,
  score_after: 0.86,
};

const FIRST_NAMES = [
  "Alex",
  "Riya",
  "Marcus",
  "Sofia",
  "Jordan",
  "Priya",
  "Ethan",
  "Nina",
  "Liam",
  "Aisha",
  "Noah",
  "Chloe",
  "Omar",
  "Elena",
  "Kai",
  "Maya",
  "Leo",
  "Zara",
  "Felix",
  "Anya",
  "Diego",
  "Hana",
  "Theo",
  "Iris",
  "Raj",
  "Lucia",
  "Sam",
  "Yuki",
  "Miles",
  "Freya",
  "Jonah",
  "Cleo",
  "Andre",
  "Ines",
  "Viktor",
  "Tara",
  "Ben",
  "Lina",
  "Cole",
  "Mira",
  "Hugo",
  "Sana",
  "Evan",
  "Nadia",
  "Quinn",
  "Rosa",
  "Ian",
  "Vera",
];

const ROLE_CYCLE: RoleId[] = [
  "frontend",
  "backend",
  "ai_ml",
  "design",
  "product",
  "research",
  "devops",
];

const SKILL_BY_ROLE: Record<RoleId, string> = {
  frontend: "react",
  backend: "python",
  ai_ml: "pytorch",
  design: "figma",
  product: "ui_ux",
  research: "python",
  devops: "docker",
};

const AMBITIONS: Array<"win" | "ship" | "learn"> = ["win", "ship", "learn"];
const WORK_STYLES: Array<"planner" | "improviser"> = ["planner", "improviser"];
const SYNC_PREFS: Array<"sync" | "async"> = ["sync", "async"];
const TIMEZONE_OFFSETS = [0, -300, -480, 330, 60, -240, 120];

let participants: Participant[] = generateMockCohort(48);
let formedTeams: FormTeamsResponse | null = null;
let teamOverrides: Record<string, Team> = {};

function mockDelay(): Promise<void> {
  const ms =
    MOCK_LATENCY_MIN_MS +
    Math.floor(Math.random() * (MOCK_LATENCY_MAX_MS - MOCK_LATENCY_MIN_MS));
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function participantId(index: number): string {
  return `p_${String(index + 1).padStart(2, "0")}`;
}

function generateAvailability(seed: number): Participant["availability"] {
  const day = (seed % 5) + 1;
  const start = 540 + (seed % 3) * 60;
  return [
    { day: day as 0 | 1 | 2 | 3 | 4 | 5 | 6, start_utc: start, end_utc: start + 180 },
    {
      day: ((day + 2) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      start_utc: start + 60,
      end_utc: start + 240,
    },
  ];
}

function generateMockCohort(count: number): Participant[] {
  return Array.from({ length: count }, (_, index) => {
    const id = participantId(index);
    const role = ROLE_CYCLE[index % ROLE_CYCLE.length];
    const skillId = SKILL_BY_ROLE[role];
    const ambition = AMBITIONS[index % AMBITIONS.length];
    const work_style = WORK_STYLES[index % WORK_STYLES.length];
    const sync_pref = SYNC_PREFS[index % SYNC_PREFS.length];
    const timezone_offset_min = TIMEZONE_OFFSETS[index % TIMEZONE_OFFSETS.length];
    const proficiency = ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5;

    const participant: Participant = {
      id,
      name: `${FIRST_NAMES[index % FIRST_NAMES.length]} ${String.fromCharCode(65 + (index % 26))}.`,
      bio: `${ROLE_CYCLE[index % ROLE_CYCLE.length]} builder — ${ambition} mindset, ${work_style} style.`,
      timezone_offset_min,
      skills: [
        { id: skillId, proficiency, verified: index % 3 === 0 },
        {
          id: index % 2 === 0 ? "typescript" : "javascript",
          proficiency: ((proficiency + 1) % 5 || 1) as 1 | 2 | 3 | 4 | 5,
          verified: false,
        },
      ],
      preferred_roles: [role, ROLE_CYCLE[(index + 1) % ROLE_CYCLE.length]],
      interests: ["hackathons", index % 2 === 0 ? "open source" : "startups"],
      availability: generateAvailability(index),
      ambition,
      work_style,
      sync_pref,
    };

    if (id === "p_04") {
      participant.name = "Alex Chen";
      participant.bio = "Backend engineer — Python/FastAPI, ships reliable APIs.";
      participant.preferred_roles = ["backend", "devops"];
      participant.skills = [
        { id: "python", proficiency: 5, verified: true },
        { id: "fastapi", proficiency: 4, verified: true },
        { id: "postgres", proficiency: 4, verified: false },
      ];
    }

    if (id === "p_11") {
      participant.name = "Riya Patel";
      participant.bio = "Frontend lead — React, TypeScript, design systems.";
      participant.preferred_roles = ["frontend"];
      participant.skills = [
        { id: "react", proficiency: 5, verified: true },
        { id: "typescript", proficiency: 5, verified: true },
        { id: "css", proficiency: 4, verified: false },
      ];
    }

    if (id === "p_23") {
      participant.name = "Marcus Okonkwo";
      participant.bio = "ML engineer — PyTorch, NLP, experiment design.";
      participant.preferred_roles = ["ai_ml", "research"];
      participant.skills = [
        { id: "pytorch", proficiency: 5, verified: true },
        { id: "python", proficiency: 4, verified: true },
      ];
    }

    if (id === "p_39") {
      participant.name = "Sofia Alvarez";
      participant.bio = "Product designer — Figma, user research, UI polish.";
      participant.preferred_roles = ["design", "product"];
      participant.skills = [
        { id: "figma", proficiency: 5, verified: true },
        { id: "ui_ux", proficiency: 4, verified: true },
      ];
    }

    if (id === "p_47") {
      participant.name = "Jordan Kim";
      participant.bio = "Backend generalist — APIs, databases, DevOps basics.";
      participant.preferred_roles = ["backend", "devops"];
      participant.skills = [
        { id: "python", proficiency: 4, verified: true },
        { id: "fastapi", proficiency: 4, verified: false },
        { id: "docker", proficiency: 3, verified: false },
      ];
    }

    return participant;
  });
}

function syntheticTeamScore(memberCount: number, roleCount: number): TeamScore {
  const coverage = Math.min(0.95, 0.55 + roleCount * 0.08);
  const complementarity = Math.min(0.9, 0.5 + memberCount * 0.06);
  const total = Math.min(
    0.92,
    coverage * 0.35 + complementarity * 0.25 + 0.4,
  );
  const flags: TeamScore["flags"] = [];
  if (roleCount < 4) {
    flags.push({ kind: "missing_role", payload: { role: "product" } });
  }
  return {
    total,
    terms: {
      coverage,
      complementarity,
      availability_overlap: 0.65 + (memberCount % 3) * 0.05,
      goal_alignment: 0.85 + (memberCount % 2) * 0.1,
      style_fit: 0.6 + (roleCount % 3) * 0.05,
      interest_fit: 0.62 + (memberCount % 4) * 0.04,
    },
    penalties: {
      skill_redundancy: roleCount > 5 ? 0.08 : 0.04,
      role_gaps: roleCount < 4 ? 0.12 : 0.02,
      availability_starvation: 0,
    },
    flags,
  };
}

function buildSyntheticTeam(teamId: string, members: Participant[]): Team {
  const role_assignments: Record<string, RoleId> = {};
  members.forEach((member, index) => {
    const role =
      member.preferred_roles?.[0] ?? ROLE_CYCLE[index % ROLE_CYCLE.length];
    role_assignments[member.id] = role;
  });
  const roleCount = new Set(Object.values(role_assignments)).size;
  return {
    id: teamId,
    member_ids: members.map((m) => m.id),
    role_assignments,
    score: syntheticTeamScore(members.length, roleCount),
  };
}

function getTeamById(teamId: string): Team | undefined {
  const overridden = teamOverrides[teamId];
  if (overridden) return overridden;
  if (!formedTeams) return undefined;
  return formedTeams.teams.find((team) => team.id === teamId);
}

function partitionCohort(request: FormTeamsRequest): FormTeamsResponse {
  const minSize = request.min_size ?? 3;
  const maxSize = request.max_size ?? 5;
  const canonicalIds = new Set(CANONICAL_TEAM_1.member_ids);
  const remaining = participants.filter((p) => !canonicalIds.has(p.id));

  const teams: Team[] = [structuredClone(CANONICAL_TEAM_1)];
  let teamIndex = 2;
  let cursor = 0;

  while (cursor < remaining.length) {
    const size = Math.min(
      maxSize,
      Math.max(minSize, remaining.length - cursor >= minSize ? maxSize : remaining.length - cursor),
    );
    if (remaining.length - cursor < minSize && teams.length > 0) {
      const last = teams[teams.length - 1];
      const extra = remaining.slice(cursor);
      last.member_ids.push(...extra.map((p) => p.id));
      extra.forEach((member, idx) => {
        const role =
          member.preferred_roles?.[0] ??
          ROLE_CYCLE[(last.member_ids.length + idx) % ROLE_CYCLE.length];
        last.role_assignments[member.id] = role;
      });
      const roleCount = new Set(Object.values(last.role_assignments)).size;
      last.score = syntheticTeamScore(last.member_ids.length, roleCount);
      break;
    }

    const chunk = remaining.slice(cursor, cursor + size);
    if (chunk.length === 0) break;
    teams.push(buildSyntheticTeam(`team_${teamIndex}`, chunk));
    teamIndex += 1;
    cursor += size;
  }

  teamOverrides = {};
  for (const team of teams) {
    teamOverrides[team.id] = structuredClone(team);
  }

  return {
    teams,
    step_log: CANONICAL_STEP_LOG,
    fairness_ok: true,
  };
}

function parseBioToStructured(body: ParticipantIn): ParticipantIn {
  const bio = body.bio?.toLowerCase() ?? "";
  const enriched: ParticipantIn = { ...body };

  if (!enriched.skills?.length) {
    const skills: ParticipantIn["skills"] = [];
    if (bio.includes("react") || bio.includes("frontend")) {
      skills.push({ id: "react", proficiency: 3, verified: false });
    }
    if (bio.includes("python") || bio.includes("backend")) {
      skills.push({ id: "python", proficiency: 3, verified: false });
    }
    if (bio.includes("design") || bio.includes("figma")) {
      skills.push({ id: "figma", proficiency: 3, verified: false });
    }
    if (bio.includes("ml") || bio.includes("pytorch")) {
      skills.push({ id: "pytorch", proficiency: 3, verified: false });
    }
    if (skills.length > 0) enriched.skills = skills;
  }

  if (!enriched.preferred_roles?.length) {
    if (bio.includes("frontend")) enriched.preferred_roles = ["frontend"];
    else if (bio.includes("backend")) enriched.preferred_roles = ["backend"];
    else if (bio.includes("design")) enriched.preferred_roles = ["design"];
    else if (bio.includes("product")) enriched.preferred_roles = ["product"];
  }

  if (!enriched.ambition) {
    if (bio.includes("win")) enriched.ambition = "win";
    else if (bio.includes("learn")) enriched.ambition = "learn";
    else enriched.ambition = "ship";
  }

  if (!enriched.availability?.length) {
    enriched.availability = generateAvailability(participants.length);
  }

  if (enriched.timezone_offset_min === undefined) {
    enriched.timezone_offset_min = TIMEZONE_OFFSETS[participants.length % TIMEZONE_OFFSETS.length];
  }

  return enriched;
}

export function resetMockState(): void {
  participants = generateMockCohort(48);
  formedTeams = null;
  teamOverrides = {};
}

export async function mockApiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  await mockDelay();

  const method = (options.method ?? "GET").toUpperCase();
  const normalized = path.replace(/^\/api/, "").split("?")[0];

  if (normalized === "/health" && method === "GET") {
    return { status: "ok" } as T;
  }

  if (normalized === "/participants" && method === "GET") {
    return { participants } as T;
  }

  if (normalized === "/participants" && method === "POST") {
    const body = JSON.parse(options.body as string) as ParticipantIn;
    const enriched = parseBioToStructured(body);
    const created: Participant = {
      ...enriched,
      id: `p_${String(participants.length + 1).padStart(2, "0")}`,
    };
    participants = [...participants, created];
    return created as T;
  }

  if (normalized === "/form-teams" && method === "POST") {
    const body = JSON.parse(options.body as string) as FormTeamsRequest;
    formedTeams = partitionCohort(body);
    return formedTeams as T;
  }

  if (normalized === "/rebalance" && method === "POST") {
    const body = JSON.parse(options.body as string) as RebalanceRequest;
    const teamId = body.team_id;

    if (body.remove_member_id && teamId === "team_1" && body.remove_member_id === "p_04") {
      const response = structuredClone(REBALANCE_REMOVE_RESPONSE);
      teamOverrides[teamId] = structuredClone(response.team);
      if (formedTeams) {
        formedTeams = {
          ...formedTeams,
          teams: formedTeams.teams.map((t) =>
            t.id === teamId ? structuredClone(response.team) : t,
          ),
        };
      }
      return response as T;
    }

    if (body.accept_replacement_id && teamId === "team_1" && body.accept_replacement_id === "p_47") {
      const response = structuredClone(REBALANCE_ACCEPT_RESPONSE);
      teamOverrides[teamId] = structuredClone(response.team);
      if (formedTeams) {
        formedTeams = {
          ...formedTeams,
          teams: formedTeams.teams.map((t) =>
            t.id === teamId ? structuredClone(response.team) : t,
          ),
        };
      }
      return response as T;
    }

    const current = getTeamById(teamId);
    if (!current) {
      throw new Error("Team not found");
    }

    if (body.remove_member_id) {
      const memberId = body.remove_member_id;
      const scoreBefore = current.score.total;
      const member_ids = current.member_ids.filter((id) => id !== memberId);
      const role_assignments = { ...current.role_assignments };
      const removedRole = role_assignments[memberId];
      delete role_assignments[memberId];

      const flags = [...current.score.flags];
      let gap_flag: RebalanceResponse["gap_flag"] = null;
      if (removedRole) {
        gap_flag = { kind: "missing_role", payload: { role: removedRole } };
        flags.push(gap_flag);
      }

      const roleCount = new Set(Object.values(role_assignments)).size;
      const score = syntheticTeamScore(member_ids.length, roleCount);
      score.total = Math.max(0.45, scoreBefore - 0.12);
      score.penalties.role_gaps = 0.25;
      score.flags = flags;

      const replacement = participants.find(
        (p) =>
          !member_ids.includes(p.id) &&
          p.preferred_roles?.includes(removedRole ?? "backend"),
      );

      const team: Team = {
        id: teamId,
        member_ids,
        role_assignments,
        score,
      };
      teamOverrides[teamId] = team;

      const response: RebalanceResponse = {
        team,
        gap_flag,
        suggested_replacement_id: replacement?.id ?? null,
        score_before: scoreBefore,
        score_after: score.total,
      };
      return response as T;
    }

    if (body.accept_replacement_id) {
      const replacementId = body.accept_replacement_id;
      const scoreBefore = current.score.total;
      const member_ids = [...current.member_ids, replacementId];
      const role_assignments = { ...current.role_assignments };
      const replacement = participants.find((p) => p.id === replacementId);
      const missingFlag = current.score.flags.find(
        (f) => f.kind === "missing_role",
      );
      const gapRole =
        missingFlag?.kind === "missing_role" ? missingFlag.payload.role : undefined;
      const role =
        replacement?.preferred_roles?.[0] ?? gapRole ?? "backend";
      role_assignments[replacementId] = role as RoleId;

      const roleCount = new Set(Object.values(role_assignments)).size;
      const score = syntheticTeamScore(member_ids.length, roleCount);
      score.total = Math.min(0.92, scoreBefore + 0.14);
      score.flags = score.flags.filter((f) => f.kind !== "missing_role");

      const team: Team = {
        id: teamId,
        member_ids,
        role_assignments,
        score,
      };
      teamOverrides[teamId] = team;

      const response: RebalanceResponse = {
        team,
        gap_flag: null,
        suggested_replacement_id: null,
        score_before: scoreBefore,
        score_after: score.total,
      };
      return response as T;
    }

    throw new Error("Invalid rebalance request");
  }

  if (normalized === "/candidates/search" && method === "GET") {
    const query = new URL(path, "http://local").searchParams.get("q")?.toLowerCase() ?? "";
    const candidates = participants.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.bio?.toLowerCase().includes(query) ||
        p.skills?.some((s) => s.id.includes(query)),
    );
    return { candidates } as T;
  }

  if (normalized === "/projects/analyze" && method === "POST") {
    const body = JSON.parse(options.body as string) as { description: string };
    const desc = body.description.toLowerCase();
    const roles: RoleId[] = ["frontend", "backend"];
    if (desc.includes("ml") || desc.includes("ai")) roles.push("ai_ml");
    if (desc.includes("design")) roles.push("design");
    if (desc.includes("product")) roles.push("product");
    const required_skills: string[] = ["typescript"];
    if (desc.includes("react")) required_skills.push("react");
    if (desc.includes("python")) required_skills.push("python");
    return {
      domain: desc.slice(0, 48) || "Hackathon project",
      required_skills,
      roles,
    } as T;
  }

  throw new Error(`Mock API: unhandled ${method} ${path}`);
}
