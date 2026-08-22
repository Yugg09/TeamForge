import { Link, useParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { TeamAnalyticsPanel } from "@/components/teams/TeamAnalyticsPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  EmptyState,
  LoadingState,
} from "@/components/ui/state-panel";
import { useFormedTeam } from "@/api/use-formed-team";
import { useFormTeamsMutation } from "@/api/use-form-teams";
import { useParticipants } from "@/api/use-participants";

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { team, hasFormedData, fairnessOk } = useFormedTeam(id);
  const formTeamsMutation = useFormTeamsMutation();
  const { data: participants, isLoading: participantsLoading } =
    useParticipants();

  return (
    <section className="space-y-8">
      <PageHeader
        title={team?.id ?? (id ? `Team ${id}` : "Team")}
        description="Team analytics — score, coverage, gaps, composition, and member roles from form-teams data."
        actions={
          <Link
            to="/teams"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to teams
          </Link>
        }
      />

      {formTeamsMutation.isPending ? (
        <LoadingState
          title="Forming teams"
          description="Loading team analytics from POST /api/form-teams…"
        />
      ) : !hasFormedData || !team ? (
        <EmptyState
          title="No team analytics available"
          description={
            id
              ? `Team "${id}" was not found in the current form-teams cache. Form teams first.`
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
        <LoadingState title="Loading member profiles" />
      ) : (
        <TeamAnalyticsPanel
          team={team}
          participants={participants ?? []}
          fairnessOk={fairnessOk}
          heroLabel="Team analytics"
        />
      )}
    </section>
  );
}
