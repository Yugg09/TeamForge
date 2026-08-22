import { ChevronDown, UserRound } from "lucide-react";
import { useIdentity } from "@/hooks/use-identity";
import { cn } from "@/lib/utils";

type IdentitySwitcherProps = {
  compact?: boolean;
};

export function IdentitySwitcher({ compact }: IdentitySwitcherProps) {
  const { activeIdentity, options, setActiveIdentityId } = useIdentity();

  return (
    <label
      className={cn(
        "relative inline-flex h-11 items-center gap-2.5 rounded-xl border border-neutral-200 bg-white pl-3 pr-2.5 text-sm text-neutral-950 transition-colors duration-200 hover:bg-neutral-50",
        compact && "h-11 max-w-[12rem] pl-2.5",
      )}
    >
      <UserRound className="size-5 shrink-0 text-neutral-500" aria-hidden />
      <span className="sr-only">Acting as</span>
      <select
        value={activeIdentity.id}
        onChange={(event) => setActiveIdentityId(event.target.value)}
        className={cn(
          "h-full min-w-0 cursor-pointer appearance-none bg-transparent py-0 pr-6 text-sm font-medium tracking-tight text-neutral-950 outline-none",
          compact ? "max-w-[7.5rem]" : "max-w-[11rem] sm:max-w-none",
        )}
        aria-label="Acting as"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 size-4 text-neutral-500"
        aria-hidden
      />
    </label>
  );
}
