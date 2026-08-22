import type { TeamWhyContext } from "@/lib/team-why";
import { MemberWhyCard } from "@/components/explanation/MemberWhyCard";
import { ExplanationBullet } from "@/components/explanation/ExplanationPrimitives";

type WhyThisTeamPanelProps = {
  context: TeamWhyContext;
};

export function WhyThisTeamPanel({ context }: WhyThisTeamPanelProps) {
  return (
    <section className="space-y-6 rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-card p-5 shadow-sm sm:p-6">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Why this team?
        </p>
        <h2 className="text-xl font-semibold leading-snug sm:text-2xl">
          {context.headline}
        </h2>
        {context.projectDomain ? (
          <p className="text-sm text-muted-foreground">
            Project context: {context.projectDomain} (from POST /api/projects/analyze)
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Evidence from TeamScore, role_assignments, and participant profiles.
            Run project analyze to map requirements per member.
          </p>
        )}
      </header>

      {context.scoreDisplay !== null ? (
        <div className="inline-flex rounded-xl border border-primary/25 bg-background px-4 py-3">
          <span className="text-3xl font-bold tabular-nums text-primary">
            {context.scoreDisplay}
          </span>
          <span className="ml-2 self-end text-sm text-muted-foreground">
            / 100 team score
          </span>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="font-semibold">Why the team was selected</h3>
        <ul className="space-y-2">
          {context.teamLines.map((line) => (
            <ExplanationBullet
              key={`${line.text}-${line.evidence}`}
              tone={line.tone}
              text={line.text}
              evidence={line.evidence}
            />
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Complementary coverage</h3>
        {context.complementarity.score !== null ? (
          <p className="text-sm text-muted-foreground">
            Complementarity score term:{" "}
            <span className="font-semibold text-foreground">
              {context.complementarity.score}%
            </span>
          </p>
        ) : null}
        <ul className="space-y-2">
          {context.complementarity.lines.map((line) => (
            <ExplanationBullet
              key={`${line.text}-${line.evidence}`}
              tone={line.tone}
              text={line.text}
              evidence={line.evidence}
            />
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Still missing</h3>
        {context.missingItems.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            No gaps flagged in score.flags or role coverage.
          </p>
        ) : (
          <ul className="space-y-2">
            {context.missingItems.map((line) => (
              <ExplanationBullet
                key={`${line.text}-${line.evidence}`}
                tone={line.tone}
                text={line.text}
                evidence={line.evidence}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Why each member</h3>
        <ul className="grid gap-4 lg:grid-cols-2">
          {context.members.map((member) => (
            <li key={member.memberId}>
              <MemberWhyCard member={member} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
