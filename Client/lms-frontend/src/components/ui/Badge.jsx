import { cn } from "../../lib/cn";

const tones = {
  neutral: "bg-slate-100 text-ink",
  orange: "bg-orange-50 text-orange-700",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-blue-100 text-blue-700",
  error: "bg-rose-100 text-rose-700",
};

const dots = {
  warning: "bg-warning",
  info: "bg-info",
  success: "bg-emerald-500",
  error: "bg-red-500",
  orange: "bg-orange",
  neutral: "bg-slate-400",
};

export function Badge({ tone = "neutral", dot = false, className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {dot ? (
        <span className={cn("h-1.5 w-1.5 rounded-full", dots[tone])} />
      ) : null}
      {children}
    </span>
  );
}
