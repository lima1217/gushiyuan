export type SearchIndexPoem = {
  slug: string;
  title: string;
  titleTraditional: string;
  author: string;
  authorTraditional: string;
  authorSlug: string;
  volume: string;
  dynasty: string;
  dynastyTraditional: string;
};

export type SearchIndexAuthor = {
  name: string;
  nameTraditional: string;
  authorSlug: string;
  volume: string;
};

export type SearchIndex = {
  poems: SearchIndexPoem[];
  authors: SearchIndexAuthor[];
};

export const SEARCH_INDEX_URL = "/search-index.json";

export type SearchResults = {
  poems: SearchIndexPoem[];
  authors: SearchIndexAuthor[];
};
