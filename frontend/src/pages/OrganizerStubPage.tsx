import { PageHeader } from "@/components/layout/PageHeader";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export function OrganizerStubPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Organizer"
        description="Phase 2 stub — event organizer controls."
      />
      <PagePlaceholder
        blocks={[
          {
            title: "Coming in Phase 2",
            description:
              "Organizer tools for cohort import, constraints, and fairness tuning.",
          },
        ]}
      />
    </section>
  );
}
