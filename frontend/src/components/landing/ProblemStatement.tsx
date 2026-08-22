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
      <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
        <blockquote className="rounded-2xl border border-border/80 bg-muted/40 px-6 py-8 text-lg font-medium leading-relaxed lg:px-8 lg:py-10 lg:text-xl lg:leading-relaxed">
          A group of highly skilled individuals still fails when everyone shares
          the same skills, when frontend, design, or deployment roles are
          missing, or when the team literally cannot meet.
        </blockquote>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {PAIN_POINTS.map((point) => (
            <li
              key={point}
              className="flex gap-3 rounded-xl border border-border/80 bg-card px-5 py-4 text-sm leading-relaxed shadow-sm"
            >
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full bg-destructive"
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
