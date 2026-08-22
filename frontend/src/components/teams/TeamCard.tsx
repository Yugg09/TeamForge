import type { Participant, Team } from "@/api/types";
import { ROLE_OPTIONS } from "@/lib/participant-constants";
import {
  getMemberAssignment,
  scoreToDisplay,
} from "@/lib/team-display";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type TeamCardProps = {
  team: Team;
  participants?: Participant[];
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
};

function roleLabel(role: string): string {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}

function healthSummary(team: Team): string {
  const flags = team.score.flags.length;
  const coverage = team.score.terms.coverage;
  if (flags > 0) {
    return `${flags} risk flag${flags === 1 ? "" : "s"} — review gaps`;
  }
  if (coverage >= 0.85) return "Strong role coverage";
  if (coverage >= 0.7) return "Balanced mix — minor gaps";
  return "Coverage needs attention";
}

export function TeamCard({
  team,
  participants = [],
  selected,
  onSelect,
  className,
}: TeamCardProps) {
  const score = scoreToDisplay(team.score.total);
  const hasGap = team.score.flags.some((f) => f.kind === "missing_role");
  const participantMap = new Map(participants.map((p) => [p.id, p]));
  const summary = healthSummary(team);

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {hasGap ? (
            <span
              className="size-2 shrink-0 rounded-full bg-destructive animate-pulse"
              aria-label="Gap flagged"
            />
          ) : null}
          <p className="font-semibold">{team.id}</p>
        </div>
        <span
          className={cn(
            "text-lg font-bold tabular-nums",
            score >= 80 ? "text-primary" : "text-foreground",
          )}
        >
          {score}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {team.member_ids.slice(0, 6).map((memberId) => {
          const name = participantMap.get(memberId)?.name ?? memberId;
          const role = getMemberAssignment(team, memberId);
          return (
            <li
              key={memberId}
              className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs"
            >
              <span className="font-medium">{name}</span>
              {role ? (
                <span className="text-muted-foreground"> · {roleLabel(role)}</span>
              ) : null}
            </li>
          );
        })}
        {team.member_ids.length > 6 ? (
          <li className="text-xs text-muted-foreground px-1">
            +{team.member_ids.length - 6}
          </li>
        ) : null}
      </ul>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full rounded-xl border p-4 text-left shadow-sm transition",
          selected
            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
            : "border-border bg-card hover:bg-accent/40",
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={`/teams/${team.id}`}
      className={cn(
        "block rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md",
        className,
      )}
    >
      {content}
    </Link>
  );
}
