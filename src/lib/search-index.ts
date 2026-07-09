import type {
  SearchIndex,
  SearchIndexAuthor,
} from "@/lib/search-index-types";
import { toTraditional } from "@/lib/script-conversion";
import { getAllPoems, getCatalogAuthorSlug } from "@/lib/poems";

export type {
  SearchIndex,
  SearchIndexAuthor,
  SearchIndexPoem,
  SearchResults,
} from "@/lib/search-index-types";

export { filterSearchIndex } from "@/lib/search-filter";

export function buildSearchIndex(): SearchIndex {
  const allPoems = getAllPoems();

  const poems = allPoems
    .map((poem) => ({
      slug: poem.slug,
      title: poem.title,
      titleTraditional: toTraditional(poem.title),
      author: poem.author,
      authorTraditional: toTraditional(poem.author),
      authorSlug: poem.authorSlug,
      volume: poem.volume,
      dynasty: poem.dynasty,
      dynastyTraditional: toTraditional(poem.dynasty),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));

  const authorMap = new Map<string, SearchIndexAuthor>();
  for (const poem of allPoems) {
    const catalogAuthorSlug = getCatalogAuthorSlug(poem);
    const key = `${poem.volume}/${catalogAuthorSlug}`;
    if (authorMap.has(key)) {
      continue;
    }

    authorMap.set(key, {
      name: poem.author,
      nameTraditional: toTraditional(poem.author),
      authorSlug: catalogAuthorSlug,
      volume: poem.volume,
    });
  }

  return {
    poems,
    authors: [...authorMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "zh-CN"),
    ),
  };
}
