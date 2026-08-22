import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/participants", label: "Participants" },
  { to: "/candidates", label: "Candidates" },
  { to: "/projects/new", label: "New project", primary: true },
  { to: "/teams", label: "Teams" },
] as const;

type AppNavProps = {
  layout?: "bar" | "stack";
  onNavigate?: () => void;
};

export function AppNav({ layout = "bar", onNavigate }: AppNavProps) {
  const isStack = layout === "stack";

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        isStack
          ? "flex flex-col gap-1.5 p-1"
          : "flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 p-1.5",
      )}
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "rounded-full text-[15px] font-medium tracking-tight transition-colors duration-200",
              isStack ? "px-4 py-3" : "shrink-0 px-4 py-2.5",
              "primary" in item && item.primary
                ? isActive
                  ? "bg-neutral-950 text-white"
                  : "bg-white text-neutral-950 ring-1 ring-neutral-200 hover:bg-neutral-950 hover:text-white hover:ring-neutral-950"
                : isActive
                  ? "bg-white text-neutral-950 shadow-[0_1px_2px_rgb(10_10_10_/_0.06)]"
                  : "text-neutral-500 hover:bg-white hover:text-neutral-950",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
