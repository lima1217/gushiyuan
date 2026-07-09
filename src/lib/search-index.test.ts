import { describe, expect, it } from "vitest";
import { filterSearchIndex } from "./search-filter";
import type { SearchIndex } from "./search-index-types";
import { buildSearchIndex } from "./search-index";

describe("buildSearchIndex", () => {
  it("includes every poem with title and author metadata", () => {
    const index = buildSearchIndex();

    expect(index.poems.length).toBeGreaterThanOrEqual(100);
    expect(
      index.poems.some((p) => p.slug === "ji-rang-ge" && p.title === "击壤歌"),
    ).toBe(true);
    expect(
      index.poems.every((p) => p.title && p.author && p.authorSlug && p.volume),
    ).toBe(true);
  });

  it("lists distinct authors with volume metadata", () => {
    const index = buildSearchIndex();
    const jingKe = index.authors.find((a) => a.authorSlug === "jing-ke");

    expect(jingKe?.name).toBe("荆轲");
    expect(jingKe?.volume).toBe("gu-yi");
    expect(index.poems.some((p) => p.authorSlug === "jing-ke")).toBe(true);
  });

  it("excludes removed han and wei poems", () => {
    const index = buildSearchIndex();

    expect(index.poems.some((p) => p.volume === "han")).toBe(false);
    expect(index.poems.some((p) => p.volume === "wei")).toBe(false);
    expect(index.poems.some((p) => p.slug === "duan-ge-xing")).toBe(false);
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
    const results = filterSearchIndex(index, "易水");

    expect(results.poems.some((p) => p.slug === "yi-shui-ge")).toBe(true);
  });

  it("matches author names", () => {
    const results = filterSearchIndex(index, "荆轲");

    expect(results.authors.some((a) => a.authorSlug === "jing-ke")).toBe(true);
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
      })),
    };

    const results = filterSearchIndex(bigIndex, "测试");

    expect(results.poems.length).toBeLessThanOrEqual(8);
    expect(results.authors.length).toBeLessThanOrEqual(5);
  });
});
