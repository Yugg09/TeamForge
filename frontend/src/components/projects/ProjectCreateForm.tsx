import { useState, type FormEvent } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { ApiError } from "@/api/client";
import { useAnalyzeProject } from "@/api/use-projects";
import { ProjectExtractionResult } from "@/components/projects/ProjectExtractionResult";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { TextArea, TextInput } from "@/components/ui/form-inputs";
import type { ProjectAnalyzeResponse } from "@/api/types";
import {
  EMPTY_PROJECT_FORM,
  hasProjectFormErrors,
  type ProjectFormErrors,
  type ProjectFormValues,
  toProjectAnalyzeRequest,
  validateProjectForm,
} from "@/lib/project-form";

export function ProjectCreateForm() {
  const [values, setValues] = useState<ProjectFormValues>(EMPTY_PROJECT_FORM);
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<
    ProjectAnalyzeResponse | null
  >(null);

  const analyzeProject = useAnalyzeProject();

  const update = <K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const resetFlow = () => {
    setValues(EMPTY_PROJECT_FORM);
    setErrors({});
    setSubmitError(null);
    setSavedName(null);
    setExtractionResult(null);
    analyzeProject.reset();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validateProjectForm(values);
    setErrors(validationErrors);
    if (hasProjectFormErrors(validationErrors)) {
      return;
    }

    try {
      const result = await analyzeProject.mutateAsync(
        toProjectAnalyzeRequest(values),
      );
      setSavedName(values.name.trim());
      setExtractionResult(result);
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Failed to analyze project. Please try again.");
      }
    }
  };

  if (extractionResult && savedName) {
    return (
      <ProjectExtractionResult
        projectName={savedName}
        result={extractionResult}
        onCreateAnother={resetFlow}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <FormSection
        title="Project brief"
        description="Describe your hackathon project. The backend AI extractor receives only the description field on the wire."
      >
        <FormField
          label="Project name"
          htmlFor="project-name"
          required
          hint="Organizer label — stored in the UI only until a project persistence endpoint exists."
          error={errors.name}
        >
          <TextInput
            id="project-name"
            value={values.name}
            onChange={(value) => update("name", value)}
            placeholder="TeamForge Demo — Smart Campus App"
            disabled={analyzeProject.isPending}
          />
        </FormField>
        <FormField
          label="Project description"
          htmlFor="project-description"
          required
          hint="Include goals, tech stack, features, and constraints. Sent as description to POST /api/projects/analyze."
          error={errors.description}
        >
          <TextArea
            id="project-description"
            value={values.description}
            onChange={(value) => update("description", value)}
            placeholder="We want to build an AI-powered campus assistant with a React frontend, Python backend, and real-time chat. Need strong ML skills, designers for UX, and people available evenings UTC…"
            rows={6}
            disabled={analyzeProject.isPending}
          />
        </FormField>
      </FormSection>

      <FormSection
        title="What the AI will extract"
        description="After submission, the API returns structured requirements — not editable in this step."
      >
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Domain", detail: "Project category or problem space" },
            { label: "Required skills", detail: "Canonical skill ids from your brief" },
            { label: "Required roles", detail: "Hackathon roles to cover" },
          ].map((item) => (
            <li
              key={item.label}
              className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm"
            >
              <p className="font-medium">{item.label}</p>
              <p className="mt-1 text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ul>
      </FormSection>

      {submitError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={analyzeProject.isPending}>
          {analyzeProject.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Extracting requirements…
            </>
          ) : (
            <>
              <Sparkles className="size-4" aria-hidden />
              Extract requirements
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
