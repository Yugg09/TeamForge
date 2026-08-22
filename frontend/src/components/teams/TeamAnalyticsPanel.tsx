import { useMemo } from "react";
import type { Participant, Team } from "@/api/types";
import { ScoreBreakdown } from "@/components/teams/ScoreBreakdown";
import { SkillCoverageChart } from "@/components/teams/SkillCoverageChart";
import { SkillGapSection } from "@/components/teams/SkillGapSection";
import { SkillGapVisualization } from "@/components/teams/SkillGapVisualization";
import { TeamCompositionBreakdown } from "@/components/teams/TeamCompositionBreakdown";
import {
  TeamExplanation,
  TeamStrengthsWeaknesses,
} from "@/components/teams/TeamExplanation";
import { TeamMemberContributions } from "@/components/teams/TeamMemberContributions";
import { TeamScoreHero } from "@/components/teams/TeamScoreHero";
import { buildTeamInsights } from "@/lib/team-explain";

type TeamAnalyticsPanelProps = {
  team: Team;
  participants?: Participant[];
  fairnessOk?: boolean;
  heroLabel?: string;
};

export function TeamAnalyticsPanel({
  team,
  participants = [],
  fairnessOk,
  heroLabel = "Team analytics",
}: TeamAnalyticsPanelProps) {
  const insights = useMemo(() => {
    if (!team.score) return null;
    return buildTeamInsights(team.score);
  }, [team.score]);

  const score = team.score;

  if (!score) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        Team score data is not available for this team.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TeamScoreHero
        team={team}
        fairnessOk={fairnessOk}
        heroLabel={heroLabel}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SkillCoverageChart team={team} />
        <SkillGapVisualization team={team} />
      </div>

      <TeamCompositionBreakdown team={team} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ScoreBreakdown score={score} />
        <SkillGapSection score={score} />
      </div>

      {insights ? (
        <>
          <TeamStrengthsWeaknesses insights={insights} />
          <TeamExplanation insights={insights} />
        </>
      ) : null}

      <TeamMemberContributions team={team} participants={participants} />
    </div>
  );
}
