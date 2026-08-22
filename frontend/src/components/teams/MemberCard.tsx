import { Link } from "react-router-dom";
import { ArrowRightLeft, HelpCircle } from "lucide-react";
import type { Participant, RoleId } from "@/api/types";
import { ROLE_OPTIONS } from "@/lib/participant-constants";
import { cn } from "@/lib/utils";

type MemberCardProps = {
  participant?: Participant;
  memberId: string;
  assignedRole?: RoleId;
  teamId?: string;
  onExplain?: (memberId: string, memberName: string) => void;
  onMove?: (memberId: string, memberName: string) => void;
  className?: string;
};

function roleLabel(role: RoleId): string {
  return ROLE_OPTIONS.find((entry) => entry.value === role)?.label ?? role;
}

export function MemberCard({
  participant,
  memberId,
  assignedRole,
  teamId,
  onExplain,
  onMove,
  className,
}: MemberCardProps) {
  const name = participant?.name ?? memberId;
  const topSkills = participant?.skills?.slice(0, 3) ?? [];

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            to={`/participants/${memberId}`}
            className="font-semibold hover:text-primary hover:underline underline-offset-4"
          >
            {name}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{memberId}</p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-medium",
            assignedRole
              ? "border-primary/20 bg-primary/5 text-primary"
              : "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          {assignedRole ? roleLabel(assignedRole) : "Unassigned"}
        </span>
      </div>

      {participant?.bio ? (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {participant.bio}
        </p>
      ) : null}

      {topSkills.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {topSkills.map((skill) => (
            <li
              key={skill.id}
              className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs"
            >
              {skill.id}
              <span className="text-muted-foreground"> · {skill.proficiency}/5</span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Action buttons */}
      {teamId && (onExplain || onMove) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {onExplain ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onExplain(memberId, name);
              }}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <HelpCircle className="size-3" aria-hidden />
              Why here?
            </button>
          ) : null}
          {onMove ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMove(memberId, name);
              }}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ArrowRightLeft className="size-3" aria-hidden />
              Move
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
