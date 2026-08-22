import { ArrowRight, Layers3, Scale, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const HIGHLIGHTS = [
  {
    icon: Layers3,
    title: "Global optimization",
    description:
      "Partition the whole cohort into balanced teams — coverage and complementarity over skill stacking.",
  },
  {
    icon: Scale,
    title: "Fair by design",
    description:
      "Everyone placed, viability enforced, and gaps surfaced honestly instead of hidden.",
  },
  {
    icon: Sparkles,
    title: "Explainable scores",
    description:
      "Named terms, penalties, and risk flags make team quality legible at a glance.",
  },
] as const;

export function LandingPage() {
  return (
    <section className="space-y-12">
      <div className="space-y-6 text-center sm:text-left">
        <p className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          Hackathon demo · cohort partitioning
        </p>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Build better teams,
            <span className="block text-primary">not just bigger teams.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:mx-0">
            TeamForge composes balanced hackathon teams from your whole cohort —
            optimizing coverage, availability, and goals, then explaining every
            decision.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95"
          >
            Enter demo
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            to="/teams"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent"
          >
            View teams
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
          <article
            key={title}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden />
            </div>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
