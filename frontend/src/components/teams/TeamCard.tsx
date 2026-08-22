import { Link } from "react-router-dom";
import type { Team } from "@/api/types";
import { scoreToDisplay } from "@/lib/team-display";
import { cn } from "@/lib/utils";

type TeamCardProps = {
  team: Team;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
};

export function TeamCard({
  team,
  selected,
  onSelect,
  className,
}: TeamCardProps) {
  const score = scoreToDisplay(team.score.total);
  const flagCount = team.score.flags.length;

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{team.id}</p>
        <span
          className={cn(
            "text-lg font-bold tabular-nums",
            score >= 80 ? "text-primary" : "text-foreground",
          )}
        >
          {score}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {team.member_ids.length} members
        {flagCount > 0 ? ` · ${flagCount} flag${flagCount === 1 ? "" : "s"}` : ""}
      </p>
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
