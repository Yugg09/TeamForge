import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { Team } from "@/api/types";
import { buildRoleCoverage, scoreToDisplay } from "@/lib/team-display";

type SkillCoverageChartProps = {
  team: Team;
};

export function SkillCoverageChart({ team }: SkillCoverageChartProps) {
  const data = buildRoleCoverage(team);
  const coverageTerm = team.score?.terms?.coverage;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Role coverage</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Assigned roles on each axis — engine coverage term shown when present.
          </p>
        </div>
        {coverageTerm !== undefined ? (
          <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            Coverage term: {scoreToDisplay(coverageTerm)}
          </span>
        ) : null}
      </div>
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
