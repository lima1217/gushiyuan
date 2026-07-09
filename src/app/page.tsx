import Link from "next/link";
import { CatalogLayout } from "@/components/CatalogLayout";
import { getAllVolumes, isVolumeEmpty } from "@/lib/poems";

export default function HomePage() {
  const volumes = getAllVolumes();

  return (
    <CatalogLayout title="目录">
      <nav aria-label="古诗源分卷">
        <ol className="catalog__list">
          {volumes.map((volume) => {
            const empty = isVolumeEmpty(volume.slug);

            return (
              <li key={volume.slug} className="catalog__item">
                {empty ? (
                  <>
                    <span className="catalog__link catalog__link--disabled">
                      {volume.name}
                    </span>
                    <span className="catalog__meta">整理中</span>
                  </>
                ) : (
                  <Link href={`/v/${volume.slug}`} className="catalog__link">
                    {volume.name}
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
