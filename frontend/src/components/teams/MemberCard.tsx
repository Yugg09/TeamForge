import { Link } from "react-router-dom";
import type { Participant, RoleId } from "@/api/types";
import { ROLE_OPTIONS } from "@/lib/participant-constants";
import { cn } from "@/lib/utils";

type MemberCardProps = {
  participant?: Participant;
  memberId: string;
  assignedRole: RoleId;
  className?: string;
};

function roleLabel(role: RoleId): string {
  return ROLE_OPTIONS.find((entry) => entry.value === role)?.label ?? role;
}

export function MemberCard({
  participant,
  memberId,
  assignedRole,
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
        <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
          {roleLabel(assignedRole)}
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
    </article>
  );
}
