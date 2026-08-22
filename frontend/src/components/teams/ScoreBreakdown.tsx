import type { TeamScore } from "@/api/types";
import { PENALTY_LABELS, TERM_LABELS, safeTermValue } from "@/lib/team-display";

type ScoreBreakdownProps = {
  score: TeamScore;
};

function TermBar({
  label,
  value,
  variant = "term",
}: {
  label: string;
  value: number;
  variant?: "term" | "penalty";
}) {
  const percent = Math.round(value * 100);
  const width = Math.max(4, percent);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {variant === "penalty" ? `−${percent}%` : `${percent}%`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={
            variant === "penalty"
              ? "h-2 rounded-full bg-destructive/70"
              : "h-2 rounded-full bg-primary"
          }
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  const terms = score.terms ?? ({} as TeamScore["terms"]);
  const penalties = score.penalties ?? ({} as TeamScore["penalties"]);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-lg font-semibold">Score breakdown</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Named terms and penalties from TeamScore — proves complementarity over
        skill stacking.
      </p>
      <div className="mt-5 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Positive terms
        </p>
        {(Object.keys(TERM_LABELS) as (keyof typeof TERM_LABELS)[]).map(
          (key) => (
            <TermBar
              key={key}
              label={TERM_LABELS[key]}
              value={safeTermValue(terms[key])}
            />
          ),
        )}
      </div>
      <div className="mt-6 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Penalties
        </p>
        {(Object.keys(PENALTY_LABELS) as (keyof typeof PENALTY_LABELS)[]).map(
          (key) => (
            <TermBar
              key={key}
              label={PENALTY_LABELS[key]}
              value={safeTermValue(penalties[key])}
              variant="penalty"
            />
          ),
        )}
      </div>
    </section>
  );
}
