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
import {
  AlertTriangle,
  CheckCircle2,
  Layers,
  Target,
  TrendingUp,
} from "lucide-react";
import type { Participant, RoleId, Team } from "@/api/types";
import { ROLE_OPTIONS, CANONICAL_SKILLS } from "@/lib/participant-constants";
import { cn } from "@/lib/utils";

type SkillGapDashboardProps = {
  team: Team;
  participants?: Participant[];
  className?: string;
};

// ---------- types ----------

type SkillInfo = {
  id: string;
  label: string;
  category: string;
  holders: { memberId: string; name: string; proficiency: number }[];
  avgProficiency: number;
  isRequired: boolean;
  status: "strong" | "adequate" | "weak" | "missing";
};

type RoleInfo = {
  role: RoleId;
  label: string;
  covered: boolean;
  memberCount: number;
  holders: string[];
};

// ---------- helpers ----------

function buildSkillMap(
  team: Team,
  participants: Participant[],
): Map<string, SkillInfo> {
  const memberMap = new Map(participants.map((p) => [p.id, p]));
  const teamMembers = team.member_ids
    .map((id) => memberMap.get(id))
    .filter(Boolean) as Participant[];

  const skillMap = new Map<string, SkillInfo>();

  // Collect all skills from team members
  for (const member of teamMembers) {
    for (const skill of member.skills ?? []) {
      const existing = skillMap.get(skill.id);
      if (existing) {
        existing.holders.push({
          memberId: member.id,
          name: member.name,
          proficiency: skill.proficiency,
        });
        existing.avgProficiency =
          existing.holders.reduce((sum, h) => sum + h.proficiency, 0) /
          existing.holders.length;
      } else {
        const skillMeta = CANONICAL_SKILLS.find((s) => s.id === skill.id);
        skillMap.set(skill.id, {
          id: skill.id,
          label: skillMeta?.label ?? skill.id,
          category: "skills",
          holders: [
            {
              memberId: member.id,
              name: member.name,
              proficiency: skill.proficiency,
            },
          ],
          avgProficiency: skill.proficiency,
          isRequired: false,
          status: skill.proficiency >= 4 ? "strong" : skill.proficiency >= 3 ? "adequate" : "weak",
        });
      }
    }
  }

  return skillMap;
}

function buildRoleInfo(team: Team, participants: Participant[]): RoleInfo[] {
  const memberMap = new Map(participants.map((p) => [p.id, p]));
  const assignments = team.role_assignments ?? {};

  return ROLE_OPTIONS.map((role) => {
    const holders = Object.entries(assignments)
      .filter(([, r]) => r === role.value)
      .map(([id]) => memberMap.get(id)?.name ?? id);

    return {
      role: role.value as RoleId,
      label: role.label,
      covered: holders.length > 0,
      memberCount: holders.length,
      holders,
    };
  });
}



// ---------- sub-components ----------

function RoleCoverageBar({ roles }: { roles: RoleInfo[] }) {
  const coveredCount = roles.filter((r) => r.covered).length;
  const totalCount = roles.length;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Target className="size-5 text-primary" aria-hidden />
        <h3 className="text-lg font-semibold">Role Coverage</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {coveredCount} of {totalCount} required roles covered
      </p>

      <div className="mt-4 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={roles}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" domain={[0, 1]} hide />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              width={80}
            />
            <Tooltip
              formatter={(value) => (Number(value) === 1 ? "Covered" : "Gap")}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="covered" radius={[0, 4, 4, 0]}>
              {roles.map((role) => (
                <Cell
                  key={role.role}
                  fill={role.covered ? "var(--primary)" : "var(--destructive)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Role details */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {roles.map((role) => (
          <div
            key={role.role}
            className={cn(
              "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
              role.covered
                ? "border-primary/20 bg-primary/5"
                : "border-destructive/20 bg-destructive/5",
            )}
          >
            <div className="flex items-center gap-2">
              {role.covered ? (
                <CheckCircle2 className="size-4 text-primary" aria-hidden />
              ) : (
                <AlertTriangle className="size-4 text-destructive" aria-hidden />
              )}
              <span className="font-medium">{role.label}</span>
            </div>
            <span
              className={cn(
                "text-xs",
                role.covered ? "text-primary" : "text-destructive",
              )}
            >
              {role.covered ? role.memberCount + " member" + (role.memberCount > 1 ? "s" : "") : "MISSING"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkillDepthChart({ skills }: { skills: SkillInfo[] }) {
  // Sort by status priority: missing > weak > adequate > strong
  const sorted = [...skills].sort((a, b) => {
    const order = { missing: 0, weak: 1, adequate: 2, strong: 3 };
    return order[a.status] - order[b.status];
  });

  // Take top 12 for readability
  const display = sorted.slice(0, 12);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Layers className="size-5 text-primary" aria-hidden />
        <h3 className="text-lg font-semibold">Skill Depth</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Proficiency levels across team skills (1-5 scale)
      </p>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={display} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              formatter={(value) => [
                `${value}/5`,
                "Avg Proficiency",
              ]}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="avgProficiency" radius={[4, 4, 0, 0]}>
              {display.map((skill) => (
                <Cell
                  key={skill.id}
                  fill={
                    skill.status === "strong"
                      ? "var(--primary)"
                      : skill.status === "adequate"
                        ? "hsl(45, 90%, 50%)"
                        : skill.status === "weak"
                          ? "hsl(25, 90%, 50%)"
                          : "var(--destructive)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-primary" /> Strong (4-5)
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-yellow-500" /> Adequate (3)
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-orange-500" /> Weak (2)
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-destructive" /> Missing (0-1)
        </span>
      </div>
    </section>
  );
}

function SkillOverlapMatrix({
  skills,
  team,
}: {
  skills: SkillInfo[];
  team: Team;
}) {
  // Find overlapping skills (held by 2+ members)
  const overlapping = skills.filter((s) => s.holders.length >= 2);
  // Find unique skills (held by 1 member)
  const unique = skills.filter((s) => s.holders.length === 1);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-5 text-primary" aria-hidden />
        <h3 className="text-lg font-semibold">Skill Overlap Analysis</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Shared vs unique skills across team members
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Overlapping skills */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Shared Skills ({overlapping.length})
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Skills held by multiple members — redundancy risk
          </p>
          {overlapping.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {overlapping.slice(0, 6).map((skill) => (
                <li
                  key={skill.id}
                  className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{skill.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {skill.holders.length} holders
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No skill overlap</p>
          )}
        </div>

        {/* Unique skills */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Unique Skills ({unique.length})
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Skills held by only one member — single point of failure
          </p>
          {unique.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {unique.slice(0, 6).map((skill) => (
                <li
                  key={skill.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{skill.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {skill.holders[0].name}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">All skills shared</p>
          )}
        </div>
      </div>

      {/* Team composition summary */}
      <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-xs font-medium text-muted-foreground">
          Team: {team.member_ids.length} members • {skills.length} unique skills •{" "}
          {overlapping.length} shared • {unique.length} single-holder
        </p>
      </div>
    </section>
  );
}

function SkillCategoryBreakdown({ skills }: { skills: SkillInfo[] }) {
  // Group skills by category
  const categories = new Map<string, SkillInfo[]>();
  for (const skill of skills) {
    const cat = skill.category;
    if (!categories.has(cat)) {
      categories.set(cat, []);
    }
    categories.get(cat)!.push(skill);
  }

  const categoryData = Array.from(categories.entries()).map(([cat, catSkills]) => ({
    category: cat.replace(/_/g, " "),
    count: catSkills.length,
    avgProficiency:
      catSkills.reduce((sum, s) => sum + s.avgProficiency, 0) / catSkills.length,
    strong: catSkills.filter((s) => s.status === "strong").length,
    weak: catSkills.filter((s) => s.status === "weak" || s.status === "missing").length,
  }));

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-lg font-semibold">Skill Categories</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Skills grouped by category with depth analysis
      </p>

      <div className="mt-4 space-y-2">
        {categoryData.map((cat) => (
          <div
            key={cat.category}
            className="rounded-lg border border-border bg-muted/20 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">{cat.category}</span>
              <span className="text-sm text-muted-foreground">
                {cat.count} skill{cat.count > 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs">
              <span className="text-primary">{cat.strong} strong</span>
              <span className="text-destructive">{cat.weak} weak</span>
              <span className="text-muted-foreground">
                avg: {cat.avgProficiency.toFixed(1)}/5
              </span>
            </div>
            {/* Depth bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${(cat.avgProficiency / 5) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- main component ----------

export function SkillGapDashboard({
  team,
  participants = [],
  className,
}: SkillGapDashboardProps) {
  const skills = buildSkillMap(team, participants);
  const roles = buildRoleInfo(team, participants);
  const skillArray = Array.from(skills.values());

  const strongCount = skillArray.filter((s) => s.status === "strong").length;
  const weakCount = skillArray.filter(
    (s) => s.status === "weak" || s.status === "missing",
  ).length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Skills</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{skillArray.length}</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
          <p className="text-xs text-primary">Strong (4-5)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-primary">{strongCount}</p>
        </div>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 shadow-sm">
          <p className="text-xs text-destructive">Weak/Missing</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-destructive">{weakCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Roles Covered</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {roles.filter((r) => r.covered).length}/{roles.length}
          </p>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RoleCoverageBar roles={roles} />
        <SkillDepthChart skills={skillArray} />
      </div>

      <SkillOverlapMatrix skills={skillArray} team={team} />
      <SkillCategoryBreakdown skills={skillArray} />
    </div>
  );
}
