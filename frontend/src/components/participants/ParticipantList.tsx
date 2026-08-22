import { Link } from "react-router-dom";
import type { Participant } from "@/api/types";
import { ROLE_OPTIONS } from "@/lib/participant-constants";

type ParticipantListProps = {
  participants: Participant[];
};

function ambitionLabel(ambition: string | undefined): string {
  switch (ambition) {
    case "win":
      return "Win";
    case "learn":
      return "Learn";
    default:
      return "Ship";
  }
}

export function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-sm">
      {participants.map((participant) => (
        <li key={participant.id}>
          <Link
            to={`/participants/${participant.id}`}
            className="flex flex-col gap-2 px-4 py-4 transition hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{participant.name}</p>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {participant.bio || "No bio yet"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {ambitionLabel(participant.ambition)}
              </span>
              {participant.preferred_roles?.slice(0, 2).map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  {ROLE_OPTIONS.find((entry) => entry.value === role)?.label ??
                    role}
                </span>
              ))}
              <span className="text-xs text-muted-foreground">
                {participant.skills?.length ?? 0} skills
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
