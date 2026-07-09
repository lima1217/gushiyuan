"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

type SiteChromeTrailContextValue = {
  setTrail: (trail: ReactNode) => void;
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

export function SiteChromeTrail({ children }: { children: ReactNode }) {
  const { setTrail } = useSiteChromeTrail();

  useEffect(() => {
    setTrail(children);
    return () => setTrail(null);
  }, [children, setTrail]);

  return null;
}
