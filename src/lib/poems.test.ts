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

  it("returns an empty list for a volume with no poems", () => {
    expect(getAuthorsByVolume("han")).toEqual([]);
    expect(getAuthorsByVolume("wei")).toEqual([]);
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
});

describe("getPoemsByVolume", () => {
  it("orders gu-yi poems by volume manifest", () => {
    const poems = getPoemsByVolume("gu-yi");

    expect(poems.length).toBeGreaterThanOrEqual(4);
    expect(poems[0]?.slug).toBe("ji-rang-ge");
    expect(poems.at(-1)?.slug).toBe("gu-yan-gu-yu");
  });

  it("returns an empty list for a volume with no poems", () => {
    expect(getPoemsByVolume("han")).toEqual([]);
    expect(getPoemsByVolume("wei")).toEqual([]);
    expect(getPoemsByVolume("jin")).toEqual([]);
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

describe("isVolumeEmpty", () => {
  it("returns true when a volume has no poems", () => {
    expect(isVolumeEmpty("han")).toBe(true);
    expect(isVolumeEmpty("wei")).toBe(true);
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
  });
});
