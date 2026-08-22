import { useState } from "react";
import {
  Check,
  Loader2,
  Lock,
  Unlock,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  useAcceptPartition,
  useLockTeam,
  useRejectPartition,
  usePartitionStatus,
} from "@/api/useTeamAdjust";
import { useFormTeamsMutation } from "@/api/useFormTeams";
import { cn } from "@/lib/utils";

type TeamActionsProps = {
  teamId: string;
  isLocked?: boolean;
  className?: string;
};

export function TeamActions({ teamId, isLocked, className }: TeamActionsProps) {
  const lockTeam = useLockTeam();

  const handleLockToggle = () => {
    lockTeam.mutate({ teamId, locked: !isLocked });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={handleLockToggle}
        disabled={lockTeam.isPending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition",
          isLocked
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border bg-background text-muted-foreground hover:bg-accent",
        )}
        title={isLocked ? "Unlock team (optimizer can modify)" : "Lock team (optimizer won't touch)"}
      >
        {lockTeam.isPending ? (
          <Loader2 className="size-3 animate-spin" aria-hidden />
        ) : isLocked ? (
          <Lock className="size-3" aria-hidden />
        ) : (
          <Unlock className="size-3" aria-hidden />
        )}
        {isLocked ? "Locked" : "Lock"}
      </button>
    </div>
  );
}

type PartitionActionsProps = {
  className?: string;
};

export function PartitionActions({ className }: PartitionActionsProps) {
  const acceptPartition = useAcceptPartition();
  const rejectPartition = useRejectPartition();
  const formTeamsMutation = useFormTeamsMutation();
  const { data: status } = usePartitionStatus();
  const [confirmReject, setConfirmReject] = useState(false);

  const isAccepted = status?.status === "accepted";

  const handleAccept = () => {
    acceptPartition.mutate();
  };

  const handleReject = () => {
    if (!confirmReject) {
      setConfirmReject(true);
      return;
    }
    rejectPartition.mutate();
    setConfirmReject(false);
  };

  const handleReForm = () => {
    formTeamsMutation.mutate({ event_id: "demo" });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {/* Accept button */}
      {!isAccepted && (
        <button
          type="button"
          onClick={handleAccept}
          disabled={acceptPartition.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-60"
        >
          {acceptPartition.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
          Accept partition
        </button>
      )}

      {/* Re-form button */}
      <button
        type="button"
        onClick={handleReForm}
        disabled={formTeamsMutation.isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
      >
        {formTeamsMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <RefreshCw className="size-4" aria-hidden />
        )}
        Re-form teams
      </button>

      {/* Reject button */}
      {!isAccepted && (
        <button
          type="button"
          onClick={handleReject}
          disabled={rejectPartition.isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-background px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
        >
          {rejectPartition.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="size-4" aria-hidden />
          )}
          {confirmReject ? "Confirm reject" : "Reject"}
        </button>
      )}

      {/* Status indicator */}
      {isAccepted && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Check className="size-3" aria-hidden />
          Partition accepted
        </span>
      )}
    </div>
  );
}
