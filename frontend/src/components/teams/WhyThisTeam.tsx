import type { TeamScore } from "@/api/types";
import { buildTeamInsights } from "@/lib/team-explain";
import { scoreToDisplay } from "@/lib/team-display";
import { cn } from "@/lib/utils";

type WhyThisTeamProps = {
  score: TeamScore;
  className?: string;
};

export function WhyThisTeam({ score, className }: WhyThisTeamProps) {
  const insights = buildTeamInsights(score);
  const scoreDisplay = scoreToDisplay(score.total);

  const bullets: { tone: "positive" | "warning" | "neutral"; text: string }[] =
    [];

  for (const strength of insights.strengths.slice(0, 3)) {
    bullets.push({ tone: "positive", text: strength });
  }
  for (const weakness of insights.weaknesses.slice(0, 3)) {
    bullets.push({ tone: "warning", text: weakness });
  }
  if (bullets.length === 0) {
    for (const line of insights.explanations.slice(0, 5)) {
      bullets.push({ tone: "neutral", text: line });
    }
  }

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Why this team?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Derived from TeamScore terms, penalties, and flags.
          </p>
        </div>
        <span className="text-2xl font-bold tabular-nums text-primary">
          {scoreDisplay}
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {bullets.map((bullet, index) => (
          <li
            key={index}
            className={cn(
              "flex items-start gap-2 text-sm",
              bullet.tone === "positive" && "text-primary",
              bullet.tone === "warning" && "text-destructive",
              bullet.tone === "neutral" && "text-foreground",
            )}
          >
            <span className="shrink-0 font-medium">
              {bullet.tone === "positive" ? "✓" : bullet.tone === "warning" ? "⚠" : "·"}
            </span>
            <span>{bullet.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
