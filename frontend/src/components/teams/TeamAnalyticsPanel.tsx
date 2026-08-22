import { useMemo } from "react";
import type { Participant, Team } from "@/api/types";
import { WhyThisTeamPanel } from "@/components/explanation/WhyThisTeamPanel";
import { useProjectRequirements } from "@/api/use-projects";
import { ScoreBreakdown } from "@/components/teams/ScoreBreakdown";
import { SkillCoverageChart } from "@/components/teams/SkillCoverageChart";
import { SkillGapSection } from "@/components/teams/SkillGapSection";
import { SkillGapVisualization } from "@/components/teams/SkillGapVisualization";
import { TeamCompositionBreakdown } from "@/components/teams/TeamCompositionBreakdown";
import { TeamMemberContributions } from "@/components/teams/TeamMemberContributions";
import { TeamScoreHero } from "@/components/teams/TeamScoreHero";
import { buildTeamWhyContext } from "@/lib/team-why";

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
  const { data: projectRequirements } = useProjectRequirements();

  const whyContext = useMemo(() => {
    if (!team.score) return null;
    return buildTeamWhyContext(
      team,
      participants,
      projectRequirements ?? undefined,
    );
  }, [team, participants, projectRequirements]);

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

      {whyContext ? <WhyThisTeamPanel context={whyContext} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <SkillCoverageChart team={team} />
        <SkillGapVisualization team={team} />
      </div>

      <TeamCompositionBreakdown team={team} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ScoreBreakdown score={score} />
        <SkillGapSection score={score} />
      </div>

      <TeamMemberContributions team={team} participants={participants} />
    </div>
  );
}
