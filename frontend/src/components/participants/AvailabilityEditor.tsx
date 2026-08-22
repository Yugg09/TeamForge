import { Plus, Trash2 } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { TextInput } from "@/components/ui/form-inputs";
import { DAY_OPTIONS } from "@/lib/participant-constants";
import type {
  AvailabilityFormRow,
  ParticipantFormErrors,
} from "@/lib/participant-form";
import { minutesToTimeLabel, timeLabelToMinutes } from "@/lib/participant-form";

type AvailabilityEditorProps = {
  windows: AvailabilityFormRow[];
  errors?: ParticipantFormErrors["availabilityRows"];
  onChange: (windows: AvailabilityFormRow[]) => void;
  disabled?: boolean;
};

export function AvailabilityEditor({
  windows,
  errors,
  onChange,
  disabled,
}: AvailabilityEditorProps) {
  const addWindow = () => {
    onChange([
      ...windows,
      { day: 1, start_local: 18 * 60, end_local: 21 * 60 },
    ]);
  };

  const updateWindow = (
    index: number,
    patch: Partial<AvailabilityFormRow>,
  ) => {
    onChange(
      windows.map((window, windowIndex) =>
        windowIndex === index ? { ...window, ...patch } : window,
      ),
    );
  };

  const removeWindow = (index: number) => {
    onChange(windows.filter((_, windowIndex) => windowIndex !== index));
  };

  return (
    <div className="space-y-3">
      {windows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No availability windows yet. Add when you are typically free to meet.
        </p>
      ) : null}

      {windows.map((window, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <FormField label="Day" error={errors?.[index]?.day}>
            <select
              value={window.day}
              onChange={(event) =>
                updateWindow(index, {
                  day: Number(event.target.value) as AvailabilityFormRow["day"],
                })
              }
              disabled={disabled}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {DAY_OPTIONS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Start (local)" error={errors?.[index]?.start_local}>
            <TextInput
              value={minutesToTimeLabel(window.start_local)}
              onChange={(value) => {
                const minutes = timeLabelToMinutes(value);
                if (minutes !== null) {
                  updateWindow(index, { start_local: minutes });
                }
              }}
              placeholder="18:00"
              disabled={disabled}
            />
          </FormField>
          <FormField label="End (local)" error={errors?.[index]?.end_local}>
            <TextInput
              value={minutesToTimeLabel(window.end_local)}
              onChange={(value) => {
                const minutes = timeLabelToMinutes(value);
                if (minutes !== null) {
                  updateWindow(index, { end_local: minutes });
                }
              }}
              placeholder="21:00"
              disabled={disabled}
            />
          </FormField>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => removeWindow(index)}
              disabled={disabled}
              className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-sm text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              aria-label="Remove availability window"
            >
              <Trash2 className="size-4" aria-hidden />
              Remove
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addWindow}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
      >
        <Plus className="size-4" aria-hidden />
        Add availability window
      </button>
    </div>
  );
}