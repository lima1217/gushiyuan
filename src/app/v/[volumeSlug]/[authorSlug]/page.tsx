import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CatalogLayout } from "@/components/CatalogLayout";
import { VariantText } from "@/components/VariantText";
import {
  ANONYMOUS_AUTHOR_SLUG,
  getAuthorPageParams,
  getAuthorInVolume,
  getPoemsByAuthor,
  getVolumeBySlug,
  isLegacyAnonymousAuthorSlug,
} from "@/lib/poems";
import { makeTextVariant } from "@/lib/script-conversion";
import { createPageMetadata } from "@/lib/site-metadata";

type PageProps = {
  params: Promise<{ volumeSlug: string; authorSlug: string }>;
};

export function generateStaticParams() {
  return getAuthorPageParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { volumeSlug, authorSlug } = await params;
  const volume = getVolumeBySlug(volumeSlug);
  const author = getAuthorInVolume(volumeSlug, authorSlug);
  if (!volume || !author) {
    return { title: "古诗源" };
  }
  return createPageMetadata({
    title: `${author.name} · ${volume.name} · 古诗源`,
  });
}

export default async function AuthorPage({ params }: PageProps) {
  const { volumeSlug, authorSlug } = await params;
  const volume = getVolumeBySlug(volumeSlug);
  if (isLegacyAnonymousAuthorSlug(authorSlug)) {
    redirect(`/v/${volumeSlug}/${ANONYMOUS_AUTHOR_SLUG}`);
  }

  const author = getAuthorInVolume(volumeSlug, authorSlug);
  if (!volume || !author) {
    notFound();
  }

  const poems = getPoemsByAuthor(volumeSlug, author.slug);

  return (
    <CatalogLayout
      title={makeTextVariant(author.name)}
      breadcrumbs={[
        { label: makeTextVariant("古诗源"), href: "/" },
        { label: makeTextVariant(volume.name), href: `/v/${volumeSlug}` },
        { label: makeTextVariant(author.name) },
      ]}
    >
      <nav aria-label={`${author.name}诗作`}>
        <ol className="catalog__list">
          {poems.map((poem) => (
            <li key={poem.slug} className="catalog__item">
              <Link href={`/p/${poem.slug}`} className="catalog__link">
                <VariantText text={makeTextVariant(poem.title)} />
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </CatalogLayout>
  );
}
