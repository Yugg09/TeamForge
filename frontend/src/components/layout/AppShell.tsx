import { Outlet } from "react-router-dom";

export function AppShell() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
          <span className="text-lg font-semibold tracking-tight">TeamForge</span>
          <span className="ml-3 text-sm text-muted-foreground">
            Build better teams, not just bigger teams.
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
