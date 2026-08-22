import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { SHELL_WIDE } from "@/components/layout/shell-width";
import { cn } from "@/lib/utils";

export function AppShell() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/";

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-background">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 bg-[radial-gradient(ellipse_at_top,_#f0f0f0_0%,_transparent_62%)]",
          isLanding ? "h-[52rem]" : "h-[28rem]",
        )}
      />
      <AppHeader />
      <main
        className={cn(
          "relative",
          isLanding
            ? cn(SHELL_WIDE, "px-0 pb-16 pt-3 sm:pb-20")
            : "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12",
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
