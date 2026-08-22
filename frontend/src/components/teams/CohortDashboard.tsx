import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Activity, Layers, Sparkles, Users } from "lucide-react";
import { TeamCard } from "@/components/teams/TeamCard";
import { RoleDistributionChart } from "@/components/teams/RoleDistributionChart";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/ui/state-panel";
import {
  formedTeamsQueryKey,
  useFormTeamsMutation,
} from "@/api/useFormTeams";
import { useParticipants } from "@/api/useParticipants";
import { useHealth } from "@/api/useHealth";
import { useQueryClient } from "@tanstack/react-query";
import type { FormTeamsResponse, Participant, RoleId } from "@/api/types";
import { ROLE_OPTIONS } from "@/lib/participant-constants";
import { cn } from "@/lib/utils";

function cohortRoleDistribution(participants: Participant[]) {
  const counts = new Map<RoleId, number>();
  for (const p of participants) {
    for (const role of p.preferred_roles ?? []) {
      counts.set(role, (counts.get(role) ?? 0) + 1);
    }
  }
  return ROLE_OPTIONS.map((role) => ({
    role: role.value,
    label: role.label,
    count: counts.get(role.value) ?? 0,
  })).filter((slice) => slice.count > 0);
}

export function CohortDashboard() {
  const queryClient = useQueryClient();
  const formedData = queryClient.getQueryData<FormTeamsResponse>(
    formedTeamsQueryKey,
  );
  const formTeamsMutation = useFormTeamsMutation();
  const {
    data: participants,
    isLoading: participantsLoading,
    isError: participantsError,
    error: participantsErr,
    refetch,
  } = useParticipants();
  const { data: health, isLoading: healthLoading } = useHealth();

  const response = formedData ?? formTeamsMutation.data;
  const teams = response?.teams ?? [];
  const roleSlices = useMemo(
    () => cohortRoleDistribution(participants ?? []),
    [participants],
  );

  if (participantsLoading) {
    return <LoadingSkeleton title="Loading cohort dashboard" rows={5} />;
  }

  if (participantsError) {
    return (
      <ErrorState
        title="Could not load cohort"
        description={participantsErr?.message ?? "Unknown error"}
      >
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </ErrorState>
    );
  }

  const cohort = participants ?? [];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Cohort size"
          value={cohort.length}
          hint="GET /api/participants"
          icon={<Users className="size-4" aria-hidden />}
        />
        <StatCard
          label="Teams formed"
          value={teams.length}
          hint={teams.length > 0 ? "Partition ready" : "Run form-teams"}
          icon={<Layers className="size-4" aria-hidden />}
        />
        <StatCard
          label="API health"
          value={healthLoading ? "…" : health?.status ?? "unknown"}
          hint="GET /api/health"
          icon={<Activity className="size-4" aria-hidden />}
        />
      </div>

      {response?.fairness_ok !== undefined ? (
        <Card
          className={cn(
            "px-5 py-4",
            response.fairness_ok
              ? "border-primary/25 bg-primary/5"
              : "border-destructive/25 bg-destructive/5",
          )}
        >
          <p className="font-semibold">
            Fairness:{" "}
            {response.fairness_ok
              ? "Everyone placed in a team"
              : "Review placement fairness"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            fairness_ok from POST /api/form-teams
          </p>
        </Card>
      ) : (
        <EmptyState
          title="No teams formed yet"
          description="Form teams to see fairness and per-team health."
        >
          <Button
            onClick={() => formTeamsMutation.mutate({ event_id: "demo" })}
            disabled={formTeamsMutation.isPending}
          >
            <Sparkles className="size-4" aria-hidden />
            Form teams
          </Button>
        </EmptyState>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Cohort role distribution
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Preferred roles across the full cohort — not a leaderboard of
            individuals.
          </p>
        </div>
        {roleSlices.length > 0 ? (
          <RoleDistributionChart
            slices={roleSlices.map((s) => ({
              role: s.role,
              label: s.label,
              count: s.count,
            }))}
            title="Preferred roles in cohort"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No role preferences recorded.
          </p>
        )}
      </section>

      {teams.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Per-team health
            </h2>
            <Link
              to="/teams"
              className={buttonVariants({ variant: "link", size: "sm" })}
            >
              View teams →
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <li key={team.id}>
                <TeamCard team={team} participants={cohort} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
