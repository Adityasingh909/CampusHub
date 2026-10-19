import { cn } from "../../lib/cn";

export function ProgressBar({ value = 0, className, barClassName }) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}
      role="progressbar"
      aria-valuenow={width}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full bg-navy transition-all", barClassName)}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
