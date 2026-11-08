import { useSyncExternalStore } from "react";

/** True when the visitor's OS asks for reduced motion. Always false on the server (no hydration mismatch). */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
