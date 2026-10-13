import type { Metadata } from "next";
import Link from "next/link";
import { CatalogLayout } from "@/components/CatalogLayout";
import { VariantText } from "@/components/VariantText";
import { VolumesNav } from "@/components/VolumesNav";
import { getAllPoems, getAllVolumes } from "@/lib/poems";
import { buildSiteUiText, makeTextVariant } from "@/lib/script-conversion";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const volumes = getAllVolumes();
  const volumesWithPoems = new Set(getAllPoems().map((poem) => poem.volume));
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
            const empty = !volumesWithPoems.has(volume.slug);

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
