import { HowItWorks } from "@/components/landing/HowItWorks";
import { KeyBenefits } from "@/components/landing/KeyBenefits";
import { LandingCta } from "@/components/landing/LandingCta";
import { LandingHero } from "@/components/landing/LandingHero";
import { ProblemStatement } from "@/components/landing/ProblemStatement";
import { ValueProposition } from "@/components/landing/ValueProposition";

export function LandingPage() {
  return (
    <div>
      <LandingHero />
      <div className="mt-16 space-y-16 px-[max(1rem,2.5vw)] sm:mt-20 sm:space-y-20 lg:mt-24 lg:space-y-24">
        <ProblemStatement />
        <ValueProposition />
        <HowItWorks />
        <KeyBenefits />
        <LandingCta />
      </div>
    </div>
  );
}
