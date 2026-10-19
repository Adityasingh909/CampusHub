import { cn } from "../../lib/cn";

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn("grid rounded-xl bg-slate-100 p-1", className)} style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "rounded-lg px-3 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-white text-navy shadow-sm"
                : "text-muted hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
