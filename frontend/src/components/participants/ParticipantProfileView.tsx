import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  BookOpen,
  Calendar,
  Clock,
  Loader2,
  Pencil,
  Shield,
  Sparkles,
  Target,
  Trash2,
  User,
} from "lucide-react";
import { useDeleteParticipant } from "@/api/useParticipants";
import type { Participant, Skill } from "@/api/types";
import {
  AMBITION_OPTIONS,
  CANONICAL_SKILLS,
  DAY_OPTIONS,
  proficiencyDisplay,
  ROLE_OPTIONS,
  SYNC_PREF_OPTIONS,
  WORK_STYLE_OPTIONS,
} from "@/lib/participant-constants";
import {
  minutesToTimeLabel,
  utcMinutesToLocal,
} from "@/lib/participant-form";
import { cn } from "@/lib/utils";

type ParticipantProfileViewProps = {
  participant: Participant;
  onEdit?: () => void;
};

// ---------- helpers ----------

function labelForSkill(id: string): string {
  return CANONICAL_SKILLS.find((skill) => skill.id === id)?.label ?? id;
}

function labelForRole(role: string): string {
  return ROLE_OPTIONS.find((entry) => entry.value === role)?.label ?? role;
}

function labelForAmbition(value: string): string {
  return AMBITION_OPTIONS.find((entry) => entry.value === value)?.label ?? value;
}

function labelForWorkStyle(value: string): string {
  return WORK_STYLE_OPTIONS.find((entry) => entry.value === value)?.label ?? value;
}

function labelForSyncPref(value: string): string {
  return SYNC_PREF_OPTIONS.find((entry) => entry.value === value)?.label ?? value;
}

function labelForDay(day: number): string {
  return DAY_OPTIONS.find((entry) => entry.value === day)?.label ?? String(day);
}

function getProficiencyColor(level: number): string {
  if (level >= 5) return "text-primary";
  if (level >= 4) return "text-green-600";
  if (level >= 3) return "text-yellow-600";
  if (level >= 2) return "text-orange-500";
  return "text-muted-foreground";
}

function getProficiencyBg(level: number): string {
  if (level >= 5) return "bg-primary";
  if (level >= 4) return "bg-green-500";
  if (level >= 3) return "bg-yellow-500";
  if (level >= 2) return "bg-orange-500";
  return "bg-muted-foreground";
}

// ---------- sub-components ----------

function SkillCard({ skill }: { skill: Skill }) {
  const label = labelForSkill(skill.id);
  const profColor = getProficiencyColor(skill.proficiency);
  const profBg = getProficiencyBg(skill.proficiency);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-medium">{label}</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">{skill.id}</p>
        </div>
        {skill.verified ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Shield className="size-3" aria-hidden />
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
            Self-declared
          </span>
        )}
      </div>

      {/* Proficiency bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className={cn("font-medium", profColor)}>
            {proficiencyDisplay(skill.proficiency)}
          </span>
          <span className={cn("font-medium", profColor)}>
            {skill.proficiency}/5
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", profBg)}
            style={{ width: `${(skill.proficiency / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Proficiency dots */}
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              "size-2 rounded-full",
              level <= skill.proficiency ? profBg : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function AvailabilityCard({
  window: w,
  timezone,
}: {
  window: { day: number; start_utc: number; end_utc: number };
  timezone: number;
}) {
  const startLocal = utcMinutesToLocal(w.start_utc, timezone);
  const endLocal = utcMinutesToLocal(w.end_utc, timezone);
  const durationMin = w.end_utc - w.start_utc;
  const hours = Math.floor(durationMin / 60);
  const mins = durationMin % 60;

  return (
    <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">{labelForDay(w.day)}</span>
        <span className="text-xs text-muted-foreground">
          {hours}h {mins > 0 ? `${mins}m` : ""}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="size-3" aria-hidden />
        <span>
          {minutesToTimeLabel(startLocal)} – {minutesToTimeLabel(endLocal)} local
        </span>
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        UTC {minutesToTimeLabel(w.start_utc)} – {minutesToTimeLabel(w.end_utc)}
      </div>
    </div>
  );
}

// ---------- main component ----------

export function ParticipantProfileView({
  participant,
  onEdit,
}: ParticipantProfileViewProps) {
  const timezone = participant.timezone_offset_min ?? 0;
  const navigate = useNavigate();
  const deleteParticipant = useDeleteParticipant();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const skills = participant.skills ?? [];
  const roles = participant.preferred_roles ?? [];
  const interests = participant.interests ?? [];
  const availability = participant.availability ?? [];

  // Compute stats
  const verifiedCount = skills.filter((s) => s.verified).length;
  const selfDeclaredCount = skills.length - verifiedCount;
  const avgProficiency =
    skills.length > 0
      ? skills.reduce((sum, s) => sum + s.proficiency, 0) / skills.length
      : 0;
  const totalHours = availability.reduce((sum, w) => {
    return sum + (w.end_utc - w.start_utc);
  }, 0) / 60;

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteParticipant.mutate(participant.id, {
      onSuccess: () => navigate("/participants"),
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {participant.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {participant.id}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="size-3" aria-hidden />
                  Edit
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteParticipant.isPending}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                {deleteParticipant.isPending ? (
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="size-3" aria-hidden />
                )}
                {confirmDelete ? "Confirm" : "Delete"}
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Skills</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{skills.length}</p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-primary">Verified</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-primary">
                {verifiedCount}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Avg Proficiency</p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {avgProficiency > 0 ? avgProficiency.toFixed(1) : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Availability</p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {totalHours > 0 ? `${totalHours.toFixed(0)}h` : "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bio */}
      {participant.bio ? (
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" aria-hidden />
            <h2 className="text-lg font-semibold">About</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {participant.bio}
          </p>
        </section>
      ) : null}

      {/* Self-declared skills */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden />
            <h2 className="text-lg font-semibold">Self-Declared Skills</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Shield className="size-3 text-primary" aria-hidden />
              {verifiedCount} verified
            </span>
            <span>•</span>
            <span>{selfDeclaredCount} self-declared</span>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Skills declared by the participant. Verified skills are confirmed by organizers.
        </p>

        {skills.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            No skills declared yet.
          </p>
        )}
      </section>

      {/* Roles & interests */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Target className="size-5 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold">Roles & Interests</h2>
        </div>

        <div className="mt-4 space-y-5">
          {/* Preferred roles */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Preferred Roles
            </p>
            {roles.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
                  >
                    <User className="size-3" aria-hidden />
                    {labelForRole(role)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">None specified.</p>
            )}
          </div>

          {/* Interests */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Interests
            </p>
            {interests.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-border bg-muted/40 px-3 py-1 text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">None specified.</p>
            )}
          </div>
        </div>
      </section>

      {/* Availability */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold">Availability</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Weekly availability windows in local timezone (stored as UTC).
        </p>

        {availability.length > 0 ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {availability.map((w, index) => (
              <AvailabilityCard key={`${w.day}-${index}`} window={w} timezone={timezone} />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            No availability windows listed.
          </p>
        )}
      </section>

      {/* Working style & goals */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Award className="size-5 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold">Working Style & Goals</h2>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ambition
            </p>
            <p className="mt-2 font-medium">
              {labelForAmbition(participant.ambition ?? "ship")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {participant.ambition === "win"
                ? "Competitive, wants to win"
                : participant.ambition === "learn"
                  ? "Learning-focused, open to exploring"
                  : "Ship-focused, wants to build something real"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Work Style
            </p>
            <p className="mt-2 font-medium">
              {labelForWorkStyle(participant.work_style ?? "planner")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {participant.work_style === "planner"
                ? "Prefers structure and planning"
                : "Prefers flexibility and improvisation"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Collaboration
            </p>
            <p className="mt-2 font-medium">
              {labelForSyncPref(participant.sync_pref ?? "sync")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {participant.sync_pref === "sync"
                ? "Prefers real-time collaboration"
                : "Prefers async communication"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
