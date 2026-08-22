export type RoleId =
  | "frontend"
  | "backend"
  | "ai_ml"
  | "design"
  | "product"
  | "research"
  | "devops";

export type Ambition = "win" | "ship" | "learn";

export interface Skill {
  id: string;
  proficiency: 1 | 2 | 3 | 4 | 5;
  verified: boolean;
}

export interface AvailabilityWindow {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start_utc: number;
  end_utc: number;
}

export interface ParticipantIn {
  name: string;
  bio?: string;
  timezone_offset_min?: number;
  skills?: Skill[];
  preferred_roles?: RoleId[];
  interests?: string[];
  availability?: AvailabilityWindow[];
  ambition?: Ambition;
  work_style?: "planner" | "improviser";
  sync_pref?: "sync" | "async";
}

export interface Participant extends ParticipantIn {
  id: string;
}

export interface TeamScoreTerms {
  coverage: number;
  complementarity: number;
  availability_overlap: number;
  goal_alignment: number;
  style_fit: number;
  interest_fit: number;
}

export interface TeamScorePenalties {
  skill_redundancy: number;
  role_gaps: number;
  availability_starvation: number;
}

export type RiskFlag =
  | { kind: "missing_role"; payload: { role: RoleId } }
  | {
      kind: "single_point_of_failure";
      payload: { skill: string; member_id: string };
    }
  | { kind: "availability_gap"; payload: { overlap_minutes: number } }
  | { kind: "goal_mismatch"; payload: { outlier_id: string } };

export interface TeamScore {
  total: number;
  terms: TeamScoreTerms;
  penalties: TeamScorePenalties;
  flags: RiskFlag[];
}

export interface Team {
  id: string;
  member_ids: string[];
  role_assignments: Record<string, RoleId>;
  score: TeamScore;
}

export interface StepLogEntry {
  op: "seed" | "swap" | "move";
  teams_touched: string[];
  total_score: number;
}

export interface FormTeamsRequest {
  event_id?: string;
  min_size?: number;
  max_size?: number;
}

export interface FormTeamsResponse {
  teams: Team[];
  step_log: StepLogEntry[];
  fairness_ok: boolean;
}

export interface RebalanceRequest {
  team_id: string;
  remove_member_id?: string;
  accept_replacement_id?: string;
}

export interface RebalanceResponse {
  team: Team;
  gap_flag: RiskFlag | null;
  suggested_replacement_id: string | null;
  score_before: number;
  score_after: number;
}

export interface ParticipantsResponse {
  participants: Participant[];
}

/** GET /api/candidates/search — response (PROJECT-MASTER §10 Phase 2) */
export interface CandidatesSearchResponse {
  candidates: Participant[];
}

export interface HealthResponse {
  status: string;
}

export interface ApiErrorBody {
  detail?: string;
}

/** POST /api/projects/analyze — request (PROJECT-MASTER §10) */
export interface ProjectAnalyzeRequest {
  description: string;
}

/** POST /api/projects/analyze — response (PROJECT-MASTER §10) */
export interface ProjectAnalyzeResponse {
  domain: string;
  required_skills: string[];
  roles: RoleId[];
}
