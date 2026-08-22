import { useMemo, useState } from "react";
import { CandidateCard } from "@/components/candidates/CandidateCard";
import { CandidateFilters } from "@/components/candidates/CandidateFilters";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/state-panel";
import { Button } from "@/components/ui/button";
import { useCandidateSearch } from "@/api/use-candidates";
import { useParticipants } from "@/api/useParticipants";
import {
  DEFAULT_CANDIDATE_FILTERS,
  filterParticipants,
  type CandidateFilterState,
} from "@/lib/candidate-filters";

export function CandidateExplorer() {
  const [filters, setFilters] = useState<CandidateFilterState>(
    DEFAULT_CANDIDATE_FILTERS,
  );
  const [semanticInput, setSemanticInput] = useState("");
  const [activeSemanticQuery, setActiveSemanticQuery] = useState<string | null>(
    null,
  );

  const {
    data: cohort,
    isLoading: cohortLoading,
    isError: cohortError,
    error: cohortErrorDetail,
    refetch: refetchCohort,
  } = useParticipants();

  const {
    data: searchResults,
    isLoading: searchLoading,
    isError: searchError,
    error: searchErrorDetail,
    refetch: refetchSearch,
  } = useCandidateSearch(activeSemanticQuery);

  const filteredCohort = useMemo(
    () => filterParticipants(cohort ?? [], filters),
    [cohort, filters],
  );

  const semanticActive = activeSemanticQuery !== null;
  const displayed = semanticActive ? (searchResults ?? []) : filteredCohort;

  const handleSemanticSearch = () => {
    const trimmed = semanticInput.trim();
    if (trimmed.length >= 2) {
      setActiveSemanticQuery(trimmed);
    }
  };

  const handleClearSemanticSearch = () => {
    setActiveSemanticQuery(null);
    setSemanticInput("");
  };

  if (cohortLoading) {
    return (
      <LoadingState
        title="Loading candidates"
        description="Fetching cohort from GET /api/participants…"
      />
    );
  }

  if (cohortError) {
    return (
      <ErrorState
        title="Could not load candidates"
        description={cohortErrorDetail?.message ?? "Unknown error"}
      >
        <Button variant="secondary" size="sm" onClick={() => refetchCohort()}>
          Retry
        </Button>
      </ErrorState>
    );
  }

  return (
    <div className="space-y-6">
      <CandidateFilters
        filters={filters}
        onChange={setFilters}
        semanticQuery={semanticInput}
        onSemanticQueryChange={setSemanticInput}
        onSemanticSearch={handleSemanticSearch}
        onClearSemanticSearch={handleClearSemanticSearch}
        semanticActive={semanticActive}
        semanticLoading={searchLoading}
      />

      {semanticActive && searchLoading ? (
        <LoadingState
          title="Running semantic search"
          description={`GET /api/candidates/search?q=${activeSemanticQuery}`}
        />
      ) : semanticActive && searchError ? (
        <ErrorState
          title="Semantic search failed"
          description={searchErrorDetail?.message ?? "Unknown error"}
        >
          <Button variant="secondary" size="sm" onClick={() => refetchSearch()}>
            Retry search
          </Button>
        </ErrorState>
      ) : displayed.length === 0 ? (
        <EmptyState
          title="No candidates match"
          description={
            semanticActive
              ? "Try a different semantic search query."
              : "Adjust filters or add participants to the cohort."
          }
        />
      ) : (
        <>
          <p className="text-sm font-medium text-muted-foreground">
            Showing {displayed.length}{" "}
            {semanticActive ? "search result" : "candidate"}
            {displayed.length === 1 ? "" : "s"}
            {semanticActive ? "" : ` of ${cohort?.length ?? 0} in cohort`}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {displayed.map((participant) => (
              <li key={participant.id}>
                <CandidateCard participant={participant} variant="grid" />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
