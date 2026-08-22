import { PageHeader } from "@/components/layout/PageHeader";
import { CandidateExplorer } from "@/components/candidates/CandidateExplorer";

export function CandidatesPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Candidate explorer"
        description="Browse the cohort, filter by role and skills, or run semantic search when the backend endpoint is live."
      />
      <CandidateExplorer />
    </section>
  );
}
