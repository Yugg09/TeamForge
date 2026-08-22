import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function LandingCta() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-10 text-primary-foreground shadow-lg sm:px-10 sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary-foreground/10 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 left-1/3 size-56 rounded-full bg-primary-foreground/5 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3 max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to form teams that actually ship?
          </h2>
          <p className="text-primary-foreground/85 text-sm leading-relaxed sm:text-base">
            Enter the demo to explore the cohort, form balanced teams, inspect
            scores, and run the live rebalancer — the full TeamForge experience.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary shadow-md transition hover:opacity-95"
        >
          Enter TeamForge
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
