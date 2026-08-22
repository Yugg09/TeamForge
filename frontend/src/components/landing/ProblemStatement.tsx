import { LandingSection } from "@/components/landing/LandingSection";

const PAIN_POINTS = [
  "Friends-and-networks grouping leaves gaps and duplicates.",
  "Keyword skill-matching stacks the same roles on one team.",
  "Ranking individuals ignores who actually works together.",
  "Random assignment ignores availability and ambition entirely.",
] as const;

export function ProblemStatement() {
  return (
    <LandingSection
      id="problem"
      title="The problem with how teams are formed today"
      description="Most hackathons still pick people, not combinations. That leaves critical roles empty, skills stacked redundantly, and teams that can never find overlapping hours to meet."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <blockquote className="rounded-xl border border-border bg-muted/40 p-6 text-lg font-medium leading-relaxed">
          A group of highly skilled individuals still fails when everyone shares
          the same skills, when frontend, design, or deployment roles are
          missing, or when the team literally cannot meet.
        </blockquote>
        <ul className="space-y-3">
          {PAIN_POINTS.map((point) => (
            <li
              key={point}
              className="flex gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm"
            >
              <span
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive"
                aria-hidden
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </LandingSection>
  );
}
