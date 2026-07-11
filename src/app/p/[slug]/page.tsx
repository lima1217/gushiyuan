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
  const title =
    poem.author === poem.title
      ? `${poem.title} · 古诗源`
      : `${poem.title} · ${poem.author} · 古诗源`;

  return createPageMetadata({
    title,
    description: poem.body.replace(/\n/g, "").slice(0, 80),
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
  );
}
