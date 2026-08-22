import type { Team } from "@/api/types";
import {
  buildCompositionSummary,
  scoreToDisplay,
} from "@/lib/team-display";
import { RoleDistributionChart } from "@/components/teams/RoleDistributionChart";

type TeamCompositionBreakdownProps = {
  team: Team;
};

export function TeamCompositionBreakdown({ team }: TeamCompositionBreakdownProps) {
  const summary = buildCompositionSummary(team);

  const stats = [
    {
      label: "Members",
      value: String(summary.memberCount),
      hint: "member_ids",
    },
    {
      label: "Role assignments",
      value: String(summary.assignedRoleCount),
      hint: "role_assignments",
    },
    {
      label: "Coverage score",
      value:
        summary.coverageTerm !== undefined
          ? `${scoreToDisplay(summary.coverageTerm)}`
          : "—",
      hint: "score.terms.coverage",
    },
    {
      label: "Risk flags",
      value: String(summary.flagCount),
      hint: "score.flags",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
          </article>
        ))}
      </div>
      <RoleDistributionChart team={team} />
    </section>
  );
}
