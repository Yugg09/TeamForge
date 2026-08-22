import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Rebalancer } from "@/components/teams/Rebalancer";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/ui/state-panel";
import { useFormedTeam } from "@/api/use-formed-team";
import { useFormTeamsMutation } from "@/api/useFormTeams";
import { useParticipants } from "@/api/useParticipants";
import { Sparkles } from "lucide-react";

export function RebalancePage() {
  const { id } = useParams<{ id: string }>();
  const { team, hasFormedData } = useFormedTeam(id);
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
        title={team ? `Rebalance ${team.id}` : "Rebalance"}
        description="Remove a member, accept a replacement, and watch the team heal live."
        actions={
          <Link
            to={id ? `/teams/${id}` : "/teams"}
            className={buttonVariants({ variant: "link", size: "sm" })}
          >
            Back to team
          </Link>
        }
      />

      {formTeamsMutation.isPending ? (
        <LoadingSkeleton title="Loading team" rows={4} />
      ) : !hasFormedData || !team ? (
        <EmptyState
          title="No team to rebalance"
          description="Form teams first, then open the rebalancer for a team."
        >
          <Button
            onClick={() => formTeamsMutation.mutate({ event_id: "demo" })}
          >
            <Sparkles className="size-4" aria-hidden />
            Form teams
          </Button>
        </EmptyState>
      ) : participantsLoading ? (
        <LoadingSkeleton title="Loading cohort" rows={3} />
      ) : participantsError ? (
        <ErrorState
          title="Could not load participants"
          description={participantsErr?.message ?? "Unknown error"}
        />
      ) : (
        <Rebalancer team={team} participants={participants ?? []} />
      )}
    </section>
  );
}
