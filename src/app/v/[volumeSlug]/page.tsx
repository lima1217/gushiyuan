import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogLayout } from "@/components/CatalogLayout";
import { CatalogNamedNav } from "@/components/CatalogNamedNav";
import { VariantText } from "@/components/VariantText";
import { formatSiteUiCount } from "@/lib/format-site-ui-count";
import { shouldHidePoemAuthor } from "@/lib/poem-display";
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
  return createPageMetadata({
    title: `${volume.name} · 古诗源`,
    alternates: { canonical: `/v/${volume.slug}` },
  });
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
              const poems = getPoemsByAuthor(volumeSlug, author.slug);
              // 只有一首时直达诗页，行尾以诗题代替「1 首」，省掉一层只有一行的作者页。
              const onlyPoem = poems.length === 1 ? poems[0] : undefined;
              return (
                <li key={author.slug} className="catalog__item">
                  <Link
                    href={
                      onlyPoem
                        ? `/p/${onlyPoem.slug}`
                        : `/v/${volumeSlug}/${author.slug}`
                    }
                    className="catalog__link"
                  >
                    <VariantText text={makeTextVariant(author.name)} />
                    {onlyPoem && shouldHidePoemAuthor(onlyPoem) ? null : (
                      <span
                        className={
                          onlyPoem
                            ? "catalog__meta catalog__meta--title"
                            : "catalog__meta"
                        }
                      >
                        <VariantText
                          text={
                            onlyPoem
                              ? makeTextVariant(onlyPoem.title)
                              : {
                                  simplified: formatSiteUiCount(
                                    uiText.poemCountLabel.simplified,
                                    poems.length,
                                  ),
                                  traditional: formatSiteUiCount(
                                    uiText.poemCountLabel.traditional,
                                    poems.length,
                                  ),
                                }
                          }
                        />
                      </span>
                    )}
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
