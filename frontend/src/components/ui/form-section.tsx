import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      <header className="mb-5 space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}
