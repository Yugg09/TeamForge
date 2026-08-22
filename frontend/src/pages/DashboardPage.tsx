import { PageHeader } from "@/components/layout/PageHeader";
import { CohortDashboard } from "@/components/teams/CohortDashboard";

export function DashboardPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Cohort dashboard"
        description="Overview of the cohort, role distribution, fairness, and per-team health."
      />
      <CohortDashboard />
    </section>
  );
}
