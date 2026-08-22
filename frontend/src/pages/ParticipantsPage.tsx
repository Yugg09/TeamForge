import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export function ParticipantsPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Participants"
        description="Browse the cohort and add new members via free-text intake."
        actions={
          <span className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
            Intake form coming soon
          </span>
        }
      />
      <PagePlaceholder
        blocks={[
          {
            title: "Cohort list",
            description: "Searchable table of participants with role and ambition chips.",
          },
          {
            title: "Free-text intake",
            description: "Name + bio panel that posts to POST /api/participants.",
          },
          {
            title: "Profile preview",
            description: "Quick view of skills, availability, and preferences.",
          },
        ]}
        footer={
          <>
            Sample profile route:{" "}
            <Link
              to="/participants/p_11"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              /participants/p_11
            </Link>
          </>
        }
      />
    </section>
  );
}
