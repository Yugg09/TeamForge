import { cn } from "@/lib/utils";

const inputClassName =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground hover:border-ring/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50";

type TextInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  disabled?: boolean;
  className?: string;
  min?: number;
  max?: number;
};

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  className,
  min,
  max,
}: TextInputProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      className={cn(inputClassName, className)}
    />
  );
}

type TextAreaProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
};

export function TextArea({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled,
}: TextAreaProps) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={cn(
        inputClassName,
        "min-h-[108px] resize-y py-2.5 leading-relaxed",
      )}
    />
  );
}

type SelectInputProps = {
  id?: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  disabled?: boolean;
};

export function SelectInput({
  id,
  value,
  onChange,
  options,
  disabled,
}: SelectInputProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className={inputClassName}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
