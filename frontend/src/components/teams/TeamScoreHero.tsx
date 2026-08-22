import type { Team } from "@/api/types";
import { scoreToDisplay } from "@/lib/team-display";
import { cn } from "@/lib/utils";

type TeamScoreHeroProps = {
  team: Team;
  fairnessOk?: boolean;
  heroLabel?: string;
  className?: string;
};

export function TeamScoreHero({
  team,
  fairnessOk,
  heroLabel = "Recommended team",
  className,
}: TeamScoreHeroProps) {
  const total = team.score?.total;
  const score =
    total !== undefined && !Number.isNaN(total) ? scoreToDisplay(total) : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-md sm:p-8",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full bg-primary/15 blur-2xl"
      />
      <p className="text-sm font-medium uppercase tracking-wider text-primary">
        {heroLabel}
      </p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {team.id}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Optimizer score from POST /api/form-teams — display only, computed
            by the engine.
          </p>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-5xl font-bold tabular-nums tracking-tight text-primary sm:text-6xl">
            {score !== null ? score : "—"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Team score / 100</p>
        </div>
      </div>
      {fairnessOk !== undefined ? (
        <p
          className={cn(
            "mt-6 inline-flex rounded-full px-3 py-1 text-xs font-medium",
            fairnessOk
              ? "bg-primary/10 text-primary"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {fairnessOk
            ? "Fairness OK — everyone placed"
            : "Fairness check flagged — review cohort placement"}
        </p>
      ) : null}
    </div>
  );
}
