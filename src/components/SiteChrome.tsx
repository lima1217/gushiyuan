"use client";

import { useState, type ReactNode } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ScriptVariantProvider } from "@/components/ScriptVariantProvider";
import { SiteSearch } from "@/components/SiteSearch";
import { SiteChromeActionsContext } from "@/components/SiteChromeActions";
import { SiteChromeTrailContext } from "@/components/SiteChromeTrail";
import { SkipLink } from "@/components/SkipLink";
import type { SearchIndex } from "@/lib/search-index-types";
import type { SiteUiText } from "@/lib/site-ui-text";

type SiteChromeProviderProps = {
  searchIndex: SearchIndex;
  uiText: SiteUiText;
  children: ReactNode;
};

export function SiteChromeProvider({
  searchIndex,
  uiText,
  children,
}: SiteChromeProviderProps) {
  const [trail, setTrail] = useState<ReactNode>(null);
  const [actions, setActions] = useState<ReactNode>(null);

  return (
    <ScriptVariantProvider uiText={uiText}>
      <SiteChromeTrailContext.Provider value={{ setTrail }}>
        <SiteChromeActionsContext.Provider value={{ setActions }}>
          <SkipLink />
          <div className="site-chrome">
            <div className="site-chrome__trail">{trail}</div>
            <div className="site-chrome__actions">
              {actions}
              <SiteSearch index={searchIndex} />
              <LanguageToggle />
            </div>
          </div>
          {children}
        </SiteChromeActionsContext.Provider>
      </SiteChromeTrailContext.Provider>
    </ScriptVariantProvider>
  );
}
