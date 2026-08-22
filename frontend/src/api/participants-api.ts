import { apiFetch } from "@/api/client";
import type {
  Participant,
  ParticipantIn,
  ParticipantsResponse,
} from "@/api/types";

export async function fetchParticipants(): Promise<ParticipantsResponse> {
  return apiFetch<ParticipantsResponse>("/api/participants");
}

export async function createParticipant(
  body: ParticipantIn,
): Promise<Participant> {
  return apiFetch<Participant>("/api/participants", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
