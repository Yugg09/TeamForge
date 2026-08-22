import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useTeamRecommendations } from "@/api/useRecommendations";
import { useParticipants } from "@/api/useParticipants";
import { cn } from "@/lib/utils";
import type { MemberMatch, TeamRecommendation } from "@/api/recommend-api";

type TeamRecommendationsProps = {
  teamId: string;
  className?: string;
};

// ---------- helpers ----------

function getFitColor(score: number): string {
  if (score >= 80) return "text-primary";
  if (score >= 60) return "text-yellow-600";
  return "text-destructive";
}

function getFitBg(score: number): string {
  if (score >= 80) return "bg-primary";
  if (score >= 60) return "bg-yellow-500";
  return "bg-destructive";
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "high":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "medium":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-600";
    case "low":
      return "border-border bg-muted/50 text-muted-foreground";
    default:
      return "border-border bg-muted/50 text-muted-foreground";
  }
}

function getLevelColor(level: string): string {
  switch (level) {
    case "high":
      return "text-primary";
    case "medium":
      return "text-yellow-600";
    case "low":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

// ---------- sub-components ----------

function MemberMatchCard({
  match,
  participantName,
}: {
  match: MemberMatch;
  participantName: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-medium">{participantName}</h4>
          <p className="text-xs text-muted-foreground">
            {match.assigned_role} • {match.member_id}
          </p>
        </div>
        <div className="text-right">
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold",
              getFitColor(match.fit_score),
            )}
          >
            {match.fit_score}%
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">fit score</p>
        </div>
      </div>

      {/* Fit score bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", getFitBg(match.fit_score))}
          style={{ width: `${match.fit_score}%` }}
        />
      </div>

      {/* Dimension scores */}
      <div className="mt-4 grid grid-cols-5 gap-2">
        {Object.entries(match.dimensions).map(([key, dim]) => (
          <div key={key} className="text-center">
            <p className="text-xs text-muted-foreground capitalize">{key}</p>
            <p className={cn("text-sm font-medium", getFitColor(dim.score * 100))}>
              {Math.round(dim.score * 100)}
            </p>
          </div>
        ))}
      </div>

      {/* Explanation */}
      <p className="mt-3 text-sm text-muted-foreground">{match.explanation}</p>

      {/* Strengths */}
      {match.strengths.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-primary">Strengths</p>
          <ul className="mt-1 space-y-1">
            {match.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-primary">
                <CheckCircle2 className="mt-0.5 size-3 shrink-0" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Considerations */}
      {match.considerations.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-yellow-600">Considerations</p>
          <ul className="mt-1 space-y-1">
            {match.considerations.map((c, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-yellow-600">
                <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ rec }: { rec: TeamRecommendation }) {
  return (
    <div className={cn("rounded-lg border p-3 text-sm", getPriorityColor(rec.priority))}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{rec.message}</p>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
          {rec.priority}
        </span>
      </div>
      <p className="mt-1 text-xs opacity-80">{rec.action}</p>
    </div>
  );
}

function CompatibilityList({
  pairs,
  participantMap,
}: {
  pairs: { member_a: string; member_b: string; similarity: number; level: string }[];
  participantMap: Map<string, string>;
}) {
  // Sort by similarity descending
  const sorted = [...pairs].sort((a, b) => b.similarity - a.similarity);
  const top5 = sorted.slice(0, 5);

  return (
    <div className="space-y-2">
      {top5.map((pair, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
        >
          <span>
            {participantMap.get(pair.member_a) ?? pair.member_a} &{" "}
            {participantMap.get(pair.member_b) ?? pair.member_b}
          </span>
          <span className={cn("font-medium", getLevelColor(pair.level))}>
            {Math.round(pair.similarity * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------- main component ----------

export function TeamRecommendations({
  teamId,
  className,
}: TeamRecommendationsProps) {
  const { data: recs, isLoading, error } = useTeamRecommendations(teamId);
  const { data: participants } = useParticipants();

  const participantMap = new Map(
    participants?.map((p) => [p.id, p.name]) ?? [],
  );

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Analyzing team recommendations...
        </div>
      </section>
    );
  }

  if (error || !recs) {
    return (
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Could not load team recommendations.
        </p>
      </section>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Team Summary */}
      <section className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 to-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" aria-hidden />
          <h3 className="text-lg font-semibold">Team Match Analysis</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          How well each member fits this team and why
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-background/50 p-3">
            <p className="text-xs text-muted-foreground">Avg Fit Score</p>
            <p className={cn("mt-1 text-2xl font-bold", getFitColor(recs.team_summary.avg_fit_score))}>
              {recs.team_summary.avg_fit_score}%
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/50 p-3">
            <p className="text-xs text-muted-foreground">Team Score</p>
            <p className="mt-1 text-2xl font-bold">{recs.team_summary.score}</p>
          </div>
          <div className="rounded-lg border border-border bg-background/50 p-3">
            <p className="text-xs text-muted-foreground">Unique Skills</p>
            <p className="mt-1 text-2xl font-bold">{recs.team_summary.total_unique_skills}</p>
          </div>
          <div className="rounded-lg border border-border bg-background/50 p-3">
            <p className="text-xs text-muted-foreground">Role Coverage</p>
            <p className="mt-1 text-2xl font-bold">
              {Math.round(recs.team_summary.role_coverage * 100)}%
            </p>
          </div>
        </div>
      </section>

      {/* Member Matches */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="size-5 text-primary" aria-hidden />
          <h3 className="text-lg font-semibold">Member Matches</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {recs.member_matches.map((match) => (
            <MemberMatchCard
              key={match.member_id}
              match={match}
              participantName={participantMap.get(match.member_id) ?? match.member_id}
            />
          ))}
        </div>
      </section>

      {/* Recommendations */}
      {recs.recommendations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Target className="size-5 text-primary" aria-hidden />
            <h3 className="text-lg font-semibold">Recommendations</h3>
          </div>
          <div className="space-y-2">
            {recs.recommendations.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} />
            ))}
          </div>
        </section>
      )}

      {/* Compatibility */}
      {recs.compatibility_matrix.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-5 text-primary" aria-hidden />
            <h3 className="text-lg font-semibold">Top Pair Compatibility</h3>
          </div>
          <CompatibilityList
            pairs={recs.compatibility_matrix}
            participantMap={participantMap}
          />
        </section>
      )}
    </div>
  );
}
