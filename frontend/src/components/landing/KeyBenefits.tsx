import {
  CalendarCheck,
  Eye,
  Scale,
  ShieldAlert,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { LandingSection } from "@/components/landing/LandingSection";

const BENEFITS = [
  {
    icon: Sparkles,
    title: "AI-powered intake",
    description:
      "Free-text bios become structured skills, roles, and interests — fast onboarding for large cohorts.",
  },
  {
    icon: UsersRound,
    title: "Complementary teams",
    description:
      "Reward skill diversity and role coverage; penalize stacking five identical experts on one team.",
  },
  {
    icon: CalendarCheck,
    title: "Real availability",
    description:
      "Shared meeting windows are a hard constraint — teams that cannot meet are rejected, not down-ranked.",
  },
  {
    icon: Scale,
    title: "Fairness guaranteed",
    description:
      "Everyone is placed exactly once. No orphans, no non-viable teams left hidden in the results.",
  },
  {
    icon: ShieldAlert,
    title: "Gap detection",
    description:
      "Missing roles and single points of failure surface as explicit risk flags before demo day.",
  },
  {
    icon: Eye,
    title: "Explainable scores",
    description:
      "Coverage, complementarity, goals, and penalties are labeled — judges see the reasoning, not just a number.",
  },
] as const;

export function KeyBenefits() {
  return (
    <LandingSection
      title="Why organizers choose TeamForge"
      description="Built for hackathon demos where team quality must be obvious in seconds — and defensible under questioning."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {BENEFITS.map((benefit) => (
          <FeatureCard key={benefit.title} {...benefit} />
        ))}
      </div>
    </LandingSection>
  );
}
