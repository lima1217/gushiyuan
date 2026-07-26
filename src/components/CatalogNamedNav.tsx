"use client";

import type { ReactNode } from "react";
import { useScriptVariant } from "@/components/ScriptVariantProvider";
import { catalogNavAriaLabel } from "@/lib/catalog-nav-label";
import type { TextVariant } from "@/lib/script-variant";
import type { SiteUiTextKey } from "@/lib/site-ui-text";

type CatalogNamedNavProps = {
  name: TextVariant;
  ariaKey: Extract<SiteUiTextKey, "volumeAuthorsAria" | "authorPoemsAria">;
  children: ReactNode;
};

export function CatalogNamedNav({
  name,
  ariaKey,
  children,
}: CatalogNamedNavProps) {
  const { variant, uiText } = useScriptVariant();
  const ariaLabel = catalogNavAriaLabel(name, uiText[ariaKey], variant);

  return <nav aria-label={ariaLabel}>{children}</nav>;
}
