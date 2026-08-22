import { Brain, LineChart, RefreshCw, Users } from "lucide-react";
import { LandingSection } from "@/components/landing/LandingSection";

const STEPS = [
  {
    step: "01",
    icon: Users,
    title: "Understand the cohort",
    description:
      "Collect profiles, skills, availability, and free-text bios. AI extracts structured capabilities from natural language.",
  },
  {
    step: "02",
    icon: Brain,
    title: "Optimize the partition",
    description:
      "Partition the entire cohort into teams using a scoring engine — coverage, complementarity, goals, and hard availability constraints.",
  },
  {
    step: "03",
    icon: LineChart,
    title: "Explain every team",
    description:
      "Named score terms, penalties, and risk flags show why each team was formed — transparent, not a black box.",
  },
  {
    step: "04",
    icon: RefreshCw,
    title: "Rebalance live",
    description:
      "Remove a key member, see the gap flash, accept a suggested replacement, and watch the team heal with live score feedback.",
  },
] as const;

export function HowItWorks() {
  return (
    <LandingSection
      id="how-it-works"
      title="How TeamForge works"
      description="From intake to optimized teams in four steps — intelligence at the combination level, not the individual level."
    >
      <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STEPS.map(({ step, icon: Icon, title, description }) => (
          <li
            key={step}
            className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <span className="text-xs font-bold tabular-nums text-primary">
                {step}
              </span>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </LandingSection>
  );
}
