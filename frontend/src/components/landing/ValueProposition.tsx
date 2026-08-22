import { LandingSection } from "@/components/landing/LandingSection";

const TEAM_A_ROLES = ["AI Engineer", "AI Engineer", "AI Engineer", "AI Engineer"];
const TEAM_B_ROLES = [
  "AI Engineer",
  "Backend Developer",
  "Frontend Developer",
  "UI/UX Designer",
];

export function ValueProposition() {
  return (
    <LandingSection
      variant="muted"
      title="TeamForge's core insight"
      description="We don't find the best individuals — we find the best combination. Our objective penalizes redundancy and rewards coverage, so balanced teams score above skill-stacked ones."
    >
      <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
        <article className="rounded-2xl border border-destructive/20 bg-background p-6 lg:p-7">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Naive top-skills team</h3>
            <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              Team A · 72
            </span>
          </div>
          <ul className="mt-5 space-y-2.5">
            {TEAM_A_ROLES.map((role, index) => (
              <li
                key={`${role}-${index}`}
                className="rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm"
              >
                {role}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            High individual scores, poor role coverage, heavy redundancy penalty.
          </p>
        </article>

        <article className="rounded-2xl border border-primary/25 bg-background p-6 shadow-sm ring-1 ring-primary/10 lg:p-7">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">TeamForge balanced team</h3>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Team B · 84
            </span>
          </div>
          <ul className="mt-5 space-y-2.5">
            {TEAM_B_ROLES.map((role) => (
              <li
                key={role}
                className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm"
              >
                {role}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Strong coverage and complementarity — the combination that actually
            ships.
          </p>
        </article>
      </div>
    </LandingSection>
  );
}
