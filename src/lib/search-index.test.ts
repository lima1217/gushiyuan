import { describe, expect, it } from "vitest";
import { filterSearchIndex } from "./search-filter";
import type { SearchIndex } from "./search-index-types";
import { buildSearchIndex } from "./search-index";

describe("buildSearchIndex", () => {
  it("includes every poem with title and author metadata", () => {
    const index = buildSearchIndex();

    expect(index.poems.length).toBeGreaterThanOrEqual(14);
    expect(index.poems.some((p) => p.slug === "duan-ge-xing" && p.title === "短歌行")).toBe(
      true,
    );
    expect(
      index.poems.every((p) => p.title && p.author && p.authorSlug && p.volume),
    ).toBe(true);
  });

  it("lists distinct authors with a representative poem slug", () => {
    const index = buildSearchIndex();
    const caoCao = index.authors.find((a) => a.authorSlug === "cao-cao");

    expect(caoCao?.name).toBe("曹操");
    expect(caoCao?.volume).toBe("wei");
    expect(caoCao?.poemSlug).toBeTruthy();
    expect(index.poems.some((p) => p.slug === caoCao?.poemSlug)).toBe(true);
  });

  it("picks the first poem by title as the author landing page", () => {
    const index = buildSearchIndex();
    const caoCao = index.authors.find((a) => a.authorSlug === "cao-cao");
    const caoCaoPoems = index.poems
      .filter((poem) => poem.authorSlug === "cao-cao")
      .sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));

    expect(caoCao?.poemSlug).toBe(caoCaoPoems[0]?.slug);
  });
});

describe("filterSearchIndex", () => {
  const index = buildSearchIndex();

  it("returns empty results for blank query", () => {
    expect(filterSearchIndex(index, "")).toEqual({
      poems: [],
      authors: [],
    });
  });

  it("matches poem titles", () => {
    const results = filterSearchIndex(index, "短歌");

    expect(results.poems.some((p) => p.slug === "duan-ge-xing")).toBe(true);
  });

  it("matches author names", () => {
    const results = filterSearchIndex(index, "曹操");

    expect(results.authors.some((a) => a.authorSlug === "cao-cao")).toBe(true);
  });

  it("limits results to keep the palette concise", () => {
    const bigIndex: SearchIndex = {
      poems: Array.from({ length: 20 }, (_, index) => ({
        slug: `poem-${index}`,
        title: `测试诗${index}`,
        author: "测试作者",
        authorSlug: "test-author",
        volume: "han",
        dynasty: "汉",
      })),
      authors: Array.from({ length: 10 }, (_, index) => ({
        name: `作者${index}`,
        authorSlug: `author-${index}`,
        volume: "han",
        poemSlug: `poem-${index}`,
      })),
    };

    const results = filterSearchIndex(bigIndex, "测试");

    expect(results.poems.length).toBeLessThanOrEqual(8);
    expect(results.authors.length).toBeLessThanOrEqual(5);
  });
});
