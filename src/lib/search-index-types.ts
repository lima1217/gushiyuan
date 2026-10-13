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
  /** 简体正文，换行已去掉，供子串匹配。 */
  body: string;
  bodyTraditional: string;
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

export type SearchResultPoem = SearchIndexPoem & {
  /** 正文命中时的句号分句；标题/作者命中时为空。 */
  matchedLine?: {
    simplified: string;
    traditional: string;
  };
  /** 命中句在正文中的句序，对应诗页锚点 `#line-N`。 */
  matchedLineIndex?: number;
};

export type SearchResults = {
  poems: SearchResultPoem[];
  authors: SearchIndexAuthor[];
};
