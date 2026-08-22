import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { RoleId, Team } from "@/api/types";
import { buildRoleCoverage, scoreToDisplay } from "@/lib/team-display";
import { cn } from "@/lib/utils";

type SkillRadarProps = {
  team: Team;
  highlightedRoles?: RoleId[];
  gapFlash?: boolean;
  className?: string;
};

export function SkillRadar({
  team,
  highlightedRoles = [],
  gapFlash = false,
  className,
}: SkillRadarProps) {
  const data = buildRoleCoverage(team).map((point) => ({
    ...point,
    highlight: highlightedRoles.includes(point.role),
  }));
  const coverageTerm = team.score?.terms?.coverage;

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm transition",
        gapFlash && "border-destructive/50 ring-2 ring-destructive/20",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Skill radar</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Role coverage axes — low or missing axes indicate gaps.
          </p>
        </div>
        {coverageTerm !== undefined ? (
          <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            Coverage: {scoreToDisplay(coverageTerm)}
          </span>
        ) : null}
      </div>
      <div className="mt-4 h-64 w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="label"
              tick={({ x, y, payload }) => {
                const point = data.find((d) => d.label === payload.value);
                const isGap = point?.highlight || point?.covered === 0;
                return (
                  <text
                    x={x}
                    y={y}
                    fill={
                      isGap && gapFlash
                        ? "var(--destructive)"
                        : isGap
                          ? "var(--destructive)"
                          : "var(--muted-foreground)"
                    }
                    fontSize={11}
                    fontWeight={isGap ? 600 : 400}
                    textAnchor="middle"
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <Radar
              name="Covered"
              dataKey="covered"
              stroke={gapFlash ? "var(--destructive)" : "var(--primary)"}
              fill={gapFlash ? "var(--destructive)" : "var(--primary)"}
              fillOpacity={gapFlash ? 0.2 : 0.35}
              isAnimationActive
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
