import { GraduationCap } from "lucide-react";
import { cn } from "../../lib/cn";

export function BrandMark({ compact = false, inverted = false }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "grid h-9 w-9 place-items-center rounded-lg text-white shadow-sm",
          inverted ? "bg-orange" : "bg-navy",
        )}
      >
        <GraduationCap size={18} />
      </div>
      {compact ? null : (
        <div>
          <p className={cn("font-display text-lg font-bold leading-none tracking-tight", inverted ? "text-white" : "text-navy")}>
            Campus<span className="text-orange">Hub</span>
          </p>
          <p className={cn("mt-1 text-[11px] font-semibold uppercase tracking-wider", inverted ? "text-slate-400" : "text-muted")}>
            University LMS
          </p>
        </div>
      )}
    </div>
  );
}
