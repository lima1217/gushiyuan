import { describe, expect, it } from "vitest";
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
    expect(poem?.body).toContain("對酒當歌，人生幾何！");
    expect(poem?.body).toContain("周公吐哺，天下歸心。");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getPoemBySlug("not-a-poem")).toBeUndefined();
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

  it("orders gu-yi poems by volume manifest", () => {
    const poems = getPoemsByVolume("gu-yi");

    expect(poems.length).toBeGreaterThanOrEqual(4);
    expect(poems[0]?.slug).toBe("ji-rang-ge");
    expect(poems.at(-1)?.slug).toBe("gu-yan-gu-yu");
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
    expect(isVolumeEmpty("song")).toBe(true);
    expect(isVolumeEmpty("qi")).toBe(true);
    expect(isVolumeEmpty("liang")).toBe(true);
    expect(isVolumeEmpty("chen")).toBe(true);
    expect(isVolumeEmpty("bei-chao")).toBe(true);
    expect(isVolumeEmpty("sui")).toBe(true);
  });

  it("returns false when a volume has poems", () => {
    expect(isVolumeEmpty("gu-yi")).toBe(false);
    expect(isVolumeEmpty("wei")).toBe(false);
    expect(isVolumeEmpty("han")).toBe(false);
  });
});
