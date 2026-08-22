import { Loader2, Sparkles, Target, AlertTriangle } from "lucide-react";
import { useMemberExplanation } from "@/api/useMemberExplanation";
import { cn } from "@/lib/utils";

type MemberExplanationPanelProps = {
  teamId: string;
  memberId: string;
  memberName: string;
  onClose: () => void;
};

export function MemberExplanationPanel({
  teamId,
  memberId,
  memberName,
  onClose,
}: MemberExplanationPanelProps) {
  const { data: explanation, isLoading, error } = useMemberExplanation(teamId, memberId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <h2 className="text-lg font-semibold">{memberName}</h2>
            <p className="text-sm text-muted-foreground">
              Why are they on this team?
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Analyzing placement...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Could not load explanation. Please try again.
            </div>
          ) : explanation ? (
            <div className="space-y-5">
              {/* Fit Score */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl text-lg font-bold",
                    explanation.fit_score >= 80
                      ? "bg-primary/10 text-primary"
                      : explanation.fit_score >= 60
                        ? "bg-yellow-500/10 text-yellow-600"
                        : "bg-destructive/10 text-destructive",
                  )}
                >
                  {explanation.fit_score}
                </div>
                <div>
                  <p className="text-sm font-medium">Fit Score</p>
                  <p className="text-xs text-muted-foreground">
                    How well they match this team (0-100)
                  </p>
                </div>
              </div>

              {/* Reasons */}
              {explanation.reasons.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Target className="size-4 text-primary" aria-hidden />
                    Why they're here
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {explanation.reasons.map((reason, i) => (
                      <li
                        key={i}
                        className="flex gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
                      >
                        <span className="text-primary">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Strengths */}
              {explanation.strengths.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="size-4 text-primary" aria-hidden />
                    What they bring
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {explanation.strengths.map((strength, i) => (
                      <li
                        key={i}
                        className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary"
                      >
                        <span>✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Tradeoffs */}
              {explanation.tradeoffs.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className="size-4 text-yellow-500" aria-hidden />
                    Tradeoffs
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {explanation.tradeoffs.map((tradeoff, i) => (
                      <li
                        key={i}
                        className="flex gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-sm text-yellow-600"
                      >
                        <span>⚠</span>
                        <span>{tradeoff}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
