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
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-border/80 bg-card p-12 text-center shadow-sm",
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
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
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/60 p-12 text-center",
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <Inbox className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {description ? (
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? <div className="mt-1">{children}</div> : null}
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
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-12 text-center",
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-5 text-destructive" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {description ? (
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? <div className="mt-1">{children}</div> : null}
    </div>
  );
}

export function LoadingSkeleton({
  title = "Loading…",
  rows = 3,
  className,
}: {
  title?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-6 shadow-sm",
        className,
      )}
    >
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="h-11 animate-pulse rounded-lg bg-muted"
            style={{ width: `${92 - index * 7}%` }}
          />
        ))}
      </div>
    </div>
  );
}
