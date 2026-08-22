import { useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { TeamConstellation } from "@/components/landing/constellation/TeamConstellation";
import type { ConstellationPointer } from "@/components/landing/constellation/constellation-data";

export function LandingHero() {
  const pointer = useRef<ConstellationPointer>({ x: 0, y: 0 });

  return (
    <section className="relative isolate min-h-[34rem] overflow-hidden rounded-[1.75rem] border border-border bg-background sm:min-h-[38rem] lg:h-[min(700px,88vh)] lg:min-h-[42rem]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_20%,#ffffff_0%,transparent_42%),radial-gradient(ellipse_at_88%_35%,#f0f0f0_0%,transparent_52%),linear-gradient(180deg,#fafafa_0%,#f4f4f4_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#0a0a0a_0.7px,transparent_0.7px)] [background-size:26px_26px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[8%] top-[12%] size-[32rem] rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative grid h-full min-h-[inherit] items-center gap-8 px-5 py-10 sm:px-8 sm:py-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-6 lg:px-10 lg:py-0 xl:px-14">
        <div className="z-10 max-w-xl space-y-8 lg:space-y-9">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-medium text-primary backdrop-blur-md sm:text-sm">
            <Sparkles className="size-3.5" aria-hidden />
            AI-powered hackathon team formation
          </p>

          <div className="space-y-5">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-[4.6rem] lg:leading-[1.02]">
              Build better teams,
              <span className="mt-1 block text-primary">
                not just bigger teams.
              </span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-[1.2rem] lg:leading-relaxed">
              TeamForge uses intelligent optimization to partition your entire
              cohort into balanced hackathon teams — complementary skills, real
              availability, and explainable scores, not a leaderboard of
              individuals.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Enter TeamForge
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-foreground/20 bg-background px-8 py-3.5 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              See how it works
            </a>
          </div>
        </div>

        <aside className="relative h-[22rem] w-full min-w-0 sm:h-[26rem] lg:h-full lg:min-h-[42rem]">
          <TeamConstellation pointer={pointer} />

          <div className="pointer-events-none absolute bottom-5 left-5 right-5 max-w-sm rounded-2xl border border-border bg-card/70 p-4 backdrop-blur-xl sm:bottom-8 sm:left-8 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
              The question we answer
            </p>
            <p className="mt-2 text-sm font-medium leading-snug text-foreground/90 sm:text-[15px]">
              Which combination of people will work best together for this
              specific hackathon?
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
