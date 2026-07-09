import Link from "next/link";
import { CatalogLayout } from "@/components/CatalogLayout";
import { VariantText } from "@/components/VariantText";
import { getAllVolumes, isVolumeEmpty } from "@/lib/poems";
import { makeTextVariant } from "@/lib/script-conversion";

export default function HomePage() {
  const volumes = getAllVolumes();

  return (
    <CatalogLayout
      title={makeTextVariant("目录")}
      breadcrumbs={[
        { label: makeTextVariant("古诗源"), href: "/" },
        { label: makeTextVariant("目录") },
      ]}
    >
      <nav aria-label="古诗源分卷">
        <ol className="catalog__list">
          {volumes.map((volume) => {
            const empty = isVolumeEmpty(volume.slug);

            return (
              <li key={volume.slug} className="catalog__item">
                {empty ? (
                  <>
                    <span className="catalog__link catalog__link--disabled">
                      <VariantText text={makeTextVariant(volume.name)} />
                    </span>
                    <span className="catalog__meta">
                      <VariantText text={makeTextVariant("整理中")} />
                    </span>
                  </>
                ) : (
                  <Link href={`/v/${volume.slug}`} className="catalog__link">
                    <VariantText text={makeTextVariant(volume.name)} />
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </CatalogLayout>
  );
}
