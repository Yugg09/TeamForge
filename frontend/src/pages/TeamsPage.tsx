import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { ScoreClimb } from "@/components/teams/ScoreClimb";
import { TeamCard } from "@/components/teams/TeamCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/ui/state-panel";
import { useFormedTeams, useFormTeamsMutation } from "@/api/useFormTeams";
import { useParticipants } from "@/api/useParticipants";
import type { StepLogEntry } from "@/api/types";
import { cn } from "@/lib/utils";

export function TeamsPage() {
  const { data: response } = useFormedTeams();
  const formTeamsMutation = useFormTeamsMutation();
  const { data: participants } = useParticipants();
  const [climbLog, setClimbLog] = useState<StepLogEntry[] | null>(null);

  const teams = response?.teams ?? formTeamsMutation.data?.teams ?? [];

  const runFormTeams = () => {
    formTeamsMutation.mutate(
      { event_id: "demo", min_size: 3, max_size: 5 },
      {
        onSuccess: (data) => {
          if (data.step_log.length > 0) {
            setClimbLog(data.step_log);
          }
        },
      },
    );
  };

  const isLoading = formTeamsMutation.isPending && teams.length === 0 && !climbLog;
  const isError = formTeamsMutation.isError && teams.length === 0;

  return (
    <section className="space-y-8">
      <PageHeader
        title="Teams"
        description="Form balanced teams, watch the score climb, then explore each partition."
        actions={
          <Button
            onClick={runFormTeams}
            disabled={formTeamsMutation.isPending}
          >
            <Sparkles className="size-4" aria-hidden />
            {formTeamsMutation.isPending ? "Forming…" : "Form teams"}
          </Button>
        }
      />

      {climbLog ? (
        <ScoreClimb
          stepLog={climbLog}
          onComplete={() => setClimbLog(null)}
        />
      ) : null}

      {isLoading ? (
        <LoadingSkeleton title="Forming teams" rows={4} />
      ) : isError ? (
        <ErrorState
          title="Could not form teams"
          description={formTeamsMutation.error?.message ?? "Unknown error"}
        >
          <Button variant="secondary" size="sm" onClick={runFormTeams}>
            Retry
          </Button>
        </ErrorState>
      ) : teams.length === 0 ? (
        <EmptyState
          title="No teams formed yet"
          description="Run the optimizer to partition the cohort into balanced teams."
        >
          <Button onClick={runFormTeams}>
            <Sparkles className="size-4" aria-hidden />
            Form teams
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {response?.fairness_ok !== undefined ? (
            <Card
              className={cn(
                "px-4 py-3",
                response.fairness_ok
                  ? "border-primary/25 bg-primary/5"
                  : "border-destructive/25 bg-destructive/5",
              )}
            >
              <p
                className={
                  response.fairness_ok
                    ? "text-sm font-medium text-primary"
                    : "text-sm font-medium text-destructive"
                }
              >
                Fairness:{" "}
                {response.fairness_ok ? "everyone placed" : "review placement"}
              </p>
            </Card>
          ) : null}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <li key={team.id}>
                <TeamCard
                  team={team}
                  participants={participants ?? []}
                />
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Demo path: open{" "}
            <Link
              to="/teams/team_1"
              className="font-medium text-primary hover:underline"
            >
              team_1
            </Link>
            , remove Alex (p_04), accept Jordan (p_47).
          </p>
        </div>
      )}
    </section>
  );
}
