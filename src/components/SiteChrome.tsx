"use client";

import { useState, type ReactNode } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ScriptVariantProvider } from "@/components/ScriptVariantProvider";
import { RandomPoemButton } from "@/components/RandomPoemButton";
import { SiteSearch } from "@/components/SiteSearch";
import {
  SiteChromeTrailContext,
  useTrailOwnership,
} from "@/components/SiteChromeTrail";
import { SkipLink } from "@/components/SkipLink";
import type { SiteUiText } from "@/lib/site-ui-text";

type SiteChromeProviderProps = {
  uiText: SiteUiText;
  children: ReactNode;
};

export function SiteChromeProvider({
  uiText,
  children,
}: SiteChromeProviderProps) {
  const [trail, setTrail] = useState<ReactNode>(null);
  const { beginTrail, endTrail } = useTrailOwnership(setTrail);

  return (
    <ScriptVariantProvider uiText={uiText}>
      <SiteChromeTrailContext.Provider
        value={{ setTrail, beginTrail, endTrail }}
      >
        <SkipLink />
        <div className="site-chrome">
          <div className="site-chrome__trail">{trail}</div>
          <div className="site-chrome__actions">
            <RandomPoemButton />
            <SiteSearch />
            <LanguageToggle />
          </div>
        </div>
        {children}
      </SiteChromeTrailContext.Provider>
    </ScriptVariantProvider>
  );
}
