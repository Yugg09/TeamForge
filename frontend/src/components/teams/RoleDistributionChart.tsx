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
import { Card } from "@/components/ui/card";
import { buildRoleDistribution } from "@/lib/team-display";

type RoleSlice = {
  role: string;
  label: string;
  count: number;
};

type RoleDistributionChartProps = {
  team?: Team;
  slices?: RoleSlice[];
  title?: string;
  description?: string;
};

export function RoleDistributionChart({
  team,
  slices,
  title = "Role distribution",
  description = "Assigned roles per member from role_assignments.",
}: RoleDistributionChartProps) {
  const data = slices ?? (team ? buildRoleDistribution(team) : []);

  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
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
              <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
