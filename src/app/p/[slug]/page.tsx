import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PoemReader } from "@/components/PoemReader";
import { getLineageForPoem } from "@/lib/lineage";
import {
  getAdjacentPoemsInVolume,
  getAllPoems,
  getPoemBySlug,
  getVolumeBySlug,
} from "@/lib/poems";
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
  return createPageMetadata({
    title: `${poem.title} · ${poem.author} · 古诗源`,
    description: poem.body.slice(0, 80),
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

  const { prev, next } = getAdjacentPoemsInVolume(slug);
  const lineageByLine = getLineageForPoem(slug);

  return (
    <PoemReader
      poem={poem}
      breadcrumbs={[
        { label: volume.name, href: `/v/${volume.slug}` },
        {
          label: poem.author,
          href: `/v/${volume.slug}/${poem.authorSlug}`,
        },
        { label: poem.title },
      ]}
      prev={prev}
      next={next}
      lineageByLine={lineageByLine}
    />
  );
}
