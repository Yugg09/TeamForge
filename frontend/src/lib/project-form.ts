export type ProjectFormValues = {
  name: string;
  description: string;
};

export const EMPTY_PROJECT_FORM: ProjectFormValues = {
  name: "",
  description: "",
};

export type ProjectFormErrors = Partial<
  Record<keyof ProjectFormValues, string>
>;

export function validateProjectForm(values: ProjectFormValues): ProjectFormErrors {
  const errors: ProjectFormErrors = {};

  const trimmedName = values.name.trim();
  if (!trimmedName) {
    errors.name = "Project name is required.";
  } else if (trimmedName.length < 2) {
    errors.name = "Project name must be at least 2 characters.";
  }

  const trimmedDescription = values.description.trim();
  if (!trimmedDescription) {
    errors.description = "Project description is required for AI requirement extraction.";
  } else if (trimmedDescription.length < 20) {
    errors.description =
      "Description must be at least 20 characters so the extractor has enough context.";
  } else if (trimmedDescription.length > 4000) {
    errors.description = "Description must be 4000 characters or fewer.";
  }

  return errors;
}

export function hasProjectFormErrors(errors: ProjectFormErrors): boolean {
  return Boolean(errors.name) || Boolean(errors.description);
}

/** Maps form values to the wire contract — only `description` is sent. */
export function toProjectAnalyzeRequest(
  values: ProjectFormValues,
): { description: string } {
  return { description: values.description.trim() };
}
