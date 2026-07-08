export type SearchIndexPoem = {
  slug: string;
  title: string;
  author: string;
  authorSlug: string;
  volume: string;
  dynasty: string;
};

export type SearchIndexAuthor = {
  name: string;
  authorSlug: string;
  volume: string;
};

export type SearchIndex = {
  poems: SearchIndexPoem[];
  authors: SearchIndexAuthor[];
};

export type SearchResults = {
  poems: SearchIndexPoem[];
  authors: SearchIndexAuthor[];
};
