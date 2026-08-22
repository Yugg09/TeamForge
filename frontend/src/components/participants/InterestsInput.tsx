import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { FormField } from "@/components/ui/form-field";

type InterestsInputProps = {
  interests: string[];
  error?: string;
  onChange: (interests: string[]) => void;
  disabled?: boolean;
};

export function InterestsInput({
  interests,
  error,
  onChange,
  disabled,
}: InterestsInputProps) {
  const [draft, setDraft] = useState("");

  const addInterest = () => {
    const trimmed = draft.trim().replace(/,$/, "");
    if (!trimmed) return;
    if (interests.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...interests, trimmed]);
    setDraft("");
  };

  const removeInterest = (interest: string) => {
    onChange(interests.filter((entry) => entry !== interest));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addInterest();
    }
  };

  return (
    <FormField
      label="Interests"
      hint="Press Enter or comma to add tags (e.g. design systems, NLP)."
      error={error}
    >
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add an interest"
              disabled={disabled}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            onClick={addInterest}
            disabled={disabled}
            className="shrink-0 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {interests.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <li
                key={interest}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-sm"
              >
                {interest}
                <button
                  type="button"
                  onClick={() => removeInterest(interest)}
                  disabled={disabled}
                  className="rounded-full p-0.5 hover:bg-background disabled:opacity-50"
                  aria-label={`Remove ${interest}`}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </FormField>
  );
}
