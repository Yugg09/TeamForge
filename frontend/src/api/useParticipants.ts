import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createParticipant,
  fetchParticipants,
} from "@/api/participants-api";
import type { Participant, ParticipantIn } from "@/api/types";

export const participantsQueryKey = ["participants"] as const;

export function useParticipants() {
  return useQuery({
    queryKey: participantsQueryKey,
    queryFn: async () => {
      const response = await fetchParticipants();
      return response.participants;
    },
  });
}

export function useParticipant(id: string | undefined) {
  const query = useParticipants();
  const participant = id
    ? query.data?.find((entry) => entry.id === id)
    : undefined;

  return {
    ...query,
    participant,
    isNotFound: query.isSuccess && id !== undefined && participant === undefined,
  };
}

export function useCreateParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ParticipantIn) => createParticipant(body),
    onSuccess: (created: Participant) => {
      queryClient.setQueryData<Participant[]>(
        participantsQueryKey,
        (current) => (current ? [...current, created] : [created]),
      );
    },
  });
}
