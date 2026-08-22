import { HowItWorks } from "@/components/landing/HowItWorks";
import { KeyBenefits } from "@/components/landing/KeyBenefits";
import { LandingCta } from "@/components/landing/LandingCta";
import { LandingHero } from "@/components/landing/LandingHero";
import { ProblemStatement } from "@/components/landing/ProblemStatement";
import { ValueProposition } from "@/components/landing/ValueProposition";

export function LandingPage() {
  return (
    <div className="space-y-16 sm:space-y-20">
      <LandingHero />
      <ProblemStatement />
      <ValueProposition />
      <HowItWorks />
      <KeyBenefits />
      <LandingCta />
    </div>
  );
}
