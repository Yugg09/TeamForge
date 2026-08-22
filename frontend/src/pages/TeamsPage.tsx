import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export function TeamsPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Teams"
        description="Form balanced teams, review scores, and inspect coverage gaps."
        actions={
          <span className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
            Form teams action coming soon
          </span>
        }
      />
      <PagePlaceholder
        blocks={[
          {
            title: "Form teams",
            description: "Trigger POST /api/form-teams and animate the optimizer step log.",
          },
          {
            title: "Team cards",
            description: "Score, members, assigned roles, and risk-flag pips.",
          },
          {
            title: "Accept / reject",
            description: "Organizer controls for locking in a partition.",
          },
        ]}
        footer={
          <>
            Sample team route:{" "}
            <Link
              to="/teams/team_1"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              /teams/team_1
            </Link>
          </>
        }
      />
    </section>
  );
}
