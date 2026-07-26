import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogLayout } from "@/components/CatalogLayout";
import { CatalogNamedNav } from "@/components/CatalogNamedNav";
import { VariantText } from "@/components/VariantText";
import { formatSiteUiCount } from "@/lib/format-site-ui-count";
import {
  getAllVolumes,
  getAuthorsByVolume,
  getPoemsByAuthor,
  getVolumeBySlug,
} from "@/lib/poems";
import { buildSiteUiText, makeTextVariant } from "@/lib/script-conversion";
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
  const uiText = buildSiteUiText();

  return (
    <CatalogLayout
      title={makeTextVariant(volume.name)}
      breadcrumbs={[
        { label: uiText.siteName, href: "/" },
        { label: makeTextVariant(volume.name) },
      ]}
    >
      {authors.length === 0 ? (
        <p className="catalog__empty">
          <VariantText text={uiText.emptyVolume} />
        </p>
      ) : (
        <CatalogNamedNav
          name={makeTextVariant(volume.name)}
          ariaKey="volumeAuthorsAria"
        >
          <ol className="catalog__list">
            {authors.map((author) => {
              const poemCount = getPoemsByAuthor(volumeSlug, author.slug).length;
              return (
                <li key={author.slug} className="catalog__item">
                  <Link
                    href={`/v/${volumeSlug}/${author.slug}`}
                    className="catalog__link"
                  >
                    <VariantText text={makeTextVariant(author.name)} />
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
                </li>
              );
            })}
          </ol>
        </CatalogNamedNav>
      )}
    </CatalogLayout>
  );
}
