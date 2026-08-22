import { Link } from "react-router-dom";
import { Calendar, Sparkles } from "lucide-react";
import type { Participant } from "@/api/types";
import {
  CANONICAL_SKILLS,
  DAY_OPTIONS,
  proficiencyDisplay,
  ROLE_OPTIONS,
} from "@/lib/participant-constants";
import {
  minutesToTimeLabel,
  utcMinutesToLocal,
} from "@/lib/participant-form";
import { cn } from "@/lib/utils";

type CandidateCardProps = {
  participant: Participant;
  variant?: "grid" | "compact";
  className?: string;
};

function skillLabel(id: string): string {
  return CANONICAL_SKILLS.find((skill) => skill.id === id)?.label ?? id;
}

function roleLabel(role: string): string {
  return ROLE_OPTIONS.find((entry) => entry.value === role)?.label ?? role;
}

function availabilitySummary(participant: Participant): string {
  const windows = participant.availability ?? [];
  if (windows.length === 0) {
    return "No availability listed";
  }

  const timezone = participant.timezone_offset_min ?? 0;
  const summaries = windows.slice(0, 2).map((window) => {
    const day =
      DAY_OPTIONS.find((entry) => entry.value === window.day)?.label ??
      String(window.day);
    const start = utcMinutesToLocal(window.start_utc, timezone);
    const end = utcMinutesToLocal(window.end_utc, timezone);
    return `${day} ${minutesToTimeLabel(start)}–${minutesToTimeLabel(end)} local`;
  });

  const suffix =
    windows.length > 2 ? ` · +${windows.length - 2} more` : "";
  return summaries.join(" · ") + suffix;
}

export function CandidateCard({
  participant,
  variant = "grid",
  className,
}: CandidateCardProps) {
  const skills = participant.skills ?? [];
  const roles = participant.preferred_roles ?? [];
  const topSkills = skills.slice(0, 4);
  const remainingSkills = skills.length - topSkills.length;

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md",
        variant === "grid" ? "p-5" : "p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/participants/${participant.id}`}
            className="font-semibold tracking-tight hover:text-primary hover:underline underline-offset-4"
          >
            {participant.name}
          </Link>
          {participant.ambition ? (
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {participant.ambition}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {skills.length} skills
        </span>
      </div>

      {participant.bio ? (
        <p
          className={cn(
            "mt-3 text-sm text-muted-foreground",
            variant === "grid" ? "line-clamp-3" : "line-clamp-2",
          )}
        >
          {participant.bio}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No experience listed.</p>
      )}

      {topSkills.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {topSkills.map((skill) => (
            <li
              key={skill.id}
              className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs"
            >
              {skillLabel(skill.id)}
              <span className="text-muted-foreground">
                {" "}
                · {proficiencyDisplay(skill.proficiency)}
              </span>
            </li>
          ))}
          {remainingSkills > 0 ? (
            <li className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground">
              +{remainingSkills} more
            </li>
          ) : null}
        </ul>
      ) : null}

      {roles.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Preferred roles
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.map((role) => (
              <span
                key={role}
                className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs text-primary"
              >
                {roleLabel(role)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
        <Calendar className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{availabilitySummary(participant)}</span>
      </div>

      {variant === "grid" && participant.interests && participant.interests.length > 0 ? (
        <div className="mt-4 flex items-start gap-2 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span className="text-muted-foreground">
            {participant.interests.slice(0, 3).join(" · ")}
          </span>
        </div>
      ) : null}
    </article>
  );
}
