import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/api/client";
import { useCreateParticipant } from "@/api/use-participants";
import { AvailabilityEditor } from "@/components/participants/AvailabilityEditor";
import { InterestsInput } from "@/components/participants/InterestsInput";
import { RoleCheckboxGroup } from "@/components/participants/RoleCheckboxGroup";
import { SkillsEditor } from "@/components/participants/SkillsEditor";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { SelectInput, TextArea, TextInput } from "@/components/ui/form-inputs";
import {
  AMBITION_OPTIONS,
  SYNC_PREF_OPTIONS,
  TIMEZONE_PRESETS,
  WORK_STYLE_OPTIONS,
} from "@/lib/participant-constants";
import {
  EMPTY_PARTICIPANT_FORM,
  hasParticipantFormErrors,
  type ParticipantFormErrors,
  type ParticipantFormValues,
  toParticipantIn,
  validateParticipantForm,
} from "@/lib/participant-form";

type ParticipantProfileFormProps = {
  onSuccess?: (participantId: string) => void;
};

export function ParticipantProfileForm({ onSuccess }: ParticipantProfileFormProps) {
  const [values, setValues] = useState<ParticipantFormValues>(
    EMPTY_PARTICIPANT_FORM,
  );
  const [errors, setErrors] = useState<ParticipantFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createParticipant = useCreateParticipant();

  const update = <K extends keyof ParticipantFormValues>(
    key: K,
    value: ParticipantFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validateParticipantForm(values);
    setErrors(validationErrors);
    if (hasParticipantFormErrors(validationErrors)) {
      return;
    }

    try {
      const created = await createParticipant.mutateAsync(toParticipantIn(values));
      setValues(EMPTY_PARTICIPANT_FORM);
      setErrors({});
      onSuccess?.(created.id);
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Failed to save participant. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <FormSection
        title="Basic information"
        description="Name and experience help TeamForge understand each participant."
      >
        <FormField
          label="Name"
          htmlFor="participant-name"
          required
          error={errors.name}
        >
          <TextInput
            id="participant-name"
            value={values.name}
            onChange={(value) => update("name", value)}
            placeholder="Riya Sharma"
            disabled={createParticipant.isPending}
          />
        </FormField>
        <FormField
          label="Experience & background"
          htmlFor="participant-bio"
          hint="Free-text bio — the backend can parse this into structured skills and roles."
          error={errors.bio}
        >
          <TextArea
            id="participant-bio"
            value={values.bio}
            onChange={(value) => update("bio", value)}
            placeholder="Final-year CS student, love React and design systems, shipped two hackathon projects…"
            disabled={createParticipant.isPending}
          />
        </FormField>
        <FormField
          label="Timezone"
          htmlFor="participant-timezone"
          hint="Used to show availability in local time and convert to UTC for the API."
          error={errors.timezone_offset_min}
        >
          <SelectInput
            id="participant-timezone"
            value={values.timezone_offset_min}
            onChange={(value) => update("timezone_offset_min", Number(value))}
            options={TIMEZONE_PRESETS.map((preset) => ({
              value: preset.offset,
              label: preset.label,
            }))}
            disabled={createParticipant.isPending}
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Skills"
        description="Proficiency (1–5) is required — presence alone is not enough."
      >
        <SkillsEditor
          skills={values.skills}
          errors={errors.skillRows}
          onChange={(skills) => update("skills", skills)}
          disabled={createParticipant.isPending}
        />
      </FormSection>

      <FormSection
        title="Roles & interests"
        description="Preferred hackathon roles and topics you want to work on."
      >
        <FormField label="Preferred roles">
          <RoleCheckboxGroup
            value={values.preferred_roles ?? []}
            onChange={(roles) => update("preferred_roles", roles)}
            disabled={createParticipant.isPending}
          />
        </FormField>
        <InterestsInput
          interests={values.interests}
          error={errors.interests}
          onChange={(interests) => update("interests", interests)}
          disabled={createParticipant.isPending}
        />
      </FormSection>

      <FormSection
        title="Availability"
        description="Weekly windows in your local timezone — stored as UTC on the wire."
      >
        <AvailabilityEditor
          windows={values.availability}
          errors={errors.availabilityRows}
          onChange={(availability) => update("availability", availability)}
          disabled={createParticipant.isPending}
        />
      </FormSection>

      <FormSection
        title="Working style & goals"
        description="Ambition and collaboration preferences factor into team scoring."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Ambition">
            <SelectInput
              value={values.ambition ?? "ship"}
              onChange={(value) =>
                update("ambition", value as ParticipantFormValues["ambition"])
              }
              options={AMBITION_OPTIONS}
              disabled={createParticipant.isPending}
            />
          </FormField>
          <FormField label="Work style">
            <SelectInput
              value={values.work_style ?? "planner"}
              onChange={(value) =>
                update("work_style", value as ParticipantFormValues["work_style"])
              }
              options={WORK_STYLE_OPTIONS}
              disabled={createParticipant.isPending}
            />
          </FormField>
          <FormField label="Collaboration">
            <SelectInput
              value={values.sync_pref ?? "sync"}
              onChange={(value) =>
                update("sync_pref", value as ParticipantFormValues["sync_pref"])
              }
              options={SYNC_PREF_OPTIONS}
              disabled={createParticipant.isPending}
            />
          </FormField>
        </div>
      </FormSection>

      {submitError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={createParticipant.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 disabled:opacity-60"
        >
          {createParticipant.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Add participant"
          )}
        </button>
      </div>
    </form>
  );
}
