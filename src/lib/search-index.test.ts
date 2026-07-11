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
      index.poems.every(
        (p) => p.title && p.author && p.authorSlug && p.volume && p.body,
      ),
    ).toBe(true);
    expect(index.poems.find((p) => p.slug === "yin-jiu")?.authorTraditional).toBe(
      "陶潛",
    );
  });

  it("indexes poem body for line search", () => {
    const index = buildSearchIndex();
    const yinJiu = index.poems.find((p) => p.slug === "yin-jiu");

    expect(yinJiu?.body).toContain("采菊东篱下");
    expect(yinJiu?.bodyTraditional).toContain("採菊東籬下");
    expect(yinJiu?.body.includes("\n")).toBe(false);
  });

  it("lists distinct authors with volume metadata", () => {
    const index = buildSearchIndex();
    const jingKe = index.authors.find((a) => a.authorSlug === "jing-ke");
    const anonymous = index.authors.filter(
      (a) => a.volume === "gu-yi" && a.name === "佚名",
    );

    expect(jingKe?.name).toBe("荆轲");
    expect(jingKe?.volume).toBe("gu-yi");
    expect(index.poems.some((p) => p.authorSlug === "jing-ke")).toBe(true);
    expect(anonymous).toEqual([
      {
        name: "佚名",
        nameTraditional: "佚名",
        authorSlug: "yi-ming",
        volume: "gu-yi",
      },
    ]);
  });

  it("includes han, wei, jin, song, qi, liang, chen, bei-chao, and sui poems", () => {
    const index = buildSearchIndex();

    expect(index.poems.some((p) => p.volume === "han")).toBe(true);
    expect(index.poems.some((p) => p.slug === "da-feng-ge")).toBe(true);
    expect(index.poems.some((p) => p.volume === "wei")).toBe(true);
    expect(index.poems.some((p) => p.slug === "duan-ge-xing")).toBe(true);
    expect(
      index.poems.find((p) => p.slug === "duan-ge-xing")?.author,
    ).toBe("武帝");
    expect(index.poems.some((p) => p.volume === "jin")).toBe(true);
    expect(index.poems.some((p) => p.slug === "yin-jiu")).toBe(true);
    expect(
      index.poems.find((p) => p.slug === "yin-jiu")?.author,
    ).toBe("陶潜");
    expect(index.poems.some((p) => p.volume === "song")).toBe(true);
    expect(index.poems.some((p) => p.slug === "ni-xing-lu-nan")).toBe(true);
    expect(
      index.poems.find((p) => p.slug === "ni-xing-lu-nan")?.author,
    ).toBe("鲍照");
    expect(index.poems.some((p) => p.volume === "qi")).toBe(true);
    expect(index.poems.some((p) => p.slug === "yu-jie-yuan")).toBe(true);
    expect(
      index.poems.find((p) => p.slug === "yu-jie-yuan")?.author,
    ).toBe("谢朓");
    expect(index.poems.some((p) => p.volume === "liang")).toBe(true);
    expect(index.poems.some((p) => p.slug === "xiang-song")).toBe(true);
    expect(
      index.poems.find((p) => p.slug === "xiang-song")?.author,
    ).toBe("何逊");
    expect(index.poems.some((p) => p.volume === "chen")).toBe(true);
    expect(index.poems.some((p) => p.slug === "du-qing-cao-hu")).toBe(true);
    expect(
      index.poems.find((p) => p.slug === "du-qing-cao-hu")?.author,
    ).toBe("阴铿");
    expect(index.poems.some((p) => p.volume === "bei-chao")).toBe(true);
    expect(index.poems.some((p) => p.slug === "chi-le-ge")).toBe(true);
    expect(
      index.poems.find((p) => p.slug === "chi-le-ge")?.author,
    ).toBe("斛律金");
    expect(index.poems.some((p) => p.volume === "sui")).toBe(true);
    expect(index.poems.some((p) => p.slug === "xi-xi-yan")).toBe(true);
    expect(
      index.poems.find((p) => p.slug === "xi-xi-yan")?.author,
    ).toBe("薛道衡");
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

  it("matches traditional poem and author queries", () => {
    const poemResults = filterSearchIndex(index, "飲酒");
    const authorResults = filterSearchIndex(index, "鮑照");

    expect(poemResults.poems.some((p) => p.slug === "yin-jiu")).toBe(true);
    expect(authorResults.authors.some((a) => a.name === "鲍照")).toBe(true);
  });

  it("matches poem body lines and returns matchedLine", () => {
    const results = filterSearchIndex(index, "采菊东篱下");
    const yinJiu = results.poems.find((p) => p.slug === "yin-jiu");

    expect(yinJiu).toBeDefined();
    expect(yinJiu?.matchedLine?.simplified).toContain("采菊东篱下");
    expect(yinJiu?.matchedLine?.traditional).toContain("採菊東籬下");
  });

  it("matches traditional body queries", () => {
    const results = filterSearchIndex(index, "採菊東籬下");
    const yinJiu = results.poems.find((p) => p.slug === "yin-jiu");

    expect(yinJiu?.matchedLine?.simplified).toContain("采菊东篱下");
    expect(yinJiu?.matchedLine?.traditional).toContain("採菊東籬下");
  });

  it("omits matchedLine when title or author matches", () => {
    const byTitle = filterSearchIndex(index, "饮酒");
    const byAuthor = filterSearchIndex(index, "陶潜");

    expect(byTitle.poems.find((p) => p.slug === "yin-jiu")?.matchedLine).toBeUndefined();
    expect(
      byAuthor.poems.find((p) => p.slug === "yin-jiu")?.matchedLine,
    ).toBeUndefined();
  });

  it("limits results to keep the palette concise", () => {
    const bigIndex: SearchIndex = {
      poems: Array.from({ length: 20 }, (_, index) => ({
        slug: `poem-${index}`,
        title: `测试诗${index}`,
        titleTraditional: `測試詩${index}`,
        author: "测试作者",
        authorTraditional: "測試作者",
        authorSlug: "test-author",
        volume: "han",
        dynasty: "汉",
        dynastyTraditional: "漢",
        body: `正文${index}`,
        bodyTraditional: `正文${index}`,
      })),
      authors: Array.from({ length: 10 }, (_, index) => ({
        name: `作者${index}`,
        nameTraditional: `作者${index}`,
        authorSlug: `author-${index}`,
        volume: "han",
      })),
    };

    const results = filterSearchIndex(bigIndex, "测试");

    expect(results.poems.length).toBeLessThanOrEqual(8);
    expect(results.authors.length).toBeLessThanOrEqual(5);
  });
});
