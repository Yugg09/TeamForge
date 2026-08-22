import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Team } from "@/api/types";
import { buildRoleCoverage, scoreToDisplay } from "@/lib/team-display";

type SkillGapVisualizationProps = {
  team: Team;
};

export function SkillGapVisualization({ team }: SkillGapVisualizationProps) {
  const data = buildRoleCoverage(team);
  const roleGapsPenalty = team.score?.penalties?.role_gaps;
  const uncoveredCount = data.filter((point) => point.covered === 0).length;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-lg font-semibold">Skill gap map</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Role axes — filled when assigned, empty when missing (from role_assignments
        and flags).
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
          <p className="text-xs text-muted-foreground">Uncovered roles</p>
          <p className="text-xl font-semibold tabular-nums">{uncoveredCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
          <p className="text-xs text-muted-foreground">Coverage term</p>
          <p className="text-xl font-semibold tabular-nums">
            {team.score?.terms?.coverage !== undefined
              ? `${scoreToDisplay(team.score.terms.coverage)}%`
              : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
          <p className="text-xs text-muted-foreground">Role gaps penalty</p>
          <p className="text-xl font-semibold tabular-nums">
            {roleGapsPenalty !== undefined
              ? `${scoreToDisplay(roleGapsPenalty)}%`
              : "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 1]}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              formatter={(value) =>
                Number(value) === 1 ? "Covered" : "Gap"
              }
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="covered" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.role}
                  fill={
                    entry.covered === 1
                      ? "var(--primary)"
                      : "var(--destructive)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
