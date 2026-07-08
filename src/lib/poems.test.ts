import { describe, expect, it } from "vitest";
import { getCharacterByChar } from "./characters";
import {
  getAdjacentPoemsInVolume,
  getAllPoems,
  getAllVolumes,
  getAuthorsByVolume,
  getPoemBySlug,
  getPoemsByAuthor,
  getPoemsByVolume,
  getVolumeBySlug,
  isVolumeEmpty,
} from "./poems";

describe("getPoemBySlug", () => {
  it("returns poem metadata and body for a known slug", () => {
    const poem = getPoemBySlug("duan-ge-xing");

    expect(poem).toBeDefined();
    expect(poem?.title).toBe("短歌行");
    expect(poem?.author).toBe("曹操");
    expect(poem?.authorSlug).toBe("cao-cao");
    expect(poem?.dynasty).toBe("魏");
    expect(poem?.volume).toBe("wei");
    expect(poem?.body).toContain("对酒当歌，人生几何！");
    expect(poem?.body).toContain("周公吐哺，天下归心。");
  });

  it("returns keyChars from frontmatter", () => {
    const poem = getPoemBySlug("duan-ge-xing");

    expect(poem?.keyChars).toEqual(["月", "心", "忧", "歌", "酒"]);
  });

  it("returns an empty keyChars list when frontmatter omits it", () => {
    const poem = getPoemBySlug("hao-li-xing");

    expect(poem?.keyChars).toEqual([]);
  });

  it("returns optional base and variants from frontmatter", () => {
    const poem = getPoemBySlug("duan-ge-xing");

    expect(poem?.base).toMatch(/古诗源/);
    expect(poem?.variants.length).toBeGreaterThan(0);
    expect(poem?.variants[0]).toEqual(
      expect.objectContaining({
        line: expect.any(Number),
        note: expect.stringMatching(/\S/),
      }),
    );
  });

  it("leaves variants empty when frontmatter omits them", () => {
    const poem = getPoemBySlug("guan-cang-hai");

    expect(poem?.base).toMatch(/古诗源/);
    expect(poem?.variants).toEqual([]);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getPoemBySlug("not-a-poem")).toBeUndefined();
  });
});

describe("poem keyChars reuse character library entries", () => {
  it("shares the same character data when multiple poems reference a character", () => {
    const duanGeXing = getPoemBySlug("duan-ge-xing");
    const guanCangHai = getPoemBySlug("guan-cang-hai");
    const yue = getCharacterByChar("月");

    expect(duanGeXing?.keyChars).toContain("月");
    expect(guanCangHai?.keyChars).toContain("月");
    expect(yue?.char).toBe("月");
  });
});

describe("getAllPoems", () => {
  it("lists every poem with slug and metadata", () => {
    const poems = getAllPoems();

    expect(poems.length).toBeGreaterThanOrEqual(1);
    expect(poems.some((p) => p.slug === "duan-ge-xing")).toBe(true);
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
      "xian-qin",
      "han",
      "wei",
      "jin",
      "nan-bei",
      "sui",
    ]);
    expect(volumes[0]?.name).toBe("先秦");
  });
});

describe("getVolumeBySlug", () => {
  it("returns a volume by slug", () => {
    expect(getVolumeBySlug("han")?.name).toBe("汉");
  });

  it("returns undefined for unknown slug", () => {
    expect(getVolumeBySlug("unknown")).toBeUndefined();
  });
});

describe("getAuthorsByVolume", () => {
  it("lists distinct authors in a volume", () => {
    const authors = getAuthorsByVolume("han");

    expect(authors.some((a) => a.slug === "gu-shi-shi-jiu-shou")).toBe(true);
    expect(authors.some((a) => a.slug === "han-yue-fu")).toBe(true);
    expect(authors.every((a) => a.slug && a.name)).toBe(true);
  });
});

describe("getPoemsByAuthor", () => {
  it("lists poems for an author within a volume", () => {
    const poems = getPoemsByAuthor("wei", "cao-cao");

    expect(poems.some((p) => p.slug === "duan-ge-xing")).toBe(true);
    expect(poems.every((p) => p.volume === "wei" && p.authorSlug === "cao-cao")).toBe(
      true,
    );
  });
});

describe("getPoemsByVolume", () => {
  it("orders poems by author then title within a volume", () => {
    const poems = getPoemsByVolume("wei");

    expect(poems.map((p) => p.slug)).toEqual([
      "duan-ge-xing",
      "guan-cang-hai",
      "gui-sui-shou",
      "hao-li-xing",
    ]);
  });

  it("returns an empty list for a volume with no poems", () => {
    expect(getPoemsByVolume("jin")).toEqual([]);
  });
});

describe("getAdjacentPoemsInVolume", () => {
  it("returns prev and next neighbors in volume order", () => {
    const { prev, next } = getAdjacentPoemsInVolume("guan-cang-hai");

    expect(prev?.slug).toBe("duan-ge-xing");
    expect(next?.slug).toBe("gui-sui-shou");
  });

  it("omits prev at the first poem in a volume", () => {
    const { prev, next } = getAdjacentPoemsInVolume("duan-ge-xing");

    expect(prev).toBeUndefined();
    expect(next?.slug).toBe("guan-cang-hai");
  });

  it("omits next at the last poem in a volume", () => {
    const poems = getPoemsByVolume("wei");
    const last = poems.at(-1);
    expect(last).toBeDefined();

    const { prev, next } = getAdjacentPoemsInVolume(last!.slug);

    expect(prev?.slug).toBe("gui-sui-shou");
    expect(next).toBeUndefined();
  });

  it("returns empty neighbors for an unknown slug", () => {
    expect(getAdjacentPoemsInVolume("not-a-poem")).toEqual({});
  });
});

describe("isVolumeEmpty", () => {
  it("returns true when a volume has no poems", () => {
    expect(isVolumeEmpty("jin")).toBe(true);
    expect(isVolumeEmpty("nan-bei")).toBe(true);
    expect(isVolumeEmpty("sui")).toBe(true);
  });

  it("returns false when a volume has poems", () => {
    expect(isVolumeEmpty("wei")).toBe(false);
    expect(isVolumeEmpty("han")).toBe(false);
  });
});
