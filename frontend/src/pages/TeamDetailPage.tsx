import { Link, useParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { TeamAnalyticsPanel } from "@/components/teams/TeamAnalyticsPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
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
                className={buttonVariants({ size: "sm" })}
              >
                Rebalance
              </Link>
            ) : null}
            <Link
              to="/teams"
              className={buttonVariants({ variant: "link", size: "sm" })}
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
          <Button
            onClick={() => formTeamsMutation.mutate({ event_id: "demo" })}
          >
            <Sparkles className="size-4" aria-hidden />
            Form teams
          </Button>
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
