import { createContext, useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current, { id, ...toast }]);
      window.setTimeout(() => dismiss(id), toast.duration ?? 3500);
    },
    [dismiss],
  );

  const show = useCallback(
    (messageOrOptions, tone = "info", title = "") => {
      if (typeof messageOrOptions === "object" && messageOrOptions !== null) {
        push(messageOrOptions);
      } else {
        push({
          message: String(messageOrOptions ?? ""),
          tone,
          title,
        });
      }
    },
    [push],
  );

  const success = useCallback(
    (message, title = "") => show(message, "success", title),
    [show],
  );

  const error = useCallback(
    (message, title = "") => show(message, "error", title),
    [show],
  );

  const warning = useCallback(
    (message, title = "") => show(message, "warning", title),
    [show],
  );

  const info = useCallback(
    (message, title = "") => show(message, "info", title),
    [show],
  );

  const value = useMemo(
    () => ({ show, push, dismiss, success, error, warning, info }),
    [show, push, dismiss, success, error, warning, info],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lift transition-all",
              toast.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800 font-medium",
              toast.tone === "error" && "border-rose-200 bg-rose-50 text-rose-800 font-medium",
              toast.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800 font-medium",
              (!toast.tone || toast.tone === "info") && "border-line bg-white text-ink",
            )}
          >
            {toast.title ? <p className="font-semibold">{toast.title}</p> : null}
            <p>{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
