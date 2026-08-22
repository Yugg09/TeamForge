import { PageHeader } from "@/components/layout/PageHeader";
import { RecommendedTeamDashboard } from "@/components/teams/RecommendedTeamDashboard";

export function DashboardPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Recommended team"
        description="Primary demo view — optimizer output from POST /api/form-teams with score breakdown, coverage, gaps, and explanation."
      />
      <RecommendedTeamDashboard />
    </section>
  );
}
