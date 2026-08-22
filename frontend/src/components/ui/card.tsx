import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card text-card-foreground shadow-[0_1px_2px_rgb(23_23_23_/_0.04)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-base font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} {...props} />;
}

type StatCardProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card className={cn("p-5", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </Card>
  );
}
