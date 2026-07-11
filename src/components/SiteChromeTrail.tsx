"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type SiteChromeTrailContextValue = {
  setTrail: (trail: ReactNode) => void;
  beginTrail: () => number;
  endTrail: (generation: number) => void;
};

export const SiteChromeTrailContext =
  createContext<SiteChromeTrailContextValue | null>(null);

export function useSiteChromeTrail() {
  const ctx = useContext(SiteChromeTrailContext);
  if (!ctx) {
    throw new Error("useSiteChromeTrail must be used within SiteChromeProvider");
  }
  return ctx;
}

/** Trail ownership helpers for SiteChromeProvider. */
export function useTrailOwnership(setTrail: (trail: ReactNode) => void) {
  const generationRef = useRef(0);

  const beginTrail = useCallback(() => {
    generationRef.current += 1;
    return generationRef.current;
  }, []);

  const endTrail = useCallback(
    (generation: number) => {
      // Defer clear so a replacement SiteChromeTrail in the same navigation
      // can claim the trail before we blank chrome (avoids poem↔poem flicker).
      queueMicrotask(() => {
        if (generationRef.current === generation) {
          setTrail(null);
        }
      });
    },
    [setTrail],
  );

  return { beginTrail, endTrail };
}

export function SiteChromeTrail({ children }: { children: ReactNode }) {
  const { setTrail, beginTrail, endTrail } = useSiteChromeTrail();

  useEffect(() => {
    const generation = beginTrail();
    setTrail(children);
    return () => endTrail(generation);
  }, [beginTrail, children, endTrail, setTrail]);

  return null;
}
