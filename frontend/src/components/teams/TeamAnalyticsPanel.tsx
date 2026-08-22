import { useState } from "react";
import type { Participant, Team } from "@/api/types";
import { MemberExplanationPanel } from "@/components/teams/MemberExplanationPanel";
import { MoveMemberModal } from "@/components/teams/MoveMemberModal";
import { TeamActions } from "@/components/teams/TeamActions";
import { RiskFlags } from "@/components/teams/RiskFlags";
import { ScoreBreakdown } from "@/components/teams/ScoreBreakdown";
import { SkillGapDashboard } from "@/components/teams/SkillGapDashboard";
import { SkillRadar } from "@/components/teams/SkillRadar";
import { TeamRecommendations } from "@/components/teams/TeamRecommendations";
import { TeamExplanation } from "@/components/teams/TeamExplanation";
import { TeamMemberContributions } from "@/components/teams/TeamMemberContributions";
import { TeamScoreHero } from "@/components/teams/TeamScoreHero";
import { WhyThisTeam } from "@/components/teams/WhyThisTeam";
import { buildTeamInsights } from "@/lib/team-explain";
import { Link } from "react-router-dom"

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
  const [explainMember, setExplainMember] = useState<{ id: string; name: string } | null>(null);
  const [moveMember, setMoveMember] = useState<{ id: string; name: string } | null>(null);
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

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={`/rebalance/${team.id}`}
          className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
        >
          Open rebalancer
        </Link>
        <TeamActions teamId={team.id} isLocked={false} />
      </div>

      <WhyThisTeam score={score} />
      <TeamExplanation teamId={team.id} insights={buildTeamInsights(score)} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SkillRadar team={team} />
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Risk flags</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            From TeamScore.flags — missing roles and viability risks.
          </p>
          <RiskFlags
            flags={score.flags}
            participants={participants}
            className="mt-4"
          />
        </section>
      </div>

      <ScoreBreakdown score={score} />

      <SkillGapDashboard team={team} participants={participants} />

      <TeamRecommendations teamId={team.id} />

      <TeamMemberContributions
        team={team}
        participants={participants}
        onExplainMember={(id, name) => setExplainMember({ id, name })}
        onMoveMember={(id, name) => setMoveMember({ id, name })}
      />

      {/* Member explanation panel */}
      {explainMember ? (
        <MemberExplanationPanel
          teamId={team.id}
          memberId={explainMember.id}
          memberName={explainMember.name}
          onClose={() => setExplainMember(null)}
        />
      ) : null}

      {/* Move member modal */}
      {moveMember ? (
        <MoveMemberModal
          memberId={moveMember.id}
          memberName={moveMember.name}
          currentTeamId={team.id}
          onClose={() => setMoveMember(null)}
        />
      ) : null}
    </div>
  );
}
