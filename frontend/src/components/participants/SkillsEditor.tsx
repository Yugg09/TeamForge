import { Plus, Trash2 } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { SelectInput } from "@/components/ui/form-inputs";
import {
  CANONICAL_SKILLS,
  proficiencyLabel,
} from "@/lib/participant-constants";
import type { ParticipantFormErrors, SkillFormRow } from "@/lib/participant-form";

type SkillsEditorProps = {
  skills: SkillFormRow[];
  errors?: ParticipantFormErrors["skillRows"];
  onChange: (skills: SkillFormRow[]) => void;
  disabled?: boolean;
};

const PROFICIENCY_OPTIONS = [1, 2, 3, 4, 5].map((level) => ({
  value: level,
  label: `${level} — ${proficiencyLabel(level)}`,
}));

export function SkillsEditor({
  skills,
  errors,
  onChange,
  disabled,
}: SkillsEditorProps) {
  const addSkill = () => {
    onChange([
      ...skills,
      { id: CANONICAL_SKILLS[0]?.id ?? "react", proficiency: 3, verified: false },
    ]);
  };

  const updateSkill = (index: number, patch: Partial<SkillFormRow>) => {
    onChange(
      skills.map((skill, skillIndex) =>
        skillIndex === index ? { ...skill, ...patch } : skill,
      ),
    );
  };

  const removeSkill = (index: number) => {
    onChange(skills.filter((_, skillIndex) => skillIndex !== index));
  };

  return (
    <div className="space-y-3">
      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No skills added yet. Add skills with proficiency levels (1–5).
        </p>
      ) : null}

      {skills.map((skill, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <FormField label="Skill" error={errors?.[index]?.id}>
            <SelectInput
              value={skill.id}
              onChange={(value) => updateSkill(index, { id: value })}
              options={CANONICAL_SKILLS.map((entry) => ({
                value: entry.id,
                label: entry.label,
              }))}
              disabled={disabled}
            />
          </FormField>
          <FormField
            label="Proficiency"
            error={errors?.[index]?.proficiency}
          >
            <SelectInput
              value={skill.proficiency}
              onChange={(value) =>
                updateSkill(index, {
                  proficiency: Number(value) as SkillFormRow["proficiency"],
                })
              }
              options={PROFICIENCY_OPTIONS}
              disabled={disabled}
            />
          </FormField>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => removeSkill(index)}
              disabled={disabled}
              className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-sm text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              aria-label="Remove skill"
            >
              <Trash2 className="size-4" aria-hidden />
              Remove
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addSkill}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
      >
        <Plus className="size-4" aria-hidden />
        Add skill
      </button>
    </div>
  );
}
