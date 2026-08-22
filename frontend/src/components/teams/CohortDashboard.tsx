import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Users } from "lucide-react";
import { TeamCard } from "@/components/teams/TeamCard";
import { RoleDistributionChart } from "@/components/teams/RoleDistributionChart";
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
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          Retry
        </button>
      </ErrorState>
    );
  }

  const cohort = participants ?? [];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4" aria-hidden />
            <span className="text-sm font-medium">Cohort size</span>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">{cohort.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            GET /api/participants
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Teams formed</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{teams.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {teams.length > 0 ? "Partition ready" : "Run form-teams"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">API health</p>
          <p
            className={cn(
              "mt-2 text-lg font-semibold",
              health?.status === "ok" ? "text-primary" : "text-muted-foreground",
            )}
          >
            {healthLoading ? "…" : health?.status ?? "unknown"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">GET /api/health</p>
        </div>
      </div>

      {response?.fairness_ok !== undefined ? (
        <div
          className={cn(
            "rounded-xl border px-5 py-4",
            response.fairness_ok
              ? "border-primary/30 bg-primary/5"
              : "border-destructive/30 bg-destructive/5",
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
        </div>
      ) : (
        <EmptyState
          title="No teams formed yet"
          description="Form teams to see fairness and per-team health."
        >
          <button
            type="button"
            onClick={() => formTeamsMutation.mutate({ event_id: "demo" })}
            disabled={formTeamsMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Sparkles className="size-4" aria-hidden />
            Form teams
          </button>
        </EmptyState>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Cohort role distribution</h2>
        <p className="text-sm text-muted-foreground">
          Preferred roles across the full cohort — not a leaderboard of individuals.
        </p>
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
          <p className="text-sm text-muted-foreground">No role preferences recorded.</p>
        )}
      </section>

      {teams.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Per-team health</h2>
            <Link
              to="/teams"
              className="text-sm font-medium text-primary hover:underline"
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
