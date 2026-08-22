import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <section className="space-y-8">
      <PageHeader
        title={id ? `Team ${id}` : "Team"}
        description="Score breakdown, coverage radar, explanations, and rebalancer entry."
        actions={
          <Link
            to="/teams"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to teams
          </Link>
        }
      />
      <PagePlaceholder
        blocks={[
          {
            title: "Score breakdown",
            description: "Named term bars and penalty deductions from TeamScore.",
          },
          {
            title: "Coverage radar",
            description: "Role-axis chart highlighting gaps and missing roles.",
          },
          {
            title: "Why this team",
            description: "Plain-language explanation derived from score terms and flags.",
          },
          {
            title: "Rebalancer",
            description: "Remove → gap flash → suggested replacement → heal flow.",
          },
        ]}
        footer={`Team detail for "${id ?? "unknown"}" will use data from the form-teams response.`}
      />
    </section>
  );
}
