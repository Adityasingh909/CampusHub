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
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, ...toast }]);
      window.setTimeout(() => dismiss(id), toast.duration ?? 3500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lift",
              toast.tone === "success" && "border-emerald-100 bg-emerald-50 text-emerald-800",
              toast.tone === "error" && "border-rose-100 bg-rose-50 text-rose-800",
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
