import {
  SEARCH_INDEX_URL,
  type SearchIndex,
} from "@/lib/search-index-types";

let searchIndexPromise: Promise<SearchIndex> | null = null;

export function loadSearchIndex(): Promise<SearchIndex> {
  if (searchIndexPromise) {
    return searchIndexPromise;
  }

  searchIndexPromise = fetch(SEARCH_INDEX_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load search index (${response.status})`);
      }
      return response.json() as Promise<SearchIndex>;
    })
    .catch((error) => {
      searchIndexPromise = null;
      throw error;
    });

  return searchIndexPromise;
}
