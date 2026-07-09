import Link from "next/link";
import { CatalogLayout } from "@/components/CatalogLayout";
import { VariantText } from "@/components/VariantText";
import { VolumesNav } from "@/components/VolumesNav";
import { getAllPoems, getAllVolumes } from "@/lib/poems";
import { makeTextVariant } from "@/lib/script-conversion";

export default function HomePage() {
  const volumes = getAllVolumes();
  const volumesWithPoems = new Set(getAllPoems().map((poem) => poem.volume));

  return (
    <CatalogLayout
      title={makeTextVariant("目录")}
      breadcrumbs={[
        { label: makeTextVariant("古诗源"), href: "/" },
        { label: makeTextVariant("目录") },
      ]}
    >
      <VolumesNav>
        <ol className="catalog__list">
          {volumes.map((volume) => {
            const empty = !volumesWithPoems.has(volume.slug);

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
      </VolumesNav>
    </CatalogLayout>
  );
}
