import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function LandingHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,oklch(0.94_0.04_264)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,oklch(0.88_0.08_264)_0%,transparent_40%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(oklch(0.55_0.12_264)_1px,transparent_1px)] [background-size:20px_20px]"
      />

      <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" aria-hidden />
            AI-powered hackathon team formation
          </p>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Build better teams,
              <span className="block text-primary">not just bigger teams.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              TeamForge uses intelligent optimization to partition your entire
              cohort into balanced hackathon teams — complementary skills, real
              availability, and explainable scores, not a leaderboard of
              individuals.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-95"
            >
              Enter TeamForge
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background/80 px-6 py-3 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              See how it works
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-background/80 p-5 shadow-inner backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            The question we answer
          </p>
          <blockquote className="mt-3 text-lg font-medium leading-snug sm:text-xl">
            Which combination of people will work best together for this
            specific hackathon?
          </blockquote>
          <div className="mt-6 grid grid-cols-2 gap-3 text-center text-sm">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="font-semibold text-destructive">4× AI Engineer</p>
              <p className="mt-1 text-xs text-muted-foreground">
                High skill sum, zero coverage
              </p>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="font-semibold text-primary">Balanced four</p>
              <p className="mt-1 text-xs text-muted-foreground">
                AI · Backend · Frontend · Design
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
