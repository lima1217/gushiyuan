import type {
  SearchIndex,
  SearchIndexPoem,
  SearchResultPoem,
  SearchResults,
} from "@/lib/search-index-types";

const MAX_POEM_RESULTS = 8;
const MAX_AUTHOR_RESULTS = 5;

function includesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

function matchesTitleOrAuthor(poem: SearchIndexPoem, query: string): boolean {
  return (
    includesQuery(poem.title, query) ||
    includesQuery(poem.titleTraditional, query) ||
    includesQuery(poem.author, query) ||
    includesQuery(poem.authorTraditional, query)
  );
}

function matchesBody(poem: SearchIndexPoem, query: string): boolean {
  return (
    includesQuery(poem.body, query) ||
    includesQuery(poem.bodyTraditional, query)
  );
}

/** 取含查询词的句号分句；简繁按同一分句下标对齐。 */
export function extractMatchedLine(
  body: string,
  bodyTraditional: string,
  query: string,
): { simplified: string; traditional: string } | undefined {
  const simplifiedParts = body.split("。");
  const traditionalParts = bodyTraditional.split("。");

  for (let i = 0; i < simplifiedParts.length; i++) {
    const simplified = simplifiedParts[i] ?? "";
    const traditional = traditionalParts[i] ?? simplified;
    if (!simplified && !traditional) {
      continue;
    }
    if (includesQuery(simplified, query) || includesQuery(traditional, query)) {
      const suffix =
        i < simplifiedParts.length - 1 || body.endsWith("。") ? "。" : "";
      return {
        simplified: `${simplified}${suffix}`,
        traditional: `${traditional}${suffix}`,
      };
    }
  }

  return undefined;
}

function toSearchResultPoem(
  poem: SearchIndexPoem,
  query: string,
): SearchResultPoem {
  if (matchesTitleOrAuthor(poem, query)) {
    return poem;
  }

  const matchedLine = extractMatchedLine(
    poem.body,
    poem.bodyTraditional,
    query,
  );
  return matchedLine ? { ...poem, matchedLine } : poem;
}

export function filterSearchIndex(
  index: SearchIndex,
  query: string,
): SearchResults {
  const trimmed = query.trim();
  if (!trimmed) {
    return { poems: [], authors: [] };
  }

  return {
    poems: index.poems
      .filter(
        (poem) =>
          matchesTitleOrAuthor(poem, trimmed) || matchesBody(poem, trimmed),
      )
      .slice(0, MAX_POEM_RESULTS)
      .map((poem) => toSearchResultPoem(poem, trimmed)),
    authors: index.authors
      .filter(
        (author) =>
          includesQuery(author.name, trimmed) ||
          includesQuery(author.nameTraditional, trimmed),
      )
      .slice(0, MAX_AUTHOR_RESULTS),
  };
}
