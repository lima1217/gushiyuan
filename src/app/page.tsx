import type { Metadata } from "next";
import Link from "next/link";
import { CatalogLayout } from "@/components/CatalogLayout";
import { VariantText } from "@/components/VariantText";
import { VolumesNav } from "@/components/VolumesNav";
import { formatSiteUiCount } from "@/lib/format-site-ui-count";
import { getAllPoems, getAllVolumes } from "@/lib/poems";
import { buildSiteUiText, makeTextVariant } from "@/lib/script-conversion";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const volumes = getAllVolumes();
  const poemCountByVolume = new Map<string, number>();
  for (const poem of getAllPoems()) {
    poemCountByVolume.set(
      poem.volume,
      (poemCountByVolume.get(poem.volume) ?? 0) + 1,
    );
  }
  const uiText = buildSiteUiText();

  return (
    <CatalogLayout
      title={uiText.catalogTitle}
      breadcrumbs={[
        { label: uiText.siteName, href: "/" },
        { label: uiText.catalogTitle },
      ]}
    >
      <VolumesNav>
        <ol className="catalog__list">
          {volumes.map((volume) => {
            const poemCount = poemCountByVolume.get(volume.slug) ?? 0;
            const empty = poemCount === 0;

            return (
              <li key={volume.slug} className="catalog__item">
                {empty ? (
                  <span className="catalog__link catalog__link--disabled">
                    <VariantText text={makeTextVariant(volume.name)} />
                    <span className="catalog__meta">
                      <VariantText text={uiText.organizing} />
                    </span>
                  </span>
                ) : (
                  <Link href={`/v/${volume.slug}`} className="catalog__link">
                    <VariantText text={makeTextVariant(volume.name)} />
                    <span className="catalog__meta">
                      <VariantText
                        text={{
                          simplified: formatSiteUiCount(
                            uiText.poemCountLabel.simplified,
                            poemCount,
                          ),
                          traditional: formatSiteUiCount(
                            uiText.poemCountLabel.traditional,
                            poemCount,
                          ),
                        }}
                      />
                    </span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </VolumesNav>
    </CatalogLayout>
  );
}
