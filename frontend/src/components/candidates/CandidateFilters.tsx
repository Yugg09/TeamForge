import type { RoleId } from "@/api/types";
import { TextInput } from "@/components/ui/form-inputs";
import {
  CANONICAL_SKILLS,
  ROLE_OPTIONS,
} from "@/lib/participant-constants";
import type { CandidateFilterState } from "@/lib/candidate-filters";

type CandidateFiltersProps = {
  filters: CandidateFilterState;
  onChange: (filters: CandidateFilterState) => void;
  semanticQuery: string;
  onSemanticQueryChange: (value: string) => void;
  onSemanticSearch: () => void;
  onClearSemanticSearch: () => void;
  semanticActive: boolean;
  semanticLoading?: boolean;
  disabled?: boolean;
};

export function CandidateFilters({
  filters,
  onChange,
  semanticQuery,
  onSemanticQueryChange,
  onSemanticSearch,
  onClearSemanticSearch,
  semanticActive,
  semanticLoading,
  disabled,
}: CandidateFiltersProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <div className="space-y-1.5">
          <label
            htmlFor="candidate-text-filter"
            className="text-sm font-medium"
          >
            Filter cohort
          </label>
          <TextInput
            id="candidate-text-filter"
            value={filters.text}
            onChange={(value) => onChange({ ...filters, text: value })}
            placeholder="Name, skills, interests…"
            disabled={disabled || semanticActive}
          />
          <p className="text-xs text-muted-foreground">
            Client-side filter on the loaded cohort (GET /api/participants).
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="candidate-role-filter" className="text-sm font-medium">
            Preferred role
          </label>
          <select
            id="candidate-role-filter"
            value={filters.role}
            onChange={(event) =>
              onChange({
                ...filters,
                role: event.target.value as RoleId | "all",
              })
            }
            disabled={disabled || semanticActive}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <option value="all">All roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="candidate-skill-filter" className="text-sm font-medium">
            Skill
          </label>
          <select
            id="candidate-skill-filter"
            value={filters.skill}
            onChange={(event) =>
              onChange({
                ...filters,
                skill: event.target.value,
              })
            }
            disabled={disabled || semanticActive}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <option value="all">All skills</option>
            {CANONICAL_SKILLS.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-medium">Semantic search (API)</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Uses GET /api/candidates/search?q=… when the backend search endpoint is
          available.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <TextInput
            value={semanticQuery}
            onChange={onSemanticQueryChange}
            placeholder="e.g. React designer with ML interest"
            disabled={disabled}
            className="sm:flex-1"
          />
          <button
            type="button"
            onClick={onSemanticSearch}
            disabled={disabled || semanticLoading || semanticQuery.trim().length < 2}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-50"
          >
            {semanticLoading ? "Searching…" : "Semantic search"}
          </button>
          {semanticActive ? (
            <button
              type="button"
              onClick={onClearSemanticSearch}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Back to cohort
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
