import { useNavigate } from "react-router-dom";
import { ParticipantList } from "@/components/participants/ParticipantList";
import { IntakePanel } from "@/components/participants/IntakePanel";
import { ParticipantProfileForm } from "@/components/participants/ParticipantProfileForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
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
        description="Browse the cohort and add members — quick intake or a full profile."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
        <IntakePanel
          onSuccess={(participantId) =>
            navigate(`/participants/${participantId}`)
          }
        />

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Cohort</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Everyone currently in this event.
            </p>
          </div>
          {isLoading ? (
            <LoadingSkeleton title="Loading participants" rows={5} />
          ) : isError ? (
            <ErrorState
              title="Could not load participants"
              description={error?.message ?? "Unknown error"}
            >
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </ErrorState>
          ) : participants && participants.length > 0 ? (
            <ParticipantList participants={participants} />
          ) : (
            <EmptyState
              title="No participants yet"
              description="Add the first member using the intake panel."
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Full profile form
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Capture skills, roles, availability, and working style in one pass.
          </p>
        </div>
        <ParticipantProfileForm
          onSuccess={(participantId) =>
            navigate(`/participants/${participantId}`)
          }
        />
      </div>
    </section>
  );
}
