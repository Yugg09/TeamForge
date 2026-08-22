import type { ReactNode } from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type StatePanelProps = {
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
};

export function LoadingState({
  title = "Loading…",
  description,
  className,
}: Partial<StatePanelProps>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-10 text-center",
        className,
      )}
    >
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  children,
  className,
}: StatePanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center",
        className,
      )}
    >
      <Inbox className="size-8 text-muted-foreground" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  children,
  className,
}: Partial<StatePanelProps>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-10 text-center",
        className,
      )}
    >
      <AlertCircle className="size-8 text-destructive" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
