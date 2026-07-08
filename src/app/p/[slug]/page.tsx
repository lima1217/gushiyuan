import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PoemReader } from "@/components/PoemReader";
import { getKeyCharacterMap } from "@/lib/characters";
import { getLineageForPoem } from "@/lib/lineage";
import { getAllPoems, getPoemBySlug } from "@/lib/poems";
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

  const keyCharacters = getKeyCharacterMap(poem.keyChars);
  const lineageByLine = getLineageForPoem(slug);

  return (
    <PoemReader
      poem={poem}
      keyCharacters={keyCharacters}
      lineageByLine={lineageByLine}
    />
  );
}
