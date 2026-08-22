import type { Participant, Team } from "@/api/types";
import { MemberCard } from "@/components/teams/MemberCard";
import { getMemberAssignment } from "@/lib/team-display";

type TeamMemberContributionsProps = {
  team: Team;
  participants?: Participant[];
  onExplainMember?: (memberId: string, memberName: string) => void;
  onMoveMember?: (memberId: string, memberName: string) => void;
};

export function TeamMemberContributions({
  team,
  participants = [],
  onExplainMember,
  onMoveMember,
}: TeamMemberContributionsProps) {
  const participantMap = new Map(participants.map((p) => [p.id, p]));
  const memberIds = team.member_ids ?? [];

  if (memberIds.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        No members on this team yet.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header>
        <h3 className="text-lg font-semibold">Member contributions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Assigned roles from role_assignments — skills from participant profiles
          when available.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {memberIds.map((memberId) => {
          const assignedRole = getMemberAssignment(team, memberId);
          return (
            <li key={memberId}>
              <MemberCard
                memberId={memberId}
                assignedRole={assignedRole}
                participant={participantMap.get(memberId)}
                teamId={team.id}
                onExplain={onExplainMember}
                onMove={onMoveMember}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
