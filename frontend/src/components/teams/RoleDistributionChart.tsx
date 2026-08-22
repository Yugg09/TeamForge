import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Team } from "@/api/types";
import { buildRoleDistribution } from "@/lib/team-display";

type RoleDistributionChartProps = {
  team: Team;
};

export function RoleDistributionChart({ team }: RoleDistributionChartProps) {
  const data = buildRoleDistribution(team);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-lg font-semibold">Role distribution</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Assigned roles per member from role_assignments.
      </p>
      {data.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No roles assigned.</p>
      ) : (
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
