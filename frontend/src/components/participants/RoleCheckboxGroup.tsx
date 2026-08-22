import type { RoleId } from "@/api/types";
import { ROLE_OPTIONS } from "@/lib/participant-constants";
import { cn } from "@/lib/utils";

type RoleCheckboxGroupProps = {
  value: RoleId[];
  onChange: (roles: RoleId[]) => void;
  disabled?: boolean;
};

export function RoleCheckboxGroup({
  value,
  onChange,
  disabled,
}: RoleCheckboxGroupProps) {
  const toggle = (role: RoleId) => {
    if (value.includes(role)) {
      onChange(value.filter((entry) => entry !== role));
    } else {
      onChange([...value, role]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ROLE_OPTIONS.map((role) => {
        const selected = value.includes(role.value);
        return (
          <button
            key={role.value}
            type="button"
            disabled={disabled}
            onClick={() => toggle(role.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              disabled && "opacity-50",
            )}
          >
            {role.label}
          </button>
        );
      })}
    </div>
  );
}
