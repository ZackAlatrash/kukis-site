import { useEffect, useState } from "react";

/**
 * Tracks a media query, resolved on the first render rather than in an effect.
 *
 * The initialiser matters more than it looks: an effect-resolved preference is
 * false for one render, and anything a child does on mount — mounting, fetching —
 * has already happened by the time it flips. React runs child effects before
 * parent ones, so the child never sees the corrected value in time.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
