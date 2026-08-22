import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createParticipant,
  deleteParticipant,
  fetchParticipants,
  updateParticipant,
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

export function useUpdateParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ParticipantIn }) =>
      updateParticipant(id, body),
    onSuccess: (updated: Participant) => {
      queryClient.setQueryData<Participant[]>(
        participantsQueryKey,
        (current) =>
          current?.map((p) => (p.id === updated.id ? updated : p)),
      );
    },
  });
}

export function useDeleteParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteParticipant(id),
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData<Participant[]>(
        participantsQueryKey,
        (current) => current?.filter((p) => p.id !== deletedId),
      );
    },
  });
}
