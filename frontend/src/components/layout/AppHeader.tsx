import { Link } from "react-router-dom";
import { AppNav } from "@/components/layout/AppNav";
import { IdentitySwitcher } from "@/components/layout/IdentitySwitcher";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="group flex shrink-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            TF
          </span>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-none tracking-tight">
              TeamForge
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Better teams, not bigger teams
            </p>
          </div>
        </Link>

        <div className="flex flex-1 justify-center">
          <AppNav />
        </div>

        <IdentitySwitcher />
      </div>
    </header>
  );
}
