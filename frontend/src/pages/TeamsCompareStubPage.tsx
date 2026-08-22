import { PageHeader } from "@/components/layout/PageHeader";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export function TeamsCompareStubPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Compare teams"
        description="Phase 2 stub — side-by-side team comparison."
      />
      <PagePlaceholder
        blocks={[
          {
            title: "Coming in Phase 2",
            description:
              "Compare partition quality across teams with aligned score breakdowns and radar overlays.",
          },
        ]}
      />
    </section>
  );
}
