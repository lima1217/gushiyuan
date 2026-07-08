"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

type SiteChromeActionsContextValue = {
  setActions: (actions: ReactNode) => void;
};

export const SiteChromeActionsContext =
  createContext<SiteChromeActionsContextValue | null>(null);

export function useSiteChromeActions() {
  const ctx = useContext(SiteChromeActionsContext);
  if (!ctx) {
    throw new Error("useSiteChromeActions must be used within SiteChromeProvider");
  }
  return ctx;
}

export function SiteChromeActions({ children }: { children: ReactNode }) {
  const { setActions } = useSiteChromeActions();

  useEffect(() => {
    setActions(children);
    return () => setActions(null);
  }, [children, setActions]);

  return null;
}
