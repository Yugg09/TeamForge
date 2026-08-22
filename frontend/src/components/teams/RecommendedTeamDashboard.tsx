import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { MemberCard } from "@/components/teams/MemberCard";
import { RoleDistributionChart } from "@/components/teams/RoleDistributionChart";
import { ScoreBreakdown } from "@/components/teams/ScoreBreakdown";
import { SkillCoverageChart } from "@/components/teams/SkillCoverageChart";
import { SkillGapSection } from "@/components/teams/SkillGapSection";
import { TeamCard } from "@/components/teams/TeamCard";
import {
  TeamExplanation,
  TeamStrengthsWeaknesses,
} from "@/components/teams/TeamExplanation";
import { TeamScoreHero } from "@/components/teams/TeamScoreHero";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/state-panel";
import {
  formedTeamsQueryKey,
  useFormTeamsMutation,
} from "@/api/use-form-teams";
import { useParticipants } from "@/api/use-participants";
import { useQueryClient } from "@tanstack/react-query";
import type { FormTeamsResponse, Team } from "@/api/types";
import { getRecommendedTeam } from "@/lib/team-display";
import { buildTeamInsights } from "@/lib/team-explain";

export function RecommendedTeamDashboard() {
  const queryClient = useQueryClient();
  const formedData = queryClient.getQueryData<FormTeamsResponse>(
    formedTeamsQueryKey,
  );

  const formTeamsMutation = useFormTeamsMutation();
  const { data: participants } = useParticipants();

  const response = formedData ?? formTeamsMutation.data;
  const teams = useMemo(() => response?.teams ?? [], [response?.teams]);

  const defaultTeam = getRecommendedTeam(teams);
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();

  useEffect(() => {
    if (defaultTeam && !selectedTeamId) {
      setSelectedTeamId(defaultTeam.id);
    }
  }, [defaultTeam, selectedTeamId]);

  const selectedTeam: Team | undefined = useMemo(() => {
    if (teams.length === 0) return undefined;
    if (selectedTeamId) {
      return teams.find((team) => team.id === selectedTeamId) ?? defaultTeam;
    }
    return defaultTeam;
  }, [teams, selectedTeamId, defaultTeam]);

  const participantMap = useMemo(() => {
    const map = new Map(participants?.map((p) => [p.id, p]) ?? []);
    return map;
  }, [participants]);

  const insights = selectedTeam
    ? buildTeamInsights(selectedTeam.score)
    : null;

  const isLoading = formTeamsMutation.isPending;
  const isError = formTeamsMutation.isError;

  if (!response && !isLoading && !isError) {
    return (
      <EmptyState
        title="No recommended team yet"
        description="Form balanced teams from the cohort to populate this demo dashboard."
      >
        <button
          type="button"
          onClick={() => formTeamsMutation.mutate({ event_id: "demo" })}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95"
        >
          <Sparkles className="size-4" aria-hidden />
          Form teams (POST /api/form-teams)
        </button>
      </EmptyState>
    );
  }

  if (isLoading && !response) {
    return (
      <LoadingState
        title="Forming teams"
        description="Partitioning cohort via POST /api/form-teams…"
      />
    );
  }

  if (isError && !response) {
    return (
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
    );
  }

  if (!selectedTeam || !insights) {
    return (
      <EmptyState
        title="No team data"
        description="The form-teams response did not include any teams."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {teams.length} team{teams.length === 1 ? "" : "s"} in partition ·{" "}
          <Link to="/teams" className="font-medium text-primary hover:underline">
            View all teams
          </Link>
        </p>
        <button
          type="button"
          onClick={() => formTeamsMutation.mutate({ event_id: "demo" })}
          disabled={formTeamsMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          {formTeamsMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
          Re-form teams
        </button>
      </div>

      {teams.length > 1 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              selected={team.id === selectedTeam.id}
              onSelect={() => setSelectedTeamId(team.id)}
            />
          ))}
        </div>
      ) : null}

      <TeamScoreHero team={selectedTeam} fairnessOk={response?.fairness_ok} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SkillCoverageChart team={selectedTeam} />
        <RoleDistributionChart team={selectedTeam} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScoreBreakdown score={selectedTeam.score} />
        <SkillGapSection score={selectedTeam.score} />
      </div>

      <TeamStrengthsWeaknesses insights={insights} />
      <TeamExplanation insights={insights} />

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Team members</h3>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {selectedTeam.member_ids.map((memberId) => (
            <li key={memberId}>
              <MemberCard
                memberId={memberId}
                assignedRole={
                  selectedTeam.role_assignments[memberId] ?? "frontend"
                }
                participant={participantMap.get(memberId)}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
