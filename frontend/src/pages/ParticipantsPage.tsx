import { useNavigate } from "react-router-dom";
import { ParticipantList } from "@/components/participants/ParticipantList";
import { IntakePanel } from "@/components/participants/IntakePanel";
import { ParticipantProfileForm } from "@/components/participants/ParticipantProfileForm";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/ui/state-panel";
import { useParticipants } from "@/api/useParticipants";

export function ParticipantsPage() {
  const navigate = useNavigate();
  const { data: participants, isLoading, isError, error, refetch } =
    useParticipants();

  return (
    <section className="space-y-10">
      <PageHeader
        title="Participants"
        description="Browse the cohort and add members — quick intake or full profile."
      />

      <IntakePanel
        onSuccess={(participantId) => navigate(`/participants/${participantId}`)}
      />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Cohort</h2>
        {isLoading ? (
          <LoadingSkeleton title="Loading participants" rows={5} />
        ) : isError ? (
          <ErrorState
            title="Could not load participants"
            description={error?.message ?? "Unknown error"}
          >
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
            >
              Retry
            </button>
          </ErrorState>
        ) : participants && participants.length > 0 ? (
          <ParticipantList participants={participants} />
        ) : (
          <EmptyState
            title="No participants yet"
            description="Add the first member using the intake panel above."
          />
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Full profile form</h2>
        <ParticipantProfileForm
          onSuccess={(participantId) => navigate(`/participants/${participantId}`)}
        />
      </div>
    </section>
  );
}
