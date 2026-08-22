import { useState } from "react";
import { ArrowRight, Loader2, X } from "lucide-react";
import { useMoveMember } from "@/api/useTeamAdjust";
import { useFormedTeams } from "@/api/useFormTeams";
import { cn } from "@/lib/utils";

type MoveMemberModalProps = {
  memberId: string;
  memberName: string;
  currentTeamId: string;
  onClose: () => void;
};

export function MoveMemberModal({
  memberId,
  memberName,
  currentTeamId,
  onClose,
}: MoveMemberModalProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const moveMember = useMoveMember();
  const { data: response } = useFormedTeams();

  const teams = response?.teams ?? [];
  const currentTeam = teams.find((t) => t.id === currentTeamId);
  const availableTeams = teams.filter((t) => t.id !== currentTeamId);

  const handleMove = () => {
    if (!selectedTeamId) return;

    moveMember.mutate(
      {
        fromTeamId: currentTeamId,
        toTeamId: selectedTeamId,
        memberId,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <h2 className="text-lg font-semibold">Move {memberName}</h2>
            <p className="text-sm text-muted-foreground">
              Select a destination team
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {/* Current team */}
        <div className="border-b border-border px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Currently on
          </p>
          <p className="mt-1 text-sm font-medium">
            {currentTeam?.id ?? currentTeamId}
            <span className="ml-2 text-muted-foreground">
              ({currentTeam?.member_ids.length} members)
            </span>
          </p>
        </div>

        {/* Team selection */}
        <div className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Move to
          </p>
          <div className="mt-2 space-y-2">
            {availableTeams.map((team) => {
              const memberCount = team.member_ids.length;
              const score = Math.round(team.score.total * 100);

              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setSelectedTeamId(team.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition",
                    selectedTeamId === team.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:bg-accent/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{team.id}</span>
                    <span className="text-sm text-muted-foreground">
                      Score: {score}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {memberCount} members
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={!selectedTeamId || moveMember.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-60"
          >
            {moveMember.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ArrowRight className="size-4" aria-hidden />
            )}
            Move member
          </button>
        </div>
      </div>
    </div>
  );
}
