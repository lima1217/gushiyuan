import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogLayout } from "@/components/CatalogLayout";
import { VariantText } from "@/components/VariantText";
import {
  getAllVolumes,
  getAuthorsByVolume,
  getVolumeBySlug,
} from "@/lib/poems";
import { makeTextVariant } from "@/lib/script-conversion";
import { createPageMetadata } from "@/lib/site-metadata";

type PageProps = {
  params: Promise<{ volumeSlug: string }>;
};

export function generateStaticParams() {
  return getAllVolumes().map((volume) => ({ volumeSlug: volume.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { volumeSlug } = await params;
  const volume = getVolumeBySlug(volumeSlug);
  if (!volume) {
    return { title: "古诗源" };
  }
  return createPageMetadata({ title: `${volume.name} · 古诗源` });
}

export default async function VolumePage({ params }: PageProps) {
  const { volumeSlug } = await params;
  const volume = getVolumeBySlug(volumeSlug);
  if (!volume) {
    notFound();
  }

  const authors = getAuthorsByVolume(volumeSlug);

  return (
    <CatalogLayout
      title={makeTextVariant(volume.name)}
      breadcrumbs={[
        { label: makeTextVariant("古诗源"), href: "/" },
        { label: makeTextVariant(volume.name) },
      ]}
    >
      {authors.length === 0 ? (
        <p className="catalog__empty">
          <VariantText text={makeTextVariant("此卷尚无收录。")} />
        </p>
      ) : (
        <nav aria-label={`${volume.name}诗人`}>
          <ol className="catalog__list">
            {authors.map((author) => (
              <li key={author.slug} className="catalog__item">
                <Link
                  href={`/v/${volumeSlug}/${author.slug}`}
                  className="catalog__link"
                >
                  <VariantText text={makeTextVariant(author.name)} />
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </CatalogLayout>
  );
}
