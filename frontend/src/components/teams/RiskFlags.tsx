import type { Participant, RiskFlag } from "@/api/types";
import { formatRiskFlag } from "@/lib/team-explain";
import { cn } from "@/lib/utils";

type RiskFlagsProps = {
  flags: RiskFlag[];
  participants?: Participant[];
  className?: string;
  compact?: boolean;
};

function flagLabel(flag: RiskFlag, participants?: Participant[]): string {
  if (flag.kind === "single_point_of_failure" && participants) {
    const member = participants.find(
      (p) => p.id === flag.payload.member_id,
    );
    const name = member?.name ?? flag.payload.member_id;
    return `Single point of failure: ${flag.payload.skill} (${name})`;
  }
  if (flag.kind === "goal_mismatch" && participants) {
    const member = participants.find((p) => p.id === flag.payload.outlier_id);
    const name = member?.name ?? flag.payload.outlier_id;
    return `Goal mismatch: ${name}`;
  }
  if (flag.kind === "availability_gap") {
    const hours = Math.round(flag.payload.overlap_minutes / 60);
    return `Low availability overlap (${hours}h/week shared)`;
  }
  return formatRiskFlag(flag);
}

export function RiskFlags({
  flags,
  participants,
  className,
  compact = false,
}: RiskFlagsProps) {
  if (flags.length === 0) {
    return (
      <p
        className={cn(
          "rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        No risk flags on this team.
      </p>
    );
  }

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {flags.map((flag, index) => {
        const isWarning =
          flag.kind === "missing_role" ||
          flag.kind === "availability_gap" ||
          flag.kind === "single_point_of_failure";
        return (
          <li
            key={index}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium",
              compact ? "text-xs" : "",
              isWarning
                ? "border-destructive/35 bg-destructive/10 text-destructive"
                : "border-border bg-muted/50 text-foreground",
            )}
          >
            {flagLabel(flag, participants)}
          </li>
        );
      })}
    </ul>
  );
}
