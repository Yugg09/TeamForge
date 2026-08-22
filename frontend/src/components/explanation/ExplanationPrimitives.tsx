import { cn } from "@/lib/utils";
import type { ExplanationTone } from "@/lib/team-why";

type EvidenceBadgeProps = {
  source?: string;
  className?: string;
};

export function EvidenceBadge({ source, className }: EvidenceBadgeProps) {
  if (!source) return null;
  return (
    <span
      className={cn(
        "rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      {source}
    </span>
  );
}

type ExplanationBulletProps = {
  tone: ExplanationTone;
  text: string;
  evidence?: string;
};

const toneIcon: Record<ExplanationTone, string> = {
  positive: "✓",
  warning: "⚠",
  neutral: "·",
};

const toneClass: Record<ExplanationTone, string> = {
  positive: "border-primary/20 bg-primary/5",
  warning: "border-destructive/25 bg-destructive/5",
  neutral: "border-border bg-muted/20",
};

export function ExplanationBullet({
  tone,
  text,
  evidence,
}: ExplanationBulletProps) {
  return (
    <li
      className={cn(
        "flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between",
        toneClass[tone],
      )}
    >
      <span>
        <span className="mr-2 font-medium">{toneIcon[tone]}</span>
        {text}
      </span>
      <EvidenceBadge source={evidence} />
    </li>
  );
}
