import { CandidateCard } from "@/components/candidates/CandidateCard";
import type { Participant } from "@/api/types";

type ParticipantListProps = {
  participants: Participant[];
};

export function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <ul className="grid gap-3">
      {participants.map((participant) => (
        <li key={participant.id}>
          <CandidateCard participant={participant} variant="compact" />
        </li>
      ))}
    </ul>
  );
}
