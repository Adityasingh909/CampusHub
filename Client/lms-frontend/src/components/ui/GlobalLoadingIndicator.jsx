import { useLoading } from "../../hooks/useLoading";

export function GlobalLoadingIndicator() {
  const { isGlobalVisible, progress } = useLoading();

  if (!isGlobalVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-[3px] bg-transparent"
    >
      <span className="sr-only">Loading content...</span>
      <div
        className="h-full bg-gradient-to-r from-navy via-orange to-orange-hover shadow-xs transition-all duration-300 ease-out motion-reduce:transition-none"
        style={{ width: `${Math.min(100, Math.max(10, progress))}%` }}
      />
    </div>
  );
}
