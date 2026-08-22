import { AlertTriangle } from "lucide-react";
import type { TeamScore } from "@/api/types";
import { formatRiskFlag } from "@/lib/team-explain";

type SkillGapSectionProps = {
  score: TeamScore;
};

export function SkillGapSection({ score }: SkillGapSectionProps) {
  const flags = score.flags ?? [];
  const gapFlags = flags.filter(
    (flag) =>
      flag.kind === "missing_role" ||
      flag.kind === "single_point_of_failure" ||
      flag.kind === "availability_gap",
  );

  const missingRoles = flags.filter((flag) => flag.kind === "missing_role");

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle
          className="size-5 text-destructive"
          aria-hidden
        />
        <h3 className="text-lg font-semibold">Skill gaps & risks</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        From TeamScore.flags — missing roles and viability risks surfaced by the
        engine.
      </p>

      {missingRoles.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Missing roles
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {missingRoles.map((flag, index) => (
              <li
                key={index}
                className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive"
              >
                {formatRiskFlag(flag)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {gapFlags.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No skill-gap flags on this team.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {gapFlags.map((flag, index) => (
            <li
              key={index}
              className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm"
            >
              {formatRiskFlag(flag)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
