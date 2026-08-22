import { Link, useParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { TeamAnalyticsPanel } from "@/components/teams/TeamAnalyticsPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/ui/state-panel";
import { useFormedTeam } from "@/api/use-formed-team";
import { useFormTeamsMutation } from "@/api/useFormTeams";
import { useParticipants } from "@/api/useParticipants";

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { team, hasFormedData, fairnessOk } = useFormedTeam(id);
  const formTeamsMutation = useFormTeamsMutation();
  const {
    data: participants,
    isLoading: participantsLoading,
    isError: participantsError,
    error: participantsErr,
  } = useParticipants();

  return (
    <section className="space-y-8">
      <PageHeader
        title={team?.id ?? (id ? `Team ${id}` : "Team")}
        description="Members, score breakdown, radar, flags, and rebalancer entry."
        actions={
          <div className="flex flex-wrap gap-3">
            {team ? (
              <Link
                to={`/rebalance/${team.id}`}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-95"
              >
                Rebalance
              </Link>
            ) : null}
            <Link
              to="/teams"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to teams
            </Link>
          </div>
        }
      />

      {formTeamsMutation.isPending ? (
        <LoadingSkeleton title="Forming teams" rows={4} />
      ) : !hasFormedData || !team ? (
        <EmptyState
          title="No team analytics available"
          description={
            id
              ? `Team "${id}" was not found. Form teams first.`
              : "Form teams to load analytics."
          }
        >
          <button
            type="button"
            onClick={() => formTeamsMutation.mutate({ event_id: "demo" })}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95"
          >
            <Sparkles className="size-4" aria-hidden />
            Form teams
          </button>
        </EmptyState>
      ) : participantsLoading ? (
        <LoadingSkeleton title="Loading member profiles" rows={3} />
      ) : participantsError ? (
        <ErrorState
          title="Could not load participants"
          description={participantsErr?.message ?? "Unknown error"}
        />
      ) : (
        <TeamAnalyticsPanel
          team={team}
          participants={participants ?? []}
          fairnessOk={fairnessOk}
          heroLabel="Team detail"
        />
      )}
    </section>
  );
}
