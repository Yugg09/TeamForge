import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export function ParticipantDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <section className="space-y-8">
      <PageHeader
        title={id ? `Participant ${id}` : "Participant"}
        description="Skills, availability (local + UTC), ambitions, and work-style preferences."
        actions={
          <Link
            to="/participants"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to cohort
          </Link>
        }
      />
      <PagePlaceholder
        blocks={[
          {
            title: "Skills & proficiency",
            description: "Canonical skills with 1–5 proficiency and verification badges.",
          },
          {
            title: "Availability",
            description: "Weekly windows shown in local time with UTC reference.",
          },
          {
            title: "Goals & style",
            description: "Ambition, work style, sync preference, and interests.",
          },
        ]}
        footer={`Profile detail for participant ID "${id ?? "unknown"}" will load from GET /api/participants.`}
      />
    </section>
  );
}
