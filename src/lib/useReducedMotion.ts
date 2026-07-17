import { useMediaQuery } from "./useMediaQuery";

/** Tracks the user's prefers-reduced-motion setting, reactively. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
