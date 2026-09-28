import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "bg-fg text-bg hover:bg-fg/85 border border-transparent disabled:bg-fg/40",
  secondary:
    "bg-surface text-fg border border-border hover:bg-surface-2 hover:border-border-strong",
  ghost: "text-muted hover:text-fg hover:bg-surface-2 border border-transparent",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-2.5 text-[12.5px] gap-1.5",
  md: "h-9 px-3.5 text-[13px] gap-2",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed [&_svg]:size-3.5",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex rounded-md border border-border bg-surface-2 p-0.5", className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-[12.5px] font-medium transition-colors [&_svg]:size-3.5",
            value === o.value ? "bg-surface text-fg shadow-card ring-1 ring-border" : "text-subtle hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <label className={cn("relative inline-flex items-center", className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-8 w-full appearance-none rounded-md border border-border bg-surface pr-7 pl-2.5 text-[12.5px] font-medium text-fg transition-colors hover:border-border-strong",
          value && value !== "all" ? "border-border-strong bg-surface-2" : "",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute right-2 size-3.5 text-subtle">
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}
