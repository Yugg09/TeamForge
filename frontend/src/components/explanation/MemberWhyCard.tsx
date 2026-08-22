import { Link } from "react-router-dom";
import type { MemberWhyContext } from "@/lib/team-why";
import {
  CANONICAL_SKILLS,
  proficiencyDisplay,
  ROLE_OPTIONS,
} from "@/lib/participant-constants";
import { ExplanationBullet } from "@/components/explanation/ExplanationPrimitives";

type MemberWhyCardProps = {
  member: MemberWhyContext;
};

function skillLabel(id: string): string {
  return CANONICAL_SKILLS.find((skill) => skill.id === id)?.label ?? id;
}

function roleLabel(role: string): string {
  return ROLE_OPTIONS.find((entry) => entry.value === role)?.label ?? role;
}

export function MemberWhyCard({ member }: MemberWhyCardProps) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            to={`/participants/${member.memberId}`}
            className="font-semibold hover:text-primary hover:underline underline-offset-4"
          >
            {member.name}
          </Link>
          <p className="text-xs text-muted-foreground">{member.memberId}</p>
        </div>
        {member.assignedRole ? (
          <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
            {roleLabel(member.assignedRole)}
          </span>
        ) : null}
      </div>

      <ul className="mt-3 space-y-2">
        {member.lines.map((line) => (
          <ExplanationBullet
            key={`${line.text}-${line.evidence}`}
            tone={line.tone}
            text={line.text}
            evidence={line.evidence}
          />
        ))}
      </ul>

      {member.skills.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Skills contributed
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {member.skills.map((skill) => (
              <li
                key={skill.id}
                className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs"
              >
                {skillLabel(skill.id)} · {proficiencyDisplay(skill.proficiency)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {member.satisfiedRequirements.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Project requirements satisfied
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {member.satisfiedRequirements.map((item) => (
              <li
                key={item}
                className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs text-primary"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
