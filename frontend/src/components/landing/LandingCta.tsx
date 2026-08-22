import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function LandingCta() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-12 text-background sm:px-10 sm:py-14 lg:px-14 lg:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary/20 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 left-1/3 size-56 rounded-full bg-olive/15 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Ready to form teams that actually ship?
          </h2>
          <p className="text-sm leading-relaxed text-background/75 sm:text-base">
            Enter the demo to explore the cohort, form balanced teams, inspect
            scores, and run the live rebalancer — the full TeamForge experience.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-card"
        >
          Enter TeamForge
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
