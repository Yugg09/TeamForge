import { Link, useParams } from "react-router-dom";
import { ParticipantProfileView } from "@/components/participants/ParticipantProfileView";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ErrorState,
  LoadingState,
} from "@/components/ui/state-panel";
import { useParticipant } from "@/api/useParticipants";

export function ParticipantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    participant,
    isLoading,
    isError,
    error,
    isNotFound,
    refetch,
  } = useParticipant(id);

  return (
    <section className="space-y-8">
      <PageHeader
        title={participant?.name ?? (id ? `Participant ${id}` : "Participant")}
        description="Skills, availability (local + UTC), ambitions, and work-style preferences."
        actions={
          <Link
            to="/participants"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to cohort
          </Link>
        }
      />

      {isLoading ? (
        <LoadingState
          title="Loading profile"
          description="Resolving participant from cohort data…"
        />
      ) : isError ? (
        <ErrorState
          title="Could not load profile"
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
      ) : isNotFound ? (
        <ErrorState
          title="Participant not found"
          description={`No participant with id "${id}" exists in the current cohort.`}
        >
          <Link
            to="/participants"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            Back to cohort
          </Link>
        </ErrorState>
      ) : participant ? (
        <ParticipantProfileView participant={participant} />
      ) : null}
    </section>
  );
}
