import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogLayout } from "@/components/CatalogLayout";
import { CharacterEvolutionPanel } from "@/components/CharacterEvolutionPanel";
import { getAllCharacters, getCharacterByChar } from "@/lib/characters";
import { getPoemsByKeyChar } from "@/lib/poems";

type PageProps = {
  params: Promise<{ char: string }>;
};

export function generateStaticParams() {
  return getAllCharacters().map((character) => ({ char: character.char }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { char } = await params;
  const character = getCharacterByChar(char);
  if (!character) {
    return { title: "古诗源" };
  }

  return {
    title: `${character.char} · 字形演变 · 古诗源`,
    description: character.meaning,
  };
}

export default async function CharacterPage({ params }: PageProps) {
  const { char } = await params;
  const character = getCharacterByChar(char);
  if (!character) {
    notFound();
  }

  const poems = getPoemsByKeyChar(char);

  return (
    <CatalogLayout title={character.char}>
      <CharacterEvolutionPanel character={character} />

      {poems.length > 0 ? (
        <section className="char-page__poems" aria-label="含此字的诗">
          <h2 className="char-page__poems-title">含此字的诗</h2>
          <ol className="catalog__list">
            {poems.map((poem) => (
              <li key={poem.slug} className="catalog__item">
                <Link href={`/p/${poem.slug}`} className="catalog__link">
                  {poem.title}
                </Link>
                <span className="catalog__meta">{poem.author}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </CatalogLayout>
  );
}
