import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { AppNav } from "@/components/layout/AppNav";
import { IdentitySwitcher } from "@/components/layout/IdentitySwitcher";
import { useHealth } from "@/api/useHealth";
import { useResetDemo } from "@/api/useResetDemo";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const navigate = useNavigate();
  const resetDemo = useResetDemo();
  const { data: health } = useHealth();

  const handleReset = () => {
    resetDemo();
    navigate("/");
  };

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

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "hidden rounded-full border px-2 py-0.5 text-xs font-medium sm:inline",
              health?.status === "ok"
                ? "border-primary/30 text-primary"
                : "border-border text-muted-foreground",
            )}
            title="GET /api/health"
          >
            API {health?.status ?? "…"}
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Reset demo state"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset demo
          </button>
          <IdentitySwitcher />
        </div>
      </div>
    </header>
  );
}
