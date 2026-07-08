import type { SearchIndex, SearchResults } from "@/lib/search-index-types";

const MAX_POEM_RESULTS = 8;
const MAX_AUTHOR_RESULTS = 5;
const MAX_CHARACTER_RESULTS = 8;

function includesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function filterSearchIndex(
  index: SearchIndex,
  query: string,
): SearchResults {
  const trimmed = query.trim();
  if (!trimmed) {
    return { poems: [], authors: [], characters: [] };
  }

  return {
    poems: index.poems
      .filter((poem) => includesQuery(poem.title, trimmed))
      .slice(0, MAX_POEM_RESULTS),
    authors: index.authors
      .filter((author) => includesQuery(author.name, trimmed))
      .slice(0, MAX_AUTHOR_RESULTS),
    characters: index.characters
      .filter((character) => includesQuery(character.char, trimmed))
      .slice(0, MAX_CHARACTER_RESULTS),
  };
}
