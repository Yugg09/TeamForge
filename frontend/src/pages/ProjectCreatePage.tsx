import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectCreateForm } from "@/components/projects/ProjectCreateForm";

export function ProjectCreatePage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Create project"
        description="Define a hackathon project brief and extract structured requirements with the AI analysis endpoint."
      />
      <ProjectCreateForm />
    </section>
  );
}
