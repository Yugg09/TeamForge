import { UserRound } from "lucide-react";
import { useIdentity } from "@/hooks/use-identity";

export function IdentitySwitcher() {
  const { activeIdentity, options, setActiveIdentityId } = useIdentity();

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <UserRound className="size-4 shrink-0" aria-hidden />
      <span className="sr-only">Acting as</span>
      <select
        value={activeIdentity.id}
        onChange={(event) => setActiveIdentityId(event.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Acting as"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
