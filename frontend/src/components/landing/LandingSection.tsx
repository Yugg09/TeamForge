import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LandingSectionProps = {
  id?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "muted";
};

export function LandingSection({
  id,
  title,
  description,
  children,
  className,
  variant = "default",
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20",
        variant === "muted" && "rounded-2xl border border-border bg-card/50 p-6 sm:p-8",
        className,
      )}
    >
      {(title || description) && (
        <header className="mb-8 space-y-3">
          {title ? (
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="max-w-2xl text-muted-foreground">{description}</p>
          ) : null}
        </header>
      )}
      {children}
    </section>
  );
}
