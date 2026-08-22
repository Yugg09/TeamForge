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
        "scroll-mt-24",
        variant === "muted" &&
          "rounded-3xl border border-border/80 bg-card/60 p-6 shadow-sm sm:p-8 lg:p-10",
        className,
      )}
    >
      {(title || description) && (
        <header className="mb-8 space-y-3 lg:mb-10">
          {title ? (
            <h2 className="max-w-4xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="max-w-3xl text-[15px] leading-relaxed text-muted-foreground sm:text-base lg:text-lg">
              {description}
            </p>
          ) : null}
        </header>
      )}
      {children}
    </section>
  );
}
