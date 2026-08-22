import type { Participant, Team } from "@/api/types";
import { RiskFlags } from "@/components/teams/RiskFlags";
import { ScoreBreakdown } from "@/components/teams/ScoreBreakdown";
import { SkillRadar } from "@/components/teams/SkillRadar";
import { TeamMemberContributions } from "@/components/teams/TeamMemberContributions";
import { TeamScoreHero } from "@/components/teams/TeamScoreHero";
import { WhyThisTeam } from "@/components/teams/WhyThisTeam";
import { Link } from "react-router-dom";

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

      <div className="flex flex-wrap gap-3">
        <Link
          to={`/rebalance/${team.id}`}
          className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
        >
          Open rebalancer
        </Link>
      </div>

      <WhyThisTeam score={score} />

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

      <TeamMemberContributions team={team} participants={participants} />
    </div>
  );
}
