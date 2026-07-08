import { LanguageToggle } from "@/components/LanguageToggle";
import { SiteLogo } from "@/components/SiteLogo";
import { SiteSearch } from "@/components/SiteSearch";
import { SkipLink } from "@/components/SkipLink";
import type { SearchIndex } from "@/lib/search-index-types";

type SiteChromeProps = {
  searchIndex: SearchIndex;
};

export function SiteChrome({ searchIndex }: SiteChromeProps) {
  return (
    <>
      <SkipLink />
      <div className="site-chrome">
        <SiteLogo />
        <div className="site-chrome__actions">
          <SiteSearch index={searchIndex} />
          <LanguageToggle />
        </div>
      </div>
    </>
  );
}
