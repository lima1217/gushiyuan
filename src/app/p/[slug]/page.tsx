import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PoemReader } from "@/components/PoemReader";
import { getLineageForPoem } from "@/lib/lineage";
import {
  getAdjacentVolumeEntryPoems,
  getAllPoems,
  getCatalogAuthorSlug,
  getPoemBySlug,
  getReadingAdjacentPoems,
  getVolumeBySlug,
} from "@/lib/poems";
import { shouldHidePoemAuthor } from "@/lib/poem-display";
import {
  POEM_OG_IMAGE_HEIGHT,
  POEM_OG_IMAGE_WIDTH,
  poemOgImagePath,
} from "@/lib/poem-og";
import {
  buildPoemStructuredData,
  poemPagePath,
  serializeStructuredData,
} from "@/lib/poem-structured-data";
import {
  makeTextVariant,
  withTraditionalLineage,
  withTraditionalPoem,
  withTraditionalPoemMeta,
} from "@/lib/script-conversion";
import { createPageMetadata } from "@/lib/site-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllPoems().map((poem) => ({ slug: poem.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const poem = getPoemBySlug(slug);
  if (!poem) {
    return { title: "古诗源" };
  }
  const title = shouldHidePoemAuthor(poem)
    ? `${poem.title} · 古诗源`
    : `${poem.title} · ${poem.author} · 古诗源`;

  const ogImage = poemOgImagePath(slug);

  return createPageMetadata({
    title,
    description: poem.body.replace(/\n/g, "").slice(0, 80),
    alternates: { canonical: poemPagePath(slug) },
    openGraph: {
      type: "article",
      url: poemPagePath(slug),
      images: [
        {
          url: ogImage,
          width: POEM_OG_IMAGE_WIDTH,
          height: POEM_OG_IMAGE_HEIGHT,
          alt: title,
        },
      ],
    },
    twitter: { images: [ogImage] },
  });
}

export default async function PoemPage({ params }: PageProps) {
  const { slug } = await params;
  const poem = getPoemBySlug(slug);
  if (!poem) {
    notFound();
  }

  const volume = getVolumeBySlug(poem.volume);
  if (!volume) {
    notFound();
  }

  const { prev, next } = getReadingAdjacentPoems(slug);
  const { prevVolume, nextVolume } = getAdjacentVolumeEntryPoems(slug);
  const lineageByLine = getLineageForPoem(slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeStructuredData(buildPoemStructuredData(poem)),
        }}
      />
      <PoemReader
        poem={withTraditionalPoem(poem)}
        breadcrumbs={[
          { label: makeTextVariant("古诗源"), href: "/" },
          { label: makeTextVariant(volume.name), href: `/v/${volume.slug}` },
          {
            label: makeTextVariant(poem.author),
            href: `/v/${volume.slug}/${getCatalogAuthorSlug(poem)}`,
          },
        ]}
        prev={
          prev
            ? { ...withTraditionalPoemMeta(prev), crossVolume: prev.crossVolume }
            : undefined
        }
        next={
          next
            ? { ...withTraditionalPoemMeta(next), crossVolume: next.crossVolume }
            : undefined
        }
        prevVolume={prevVolume ? withTraditionalPoemMeta(prevVolume) : undefined}
        nextVolume={nextVolume ? withTraditionalPoemMeta(nextVolume) : undefined}
        lineageByLine={withTraditionalLineage(lineageByLine)}
      />
    </>
  );
}
