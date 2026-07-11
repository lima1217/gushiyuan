import { describe, expect, it } from "vitest";
import { parsePoemBody } from "./poem-body";
import {
  getAdjacentPoemsInVolume,
  getAdjacentVolumeEntryPoems,
  getAllPoems,
  getAllVolumes,
  ANONYMOUS_AUTHOR_NAME,
  ANONYMOUS_AUTHOR_SLUG,
  getAuthorsByVolume,
  getAuthorInVolume,
  getAuthorPageParams,
  getPoemBySlug,
  getPoemsByAuthor,
  getPoemsByVolume,
  getReadingAdjacentPoems,
  getVolumeBySlug,
  isVolumeEmpty,
} from "./poems";

describe("parsePoemBody", () => {
  it("parses a single-chapter poem into sentences", () => {
    const poem = getPoemBySlug("ji-rang-ge");
    expect(poem).toBeDefined();

    const { chapters } = parsePoemBody(poem!.body);
    expect(chapters).toHaveLength(1);
    expect(chapters[0]).toEqual([
      "日出而作。",
      "日入而息。",
      "凿井而饮。",
      "耕田而食。",
      "帝力于我何有哉。",
    ]);
  });

  it("parses multi-chapter poems separated by blank lines", () => {
    const poem = getPoemBySlug("kong-zi-song");
    expect(poem).toBeDefined();

    const { chapters } = parsePoemBody(poem!.body);
    expect(chapters).toHaveLength(2);
    expect(chapters[0]).toHaveLength(4);
    expect(chapters[1]).toHaveLength(4);
  });
});

describe("getPoemBySlug", () => {
  it("returns poem metadata and body for a known slug", () => {
    const poem = getPoemBySlug("ji-rang-ge");

    expect(poem).toBeDefined();
    expect(poem?.title).toBe("击壤歌");
    expect(poem?.author).toBe("尧时民歌");
    expect(poem?.authorSlug).toBe("yao-shi-min-ge");
    expect(poem?.dynasty).toBe("古逸");
    expect(poem?.volume).toBe("gu-yi");
    expect(poem?.body).toContain("日出而作。");
    expect(poem?.body).toContain("帝力于我何有哉。");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getPoemBySlug("not-a-poem")).toBeUndefined();
  });
});

describe("getAllPoems", () => {
  it("lists every poem with slug and metadata", () => {
    const poems = getAllPoems();

    expect(poems.length).toBeGreaterThanOrEqual(1);
    expect(poems.some((p) => p.slug === "ji-rang-ge")).toBe(true);
    expect(
      poems.every(
        (p) => p.title && p.author && p.authorSlug && p.dynasty && p.volume,
      ),
    ).toBe(true);
  });
});

describe("getAllVolumes", () => {
  it("returns volumes in catalog order", () => {
    const volumes = getAllVolumes();

    expect(volumes.map((v) => v.slug)).toEqual([
      "gu-yi",
      "han",
      "wei",
      "jin",
      "song",
      "qi",
      "liang",
      "chen",
      "bei-chao",
      "sui",
    ]);
    expect(volumes[0]?.name).toBe("古逸");
  });

  it("uses simplified Chinese for all volume names", () => {
    const traditionalVolumeChars = /[漢晉齊陳]/;

    for (const volume of getAllVolumes()) {
      expect(volume.name).not.toMatch(traditionalVolumeChars);
    }
  });
});

describe("getVolumeBySlug", () => {
  it("returns a volume by slug", () => {
    expect(getVolumeBySlug("han")?.name).toBe("汉");
    expect(getVolumeBySlug("jin")?.name).toBe("晋");
    expect(getVolumeBySlug("qi")?.name).toBe("齐");
    expect(getVolumeBySlug("chen")?.name).toBe("陈");
  });

  it("returns undefined for unknown slug", () => {
    expect(getVolumeBySlug("unknown")).toBeUndefined();
  });
});

describe("getAuthorsByVolume", () => {
  it("lists distinct authors in a volume", () => {
    const authors = getAuthorsByVolume("gu-yi");

    expect(authors.some((a) => a.slug === "yao-shi-min-ge")).toBe(true);
    expect(authors.every((a) => a.slug && a.name)).toBe(true);
  });

  it("lists distinct authors in the wei volume", () => {
    const authors = getAuthorsByVolume("wei");

    expect(authors.some((a) => a.slug === "wu-di" && a.name === "武帝")).toBe(
      true,
    );
    expect(authors.some((a) => a.slug === "cao-zhi" && a.name === "曹植")).toBe(
      true,
    );
    expect(authors.length).toBe(16);
  });

  it("lists distinct authors in the jin volume", () => {
    const authors = getAuthorsByVolume("jin");

    expect(authors.some((a) => a.slug === "tao-qian" && a.name === "陶潜")).toBe(
      true,
    );
    expect(authors.some((a) => a.slug === "lu-ji" && a.name === "陆机")).toBe(
      true,
    );
    expect(authors.length).toBe(32);
  });

  it("lists distinct authors in the song volume", () => {
    const authors = getAuthorsByVolume("song");

    expect(authors.some((a) => a.slug === "xie-ling-yun" && a.name === "谢灵运")).toBe(
      true,
    );
    expect(authors.some((a) => a.slug === "bao-zhao" && a.name === "鲍照")).toBe(
      true,
    );
    expect(authors.some((a) => a.slug === "yu-fu" && a.name === "渔父")).toBe(
      true,
    );
    expect(authors.length).toBe(18);
  });

  it("lists distinct authors in the qi volume", () => {
    const authors = getAuthorsByVolume("qi");

    expect(authors.some((a) => a.slug === "xie-tiao" && a.name === "谢朓")).toBe(
      true,
    );
    expect(authors.some((a) => a.slug === "wang-rong" && a.name === "王融")).toBe(
      true,
    );
    expect(authors.length).toBe(7);
  });

  it("lists distinct authors in the liang volume", () => {
    const authors = getAuthorsByVolume("liang");

    expect(authors.some((a) => a.slug === "he-xun" && a.name === "何逊")).toBe(
      true,
    );
    expect(authors.some((a) => a.slug === "jiang-yan" && a.name === "江淹")).toBe(
      true,
    );
    expect(authors.some((a) => a.slug === "yue-fu-ge-ci" && a.name === "乐府歌辞")).toBe(
      true,
    );
    expect(authors.length).toBe(21);
  });

  it("lists distinct authors in the chen volume", () => {
    const authors = getAuthorsByVolume("chen");

    expect(authors.some((a) => a.slug === "yin-keng" && a.name === "阴铿")).toBe(
      true,
    );
    expect(authors.some((a) => a.slug === "jiang-zong" && a.name === "江总")).toBe(
      true,
    );
    expect(authors.length).toBe(9);
  });

  it("lists distinct authors in the bei-chao volume", () => {
    const authors = getAuthorsByVolume("bei-chao");

    expect(authors.some((a) => a.slug === "yu-xin" && a.name === "庾信")).toBe(
      true,
    );
    expect(authors.some((a) => a.slug === "hu-lu-jin" && a.name === "斛律金")).toBe(
      true,
    );
    expect(authors.some((a) => a.slug === "za-ge-yao-ci" && a.name === "杂歌谣辞")).toBe(
      true,
    );
    expect(authors.length).toBe(15);
  });

  it("lists distinct authors in the sui volume", () => {
    const authors = getAuthorsByVolume("sui");

    expect(authors.some((a) => a.slug === "yang-di" && a.name === "炀帝")).toBe(
      true,
    );
    expect(authors.some((a) => a.slug === "xue-dao-heng" && a.name === "薛道衡")).toBe(
      true,
    );
    expect(authors.some((a) => a.slug === "wu-ming-shi" && a.name === "无名氏")).toBe(
      true,
    );
    expect(authors.length).toBe(16);
  });

  it("collapses anonymous authors into one catalog entry", () => {
    const authors = getAuthorsByVolume("gu-yi");
    const anonymousEntries = authors.filter((a) => a.name === ANONYMOUS_AUTHOR_NAME);

    expect(anonymousEntries).toEqual([
      { slug: ANONYMOUS_AUTHOR_SLUG, name: ANONYMOUS_AUTHOR_NAME },
    ]);
  });
});

describe("getPoemsByAuthor", () => {
  it("lists poems for an author within a volume", () => {
    const poems = getPoemsByAuthor("gu-yi", "jing-ke");

    expect(poems.some((p) => p.slug === "yi-shui-ge")).toBe(true);
    expect(
      poems.every((p) => p.volume === "gu-yi" && p.authorSlug === "jing-ke"),
    ).toBe(true);
  });

  it("lists all anonymous poems under the grouped author slug", () => {
    const poems = getPoemsByAuthor("gu-yi", ANONYMOUS_AUTHOR_SLUG);

    expect(poems.length).toBeGreaterThan(1);
    expect(poems.some((p) => p.slug === "zhang-ming")).toBe(true);
    expect(poems.some((p) => p.slug === "yue-ren-ge")).toBe(true);
    expect(poems.every((p) => p.author === ANONYMOUS_AUTHOR_NAME)).toBe(true);
  });
});

describe("getAuthorInVolume", () => {
  it("resolves grouped anonymous authors by canonical slug", () => {
    expect(getAuthorInVolume("gu-yi", ANONYMOUS_AUTHOR_SLUG)).toEqual({
      slug: ANONYMOUS_AUTHOR_SLUG,
      name: ANONYMOUS_AUTHOR_NAME,
    });
  });

  it("resolves legacy anonymous author slugs to the grouped entry", () => {
    expect(getAuthorInVolume("gu-yi", "yi-ming-zhang")).toEqual({
      slug: ANONYMOUS_AUTHOR_SLUG,
      name: ANONYMOUS_AUTHOR_NAME,
    });
  });
});

describe("getAuthorPageParams", () => {
  it("includes legacy anonymous author slugs for static export redirects", () => {
    const params = getAuthorPageParams();
    const guYiSlugs = new Set(
      params
        .filter((entry) => entry.volumeSlug === "gu-yi")
        .map((entry) => entry.authorSlug),
    );

    expect(guYiSlugs.has(ANONYMOUS_AUTHOR_SLUG)).toBe(true);
    expect(guYiSlugs.has("yi-ming-bi")).toBe(true);
    expect(guYiSlugs.has("yi-ming-zhang")).toBe(true);
  });
});

describe("getPoemsByVolume", () => {
  it("orders gu-yi poems by volume manifest", () => {
    const poems = getPoemsByVolume("gu-yi");

    expect(poems.length).toBeGreaterThanOrEqual(4);
    expect(poems[0]?.slug).toBe("ji-rang-ge");
    expect(poems.at(-1)?.slug).toBe("gu-yan-gu-yu");
  });

  it("orders han poems by volume manifest", () => {
    const poems = getPoemsByVolume("han");

    expect(poems.length).toBe(134);
    expect(poems[0]?.slug).toBe("da-feng-ge");
    expect(poems.at(-1)?.slug).toBe("su-dan-ge");
  });

  it("orders jin poems by volume manifest", () => {
    const poems = getPoemsByVolume("jin");

    expect(poems.length).toBe(103);
    expect(poems[0]?.slug).toBe("yan-yin-shi");
    expect(poems.at(-1)?.slug).toBe("mian-zhou-ba-ge");
  });

  it("orders song poems by volume manifest", () => {
    const poems = getPoemsByVolume("song");

    expect(poems.length).toBe(83);
    expect(poems[0]?.slug).toBe("zi-jun-zhi-chu-yi");
    expect(poems.at(-1)?.slug).toBe("qing-xi-xiao-gu-ge");
  });

  it("orders qi poems by volume manifest", () => {
    const poems = getPoemsByVolume("qi");

    expect(poems.length).toBe(43);
    expect(poems[0]?.slug).toBe("jiang-shang-qu");
    expect(poems.at(-1)?.slug).toBe("dong-hun-shi-bai-xing-ge");
  });

  it("orders liang poems by volume manifest", () => {
    const poems = getPoemsByVolume("liang");

    expect(poems.length).toBe(86);
    expect(poems[0]?.slug).toBe("yi-min");
    expect(poems.at(-1)?.slug).toBe("zhuo-nuo-ge");
  });

  it("orders chen poems by volume manifest", () => {
    const poems = getPoemsByVolume("chen");

    expect(poems.length).toBe(22);
    expect(poems[0]?.slug).toBe("du-qing-cao-hu");
    expect(poems.at(-1)?.slug).toBe("zhao-jun-ci");
  });

  it("orders bei-chao poems by volume manifest", () => {
    const poems = getPoemsByVolume("bei-chao");

    expect(poems.length).toBe(38);
    expect(poems[0]?.slug).toBe("duan-ju");
    expect(poems.at(-1)?.slug).toBe("du-he-bei");
  });

  it("orders sui poems by volume manifest", () => {
    const poems = getPoemsByVolume("sui");

    expect(poems.length).toBe(27);
    expect(poems[0]?.slug).toBe("yin-ma-chang-cheng-ku-xing-shi-cong-zheng-qun-chen");
    expect(poems.at(-1)?.slug).toBe("ji-ming-ge");
  });

  it("orders wei poems by volume manifest", () => {
    const poems = getPoemsByVolume("wei");

    expect(poems.length).toBe(63);
    expect(poems[0]?.slug).toBe("duan-ge-xing");
    expect(poems.at(-1)?.slug).toBe("sun-hao-tian-ji-zhong-tong-yao");
  });
});

describe("getAdjacentPoemsInVolume", () => {
  it("returns prev and next neighbors in volume order", () => {
    const { prev, next } = getAdjacentPoemsInVolume("kang-qu-yao");

    expect(prev?.slug).toBe("ji-rang-ge");
    expect(next?.slug).toBe("yi-qi-shi-la-ci");
  });

  it("omits prev at the first poem in a volume", () => {
    const { prev, next } = getAdjacentPoemsInVolume("ji-rang-ge");

    expect(prev).toBeUndefined();
    expect(next?.slug).toBe("kang-qu-yao");
  });

  it("omits next at the last poem in a volume", () => {
    const poems = getPoemsByVolume("gu-yi");
    const last = poems.at(-1);
    expect(last).toBeDefined();

    const { prev, next } = getAdjacentPoemsInVolume(last!.slug);

    expect(prev).toBeDefined();
    expect(next).toBeUndefined();
  });

  it("returns empty neighbors for an unknown slug", () => {
    expect(getAdjacentPoemsInVolume("not-a-poem")).toEqual({});
  });
});

describe("getReadingAdjacentPoems", () => {
  it("returns same-volume neighbors without crossVolume", () => {
    const { prev, next } = getReadingAdjacentPoems("kang-qu-yao");

    expect(prev?.slug).toBe("ji-rang-ge");
    expect(prev?.crossVolume).toBeUndefined();
    expect(next?.slug).toBe("yi-qi-shi-la-ci");
    expect(next?.crossVolume).toBeUndefined();
  });

  it("continues into the next volume after the last poem", () => {
    const last = getPoemsByVolume("gu-yi").at(-1);
    expect(last).toBeDefined();

    const { next } = getReadingAdjacentPoems(last!.slug);
    const hanFirst = getPoemsByVolume("han")[0];

    expect(next?.slug).toBe(hanFirst?.slug);
    expect(next?.crossVolume).toBe(true);
  });

  it("continues into the previous volume before the first poem", () => {
    const hanFirst = getPoemsByVolume("han")[0];
    expect(hanFirst).toBeDefined();

    const { prev } = getReadingAdjacentPoems(hanFirst!.slug);
    const guYiLast = getPoemsByVolume("gu-yi").at(-1);

    expect(prev?.slug).toBe(guYiLast?.slug);
    expect(prev?.crossVolume).toBe(true);
  });

  it("omits prev at the first poem of the first volume", () => {
    const { prev, next } = getReadingAdjacentPoems("ji-rang-ge");

    expect(prev).toBeUndefined();
    expect(next?.slug).toBe("kang-qu-yao");
  });

  it("omits next at the last poem of the last volume", () => {
    const last = getPoemsByVolume("sui").at(-1);
    expect(last).toBeDefined();

    const { prev, next } = getReadingAdjacentPoems(last!.slug);

    expect(prev).toBeDefined();
    expect(next).toBeUndefined();
  });

  it("returns empty neighbors for an unknown slug", () => {
    expect(getReadingAdjacentPoems("not-a-poem")).toEqual({});
  });
});

describe("getAdjacentVolumeEntryPoems", () => {
  it("returns first poems of neighboring volumes", () => {
    const { prevVolume, nextVolume } =
      getAdjacentVolumeEntryPoems("kang-qu-yao");

    expect(prevVolume).toBeUndefined();
    expect(nextVolume?.volume).toBe("han");
    expect(nextVolume?.slug).toBe(getPoemsByVolume("han")[0]?.slug);
  });

  it("returns both neighbors for a middle volume", () => {
    const weiFirst = getPoemsByVolume("wei")[0];
    expect(weiFirst).toBeDefined();

    const { prevVolume, nextVolume } = getAdjacentVolumeEntryPoems(
      weiFirst!.slug,
    );

    expect(prevVolume?.volume).toBe("han");
    expect(prevVolume?.slug).toBe(getPoemsByVolume("han")[0]?.slug);
    expect(nextVolume?.volume).toBe("jin");
    expect(nextVolume?.slug).toBe(getPoemsByVolume("jin")[0]?.slug);
  });

  it("omits nextVolume at the last volume", () => {
    const suiFirst = getPoemsByVolume("sui")[0];
    expect(suiFirst).toBeDefined();

    const { prevVolume, nextVolume } = getAdjacentVolumeEntryPoems(
      suiFirst!.slug,
    );

    expect(prevVolume?.volume).toBe("bei-chao");
    expect(nextVolume).toBeUndefined();
  });

  it("returns empty neighbors for an unknown slug", () => {
    expect(getAdjacentVolumeEntryPoems("not-a-poem")).toEqual({});
  });
});

describe("isVolumeEmpty", () => {
  it("returns false when a volume has poems", () => {
    expect(isVolumeEmpty("gu-yi")).toBe(false);
    expect(isVolumeEmpty("han")).toBe(false);
    expect(isVolumeEmpty("wei")).toBe(false);
    expect(isVolumeEmpty("jin")).toBe(false);
    expect(isVolumeEmpty("song")).toBe(false);
    expect(isVolumeEmpty("qi")).toBe(false);
    expect(isVolumeEmpty("liang")).toBe(false);
    expect(isVolumeEmpty("chen")).toBe(false);
    expect(isVolumeEmpty("bei-chao")).toBe(false);
    expect(isVolumeEmpty("sui")).toBe(false);
  });
});
