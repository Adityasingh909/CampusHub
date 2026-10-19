import { cn } from "../../lib/cn";

export function Input({
  id,
  label,
  hint,
  error,
  className,
  wrapperClassName,
  ...props
}) {
  return (
    <div className={wrapperClassName}>
      {label ? (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-semibold text-ink"
        >
          {label}
        </label>
      ) : null}
      <input
        id={id}
        className={cn(
          "h-[42px] w-full rounded-lg border bg-white px-4 text-sm text-ink outline-none transition placeholder:text-muted",
          error
            ? "border-error focus:border-error focus:ring-[3px] focus:ring-error/15"
            : "border-line focus:border-navy focus:ring-[3px] focus:ring-navy/15",
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-[11px] font-semibold text-error">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
