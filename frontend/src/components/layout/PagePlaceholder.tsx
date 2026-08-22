import type { ReactNode } from "react";

type PlaceholderBlock = {
  title: string;
  description: string;
};

type PagePlaceholderProps = {
  blocks: PlaceholderBlock[];
  footer?: ReactNode;
};

export function PagePlaceholder({ blocks, footer }: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {blocks.map((block) => (
          <article
            key={block.title}
            className="rounded-xl border border-dashed border-border bg-card/60 p-5 shadow-sm"
          >
            <h2 className="text-sm font-semibold">{block.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{block.description}</p>
          </article>
        ))}
      </div>
      {footer ? (
        <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          {footer}
        </p>
      ) : null}
    </div>
  );
}
