import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/cn";

export function PasswordInput({
  id,
  label,
  error,
  className,
  wrapperClassName,
  extraLabel,
  ...props
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={wrapperClassName}>
      <div className="mb-2 flex items-center justify-between gap-2">
        {label ? (
          <label htmlFor={id} className="text-sm font-semibold text-ink">
            {label}
          </label>
        ) : null}
        {extraLabel}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={cn(
            "h-[42px] w-full rounded-lg border bg-white px-4 pr-11 text-sm text-ink outline-none transition placeholder:text-muted",
            error
              ? "border-error focus:border-error focus:ring-[3px] focus:ring-error/15"
              : "border-line focus:border-navy focus:ring-[3px] focus:ring-navy/15",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute inset-y-0 right-3 grid place-items-center text-muted hover:text-navy"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-[11px] font-semibold text-error">{error}</p>
      ) : null}
    </div>
  );
}
