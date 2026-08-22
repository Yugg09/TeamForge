import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Menu, RotateCcw, X } from "lucide-react";
import { AppNav } from "@/components/layout/AppNav";
import { IdentitySwitcher } from "@/components/layout/IdentitySwitcher";
import { SHELL_WIDE } from "@/components/layout/shell-width";
import { useHealth } from "@/api/useHealth";
import { useResetDemo } from "@/api/useResetDemo";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const navigate = useNavigate();
  const resetDemo = useResetDemo();
  const { data: health } = useHealth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleReset = async () => {
    await resetDemo();
    navigate("/");
    setMenuOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-xl transition-[box-shadow] duration-200",
        scrolled ? "shadow-[0_1px_0_#e5e5e5,0_8px_24px_rgb(10_10_10_/_0.04)]" : "shadow-none",
      )}
    >
      <div
        className={cn(
          SHELL_WIDE,
          "flex items-center gap-4 px-5 py-4 sm:px-8 lg:h-[96px] lg:gap-8 lg:px-10 lg:py-0 xl:px-12",
        )}
      >
        <Link
          to="/"
          className="shrink-0 text-[1.75rem] font-bold leading-none tracking-[-0.05em] text-neutral-950 transition-opacity duration-200 hover:opacity-70 sm:text-[2rem] lg:text-[2.125rem]"
        >
          TeamForge
        </Link>

        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <AppNav />
        </div>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <HealthBadge status={health?.status} />
          <span className="h-5 w-px bg-neutral-200" aria-hidden />
          <button
            type="button"
            onClick={handleReset}
            title="Reset demo state"
            className="inline-flex h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-medium text-neutral-500 transition-colors duration-200 hover:bg-neutral-100 hover:text-neutral-950"
          >
            <RotateCcw className="size-4" aria-hidden />
            Reset demo
          </button>
          <IdentitySwitcher />
        </div>

        <div className="ml-auto flex items-center gap-2.5 lg:hidden">
          <HealthBadge status={health?.status} />
          <IdentitySwitcher compact />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-950 transition-colors duration-200 hover:bg-neutral-100"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-neutral-200 bg-white/95 px-5 py-4 sm:px-8 lg:hidden"
        >
          <AppNav layout="stack" onNavigate={() => setMenuOpen(false)} />
          <button
            type="button"
            onClick={handleReset}
            title="Reset demo state"
            className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-500 transition-colors duration-200 hover:bg-neutral-100 hover:text-neutral-950"
          >
            <RotateCcw className="size-4" aria-hidden />
            Reset demo
          </button>
        </div>
      ) : null}
    </header>
  );
}

function HealthBadge({ status }: { status?: string }) {
  const ok = status === "ok";
  const label = ok ? "API Connected" : `API ${status ?? "…"}`;

  return (
    <span
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-medium tracking-tight transition-colors duration-200",
        ok
          ? "border-neutral-900 bg-neutral-950 text-white"
          : "border-neutral-200 bg-neutral-50 text-neutral-500",
      )}
      title="GET /api/health"
    >
      <span
        className={cn(
          "size-2 rounded-full",
          ok ? "bg-white" : "bg-neutral-400",
        )}
        aria-hidden
      />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{ok ? "API" : status ?? "…"}</span>
    </span>
  );
}
