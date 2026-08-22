import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { Team } from "@/api/types";
import { buildRoleCoverage } from "@/lib/team-display";

type SkillCoverageChartProps = {
  team: Team;
};

export function SkillCoverageChart({ team }: SkillCoverageChartProps) {
  const data = buildRoleCoverage(team);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-lg font-semibold">Role coverage</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Role axes from assigned roles — low axes indicate gaps.
      </p>
      <div className="mt-4 h-64 w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Radar
              name="Covered"
              dataKey="covered"
              stroke="var(--primary)"
              fill="var(--primary)"
              fillOpacity={0.35}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
