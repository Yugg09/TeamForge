import { useEffect, useMemo, useState } from "react";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import type { Participant, RebalanceResponse, RoleId, Team } from "@/api/types";
import { useRebalanceMutation } from "@/api/useRebalance";
import { MemberCard } from "@/components/teams/MemberCard";
import { RiskFlags } from "@/components/teams/RiskFlags";
import { ScoreBreakdown } from "@/components/teams/ScoreBreakdown";
import { SkillRadar } from "@/components/teams/SkillRadar";
import { ROLE_OPTIONS } from "@/lib/participant-constants";
import { getMemberAssignment, scoreToDisplay } from "@/lib/team-display";
import { cn } from "@/lib/utils";

type RebalancerProps = {
  team: Team;
  participants: Participant[];
};

function roleLabel(role: RoleId): string {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}

function ScoreTransition({
  before,
  after,
  healed,
}: {
  before: number;
  after: number;
  healed?: boolean;
}) {
  const [display, setDisplay] = useState(scoreToDisplay(before));

  useEffect(() => {
    const target = scoreToDisplay(after);
    const start = scoreToDisplay(before);
    setDisplay(start);
    const startTime = performance.now();
    const duration = 900;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const value = Math.round(start + (target - start) * t);
      setDisplay(value);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [before, after]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground tabular-nums">
        {scoreToDisplay(before)}
      </span>
      <span className="text-muted-foreground">→</span>
      <span
        className={cn(
          "text-3xl font-bold tabular-nums transition-colors",
          healed ? "text-primary" : "text-destructive",
        )}
      >
        {display}
      </span>
    </div>
  );
}

export function Rebalancer({ team, participants }: RebalancerProps) {
  const rebalanceMutation = useRebalanceMutation();
  const [lastResponse, setLastResponse] = useState<RebalanceResponse | null>(
    null,
  );
  const [gapFlash, setGapFlash] = useState(false);
  const [healed, setHealed] = useState(false);

  const currentTeam = rebalanceMutation.data?.team ?? team;

  const highlightedRoles = useMemo(() => {
    const roles: RoleId[] = [];
    for (const flag of currentTeam.score.flags) {
      if (flag.kind === "missing_role") roles.push(flag.payload.role);
    }
    if (lastResponse?.gap_flag?.kind === "missing_role") {
      roles.push(lastResponse.gap_flag.payload.role);
    }
    return roles;
  }, [currentTeam.score.flags, lastResponse]);

  const suggestedId =
    rebalanceMutation.data?.suggested_replacement_id ??
    lastResponse?.suggested_replacement_id;
  const suggested = participants.find((p) => p.id === suggestedId);

  const handleRemove = (memberId: string) => {
    setHealed(false);
    rebalanceMutation.mutate(
      { team_id: currentTeam.id, remove_member_id: memberId },
      {
        onSuccess: (data) => {
          setLastResponse(data);
          setGapFlash(true);
        },
      },
    );
  };

  const handleAccept = () => {
    if (!suggestedId) return;
    rebalanceMutation.mutate(
      { team_id: currentTeam.id, accept_replacement_id: suggestedId },
      {
        onSuccess: (data) => {
          setLastResponse(data);
          setGapFlash(false);
          setHealed(true);
        },
      },
    );
  };

  const participantMap = new Map(participants.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 to-card p-5">
        <h2 className="text-xl font-semibold">Rebalancer</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Remove a member, watch the gap flash, accept the suggested replacement,
          and see the team heal.
        </p>
        {lastResponse ? (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Score transition
            </p>
            <ScoreTransition
              before={lastResponse.score_before}
              after={lastResponse.score_after}
              healed={healed}
            />
          </div>
        ) : (
          <p className="mt-4 text-3xl font-bold tabular-nums text-primary">
            {scoreToDisplay(currentTeam.score.total)}
          </p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <SkillRadar
          team={currentTeam}
          highlightedRoles={highlightedRoles}
          gapFlash={gapFlash}
        />
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Risk flags</h3>
          <RiskFlags
            flags={currentTeam.score.flags}
            participants={participants}
            className="mt-3"
          />
          {gapFlash && lastResponse?.gap_flag?.kind === "missing_role" ? (
            <p
              className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive animate-pulse"
            >
              Missing: {roleLabel(lastResponse.gap_flag.payload.role)}
            </p>
          ) : healed ? (
            <p
              className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary"
            >
              Team healed — gap cleared
            </p>
          ) : null}
        </section>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Members</h3>
        <ul className="grid gap-4 sm:grid-cols-2">
          {currentTeam.member_ids.map((memberId) => (
            <li key={memberId} className="relative">
              <MemberCard
                memberId={memberId}
                assignedRole={getMemberAssignment(currentTeam, memberId)}
                participant={participantMap.get(memberId)}
              />
              <button
                type="button"
                onClick={() => handleRemove(memberId)}
                disabled={rebalanceMutation.isPending}
                className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-background px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                <UserMinus className="size-3" aria-hidden />
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      {suggested && suggestedId && !healed ? (
        <section
          className="rounded-xl border border-primary/30 bg-primary/5 p-5 shadow-sm"
        >
          <h3 className="text-lg font-semibold">Suggested replacement</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Engine suggests adding this participant to close the gap.
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <MemberCard
              memberId={suggestedId}
              assignedRole={suggested.preferred_roles?.[0]}
              participant={suggested}
            />
            <button
              type="button"
              onClick={handleAccept}
              disabled={rebalanceMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
            >
              {rebalanceMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <UserPlus className="size-4" aria-hidden />
              )}
              Add replacement
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <Link
              to={`/participants/${suggestedId}`}
              className="text-primary hover:underline"
            >
              View profile
            </Link>
          </p>
        </section>
      ) : null}

      <ScoreBreakdown score={currentTeam.score} />
    </div>
  );
}
