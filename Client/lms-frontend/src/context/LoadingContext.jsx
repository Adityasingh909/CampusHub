import { createContext, useEffect, useState, useMemo, useRef } from "react";
import { subscribeToRequestCount } from "../services/api";

export const LoadingContext = createContext({
  activeCount: 0,
  isLoading: false,
  isGlobalVisible: false,
  progress: 0,
});

export function LoadingProvider({ children }) {
  const [activeCount, setActiveCount] = useState(0);
  const [isGlobalVisible, setIsGlobalVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const trickleTimerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToRequestCount((count) => {
      setActiveCount(count);

      if (count > 0) {
        // If already clearing from a previous request, cancel the hide timer
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }

        // Delay showing indicator by 200ms to avoid flashing on fast requests (< 200ms)
        if (!showTimerRef.current) {
          showTimerRef.current = setTimeout(() => {
            setIsGlobalVisible(true);
            setProgress(30);

            // Subtle progress trickle while request is in flight (caps around 85%)
            clearInterval(trickleTimerRef.current);
            trickleTimerRef.current = setInterval(() => {
              setProgress((prev) => (prev < 85 ? prev + Math.random() * 8 : prev));
            }, 350);
          }, 200);
        }
      } else {
        // count === 0: All active requests finished
        if (showTimerRef.current) {
          clearTimeout(showTimerRef.current);
          showTimerRef.current = null;
        }

        clearInterval(trickleTimerRef.current);
        trickleTimerRef.current = null;

        // If it was visible, smoothly jump to 100% and fade out
        setProgress(100);
        hideTimerRef.current = setTimeout(() => {
          setIsGlobalVisible(false);
          setProgress(0);
        }, 320);
      }
    });

    return () => {
      unsubscribe();
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (trickleTimerRef.current) clearInterval(trickleTimerRef.current);
    };
  }, []);

  const value = useMemo(
    () => ({
      activeCount,
      isLoading: activeCount > 0,
      isGlobalVisible,
      progress,
    }),
    [activeCount, isGlobalVisible, progress]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}
