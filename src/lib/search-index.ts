import type {
  SearchIndex,
  SearchIndexAuthor,
} from "@/lib/search-index-types";
import { getAllPoems, getPoemBySlug, type Poem } from "@/lib/poems";

export type {
  SearchIndex,
  SearchIndexAuthor,
  SearchIndexPoem,
  SearchResults,
} from "@/lib/search-index-types";

export { filterSearchIndex } from "@/lib/search-filter";

function loadAllPoems(): Poem[] {
  return getAllPoems()
    .map((meta) => getPoemBySlug(meta.slug))
    .filter((poem): poem is Poem => poem !== undefined);
}

export function buildSearchIndex(): SearchIndex {
  const allPoems = loadAllPoems();

  const poems = allPoems
    .map((poem) => ({
      slug: poem.slug,
      title: poem.title,
      author: poem.author,
      authorSlug: poem.authorSlug,
      volume: poem.volume,
      dynasty: poem.dynasty,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));

  const authorMap = new Map<string, SearchIndexAuthor>();
  for (const poem of [...allPoems].sort((a, b) =>
    a.title.localeCompare(b.title, "zh-CN"),
  )) {
    if (authorMap.has(poem.authorSlug)) {
      continue;
    }

    authorMap.set(poem.authorSlug, {
      name: poem.author,
      authorSlug: poem.authorSlug,
      volume: poem.volume,
      poemSlug: poem.slug,
    });
  }

  return {
    poems,
    authors: [...authorMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "zh-CN"),
    ),
  };
}
