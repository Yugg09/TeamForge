import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ParticipantProfileView } from "@/components/participants/ParticipantProfileView";
import { ParticipantProfileForm } from "@/components/participants/ParticipantProfileForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ErrorState,
  LoadingState,
} from "@/components/ui/state-panel";
import { useParticipant } from "@/api/useParticipants";

export function ParticipantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [editing, setEditing] = useState(false);
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
            className={buttonVariants({ variant: "link", size: "sm" })}
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
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </ErrorState>
      ) : isNotFound ? (
        <ErrorState
          title="Participant not found"
          description={`No participant with id "${id}" exists in the current cohort.`}
        >
          <Link
            to="/participants"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Back to cohort
          </Link>
        </ErrorState>
      ) : participant ? (
        editing ? (
          <div className="space-y-6">
            <ParticipantProfileForm
              participant={participant}
              onSuccess={() => setEditing(false)}
            />
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Cancel editing
            </button>
          </div>
        ) : (
          <ParticipantProfileView
            participant={participant}
            onEdit={() => setEditing(true)}
          />
        )
      ) : null}
    </section>
  );
}
