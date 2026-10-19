import { cn } from "../../lib/cn";

const variants = {
  primary:
    "bg-navy text-white hover:bg-navy-hover focus-visible:ring-navy/20",
  accent:
    "bg-orange text-white hover:bg-orange-hover focus-visible:ring-orange/30",
  secondary:
    "border border-line bg-white text-ink hover:bg-canvas focus-visible:ring-navy/15",
  ghost:
    "bg-transparent text-navy hover:bg-navy/5 focus-visible:ring-navy/15",
  danger:
    "bg-error text-white hover:bg-red-700 focus-visible:ring-error/20",
};

const sizes = {
  sm: "h-9 px-3 text-xs",
  md: "h-[42px] px-5 text-sm",
  lg: "h-12 px-6 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
