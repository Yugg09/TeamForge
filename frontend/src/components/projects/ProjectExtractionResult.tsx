import type { ProjectAnalyzeResponse } from "@/api/types";
import { CANONICAL_SKILLS, ROLE_OPTIONS } from "@/lib/participant-constants";

type ProjectExtractionResultProps = {
  projectName: string;
  result: ProjectAnalyzeResponse;
  onCreateAnother: () => void;
};

function skillLabel(id: string): string {
  return CANONICAL_SKILLS.find((skill) => skill.id === id)?.label ?? id;
}

function roleLabel(role: string): string {
  return ROLE_OPTIONS.find((entry) => entry.value === role)?.label ?? role;
}

export function ProjectExtractionResult({
  projectName,
  result,
  onCreateAnother,
}: ProjectExtractionResultProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 sm:p-6">
        <p className="text-sm font-medium text-primary">Requirements extracted</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">{projectName}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          AI analysis from POST /api/projects/analyze — ready for project-anchored
          team formation when the backend connects.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold">Domain</h3>
        <p className="mt-2 text-muted-foreground">{result.domain}</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold">Required skills</h3>
        {result.required_skills.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {result.required_skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-border bg-muted/40 px-3 py-1 text-sm"
              >
                {skillLabel(skill)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">None identified.</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold">Required roles</h3>
        {result.roles.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {result.roles.map((role) => (
              <li
                key={role}
                className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary"
              >
                {roleLabel(role)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">None identified.</p>
        )}
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCreateAnother}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Analyze another project
        </button>
      </div>
    </div>
  );
}
