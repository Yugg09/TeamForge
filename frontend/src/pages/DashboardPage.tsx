import { PageHeader } from "@/components/layout/PageHeader";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export function DashboardPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Cohort overview — role distribution, fairness status, and per-team health."
      />
      <PagePlaceholder
        blocks={[
          {
            title: "Role distribution",
            description: "Bar or donut chart of assigned roles across formed teams.",
          },
          {
            title: "Fairness status",
            description: "Banner showing whether every participant is placed and every team is viable.",
          },
          {
            title: "Team health",
            description: "At-a-glance cards for each team score and flagged risks.",
          },
        ]}
        footer="Dashboard widgets will connect to form-teams and participant data in a later phase."
      />
    </section>
  );
}
