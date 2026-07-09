"use client";

import type { ReactNode } from "react";
import { useUiText } from "@/components/ScriptVariantProvider";

export function VolumesNav({ children }: { children: ReactNode }) {
  const ariaLabel = useUiText("volumesAria");

  return <nav aria-label={ariaLabel}>{children}</nav>;
}
