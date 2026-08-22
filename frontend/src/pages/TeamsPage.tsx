import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { TeamCard } from "@/components/teams/TeamCard";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/state-panel";
import { useFormedTeams, useFormTeamsMutation } from "@/api/use-form-teams";

export function TeamsPage() {
  const { data: response } = useFormedTeams();
  const formTeamsMutation = useFormTeamsMutation();
  const teams = response?.teams ?? formTeamsMutation.data?.teams ?? [];

  const isLoading = formTeamsMutation.isPending && teams.length === 0;
  const isError = formTeamsMutation.isError && teams.length === 0;

  return (
    <section className="space-y-8">
      <PageHeader
        title="Teams"
        description="Formed teams from POST /api/form-teams — open any team for full analytics."
        actions={
          <button
            type="button"
            onClick={() => formTeamsMutation.mutate({ event_id: "demo" })}
            disabled={formTeamsMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-60"
          >
            <Sparkles className="size-4" aria-hidden />
            {formTeamsMutation.isPending ? "Forming…" : "Form teams"}
          </button>
        }
      />

      {isLoading ? (
        <LoadingState
          title="Forming teams"
          description="Partitioning cohort via POST /api/form-teams…"
        />
      ) : isError ? (
        <ErrorState
          title="Could not form teams"
          description={formTeamsMutation.error?.message ?? "Unknown error"}
        >
          <button
            type="button"
            onClick={() => formTeamsMutation.mutate({ event_id: "demo" })}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            Retry
          </button>
        </ErrorState>
      ) : teams.length === 0 ? (
        <EmptyState
          title="No teams formed yet"
          description="Run the optimizer to partition the cohort into balanced teams."
        >
          <button
            type="button"
            onClick={() => formTeamsMutation.mutate({ event_id: "demo" })}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Sparkles className="size-4" aria-hidden />
            Form teams
          </button>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {response?.fairness_ok !== undefined ? (
            <p
              className={
                response.fairness_ok
                  ? "text-sm text-primary"
                  : "text-sm text-destructive"
              }
            >
              Fairness:{" "}
              {response.fairness_ok ? "everyone placed" : "review placement"}
            </p>
          ) : null}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <li key={team.id}>
                <TeamCard team={team} />
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Open a team for the full analytics panel — e.g.{" "}
            <Link
              to={`/teams/${teams[0]?.id}`}
              className="font-medium text-primary hover:underline"
            >
              /teams/{teams[0]?.id}
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
