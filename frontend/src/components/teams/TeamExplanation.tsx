import { CheckCircle2, Info, Loader2, Sparkles } from "lucide-react";
import { useTeamExplanation } from "@/api/useExplanation";
import type { TeamInsights } from "@/lib/team-explain";

type TeamExplanationProps = {
  teamId: string;
  insights: TeamInsights;
};

export function TeamExplanation({ teamId, insights }: TeamExplanationProps) {
  const { data: llmExplanation, isLoading: llmLoading } = useTeamExplanation(teamId);

  // Use LLM explanation if available, otherwise fall back to template
  const bullets = llmExplanation?.bullets ?? [];
  const useLlm = bullets.length > 0 && llmExplanation?.llm_backend === "openai";

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Info className="size-5 text-primary" aria-hidden />
        <h3 className="text-lg font-semibold">Why this team</h3>
        {useLlm ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
            <Sparkles className="size-3" aria-hidden />
            AI
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {useLlm
          ? "AI-powered explanation from score terms, penalties, and flags."
          : "Deterministic explanation from score terms, penalties, and flags — no invented facts."}
      </p>

      {llmLoading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Generating explanation...
        </div>
      ) : useLlm ? (
        <ul className="mt-4 space-y-2">
          {bullets.map((bullet, index) => (
            <li
              key={`${bullet.type}-${index}`}
              className="flex gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
            >
              {bullet.type === "strength" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              ) : bullet.type === "weakness" ? (
                <span className="mt-0.5 shrink-0 text-destructive">⚠</span>
              ) : (
                <span className="mt-0.5 shrink-0 text-muted-foreground">·</span>
              )}
              <span>{bullet.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-4 space-y-2">
          {insights.explanations.map((line) => (
            <li
              key={line}
              className="flex gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
            >
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type StrengthsWeaknessesProps = {
  insights: TeamInsights;
};

export function TeamStrengthsWeaknesses({ insights }: StrengthsWeaknessesProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <h3 className="font-semibold text-primary">Strengths</h3>
        {insights.strengths.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm">
            {insights.strengths.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No standout strengths flagged in score terms.
          </p>
        )}
      </section>
      <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
        <h3 className="font-semibold text-destructive">Weaknesses</h3>
        {insights.weaknesses.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm">
            {insights.weaknesses.map((item) => (
              <li key={item}>⚠ {item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No major weaknesses flagged.
          </p>
        )}
      </section>
    </div>
  );
}
