import type { Participant, RoleId } from "@/api/types";

export type CandidateFilterState = {
  text: string;
  role: RoleId | "all";
  skill: string | "all";
};

export const DEFAULT_CANDIDATE_FILTERS: CandidateFilterState = {
  text: "",
  role: "all",
  skill: "all",
};

export function filterParticipants(
  participants: Participant[],
  filters: CandidateFilterState,
): Participant[] {
  const text = filters.text.trim().toLowerCase();

  return participants.filter((participant) => {
    if (filters.role !== "all") {
      const roles = participant.preferred_roles ?? [];
      if (!roles.includes(filters.role)) {
        return false;
      }
    }

    if (filters.skill !== "all") {
      const skills = participant.skills ?? [];
      if (!skills.some((skill) => skill.id === filters.skill)) {
        return false;
      }
    }

    if (!text) {
      return true;
    }

    const haystack = [
      participant.name,
      participant.bio ?? "",
      ...(participant.interests ?? []),
      ...(participant.skills?.map((skill) => skill.id) ?? []),
      ...(participant.preferred_roles ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(text);
  });
}
