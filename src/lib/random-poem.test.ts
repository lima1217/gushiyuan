import { describe, expect, it } from "vitest";
import { pickRandomPoemSlug, poemSlugFromPathname } from "./random-poem";

describe("pickRandomPoemSlug", () => {
  it("returns undefined for an empty list", () => {
    expect(pickRandomPoemSlug([])).toBeUndefined();
  });

  it("returns the only slug when the list has one entry", () => {
    expect(pickRandomPoemSlug(["ji-rang-ge"])).toBe("ji-rang-ge");
  });

  it("excludes the current slug when other poems exist", () => {
    const slugs = ["a", "b", "c"];
    for (let i = 0; i < 40; i += 1) {
      expect(pickRandomPoemSlug(slugs, "b")).not.toBe("b");
    }
  });

  it("falls back to the only slug when it is also excluded", () => {
    expect(pickRandomPoemSlug(["only"], "only")).toBe("only");
  });
});

describe("poemSlugFromPathname", () => {
  it("reads a poem slug from /p/[slug]", () => {
    expect(poemSlugFromPathname("/p/ji-rang-ge")).toBe("ji-rang-ge");
    expect(poemSlugFromPathname("/p/ji-rang-ge/")).toBe("ji-rang-ge");
  });

  it("returns null outside poem pages", () => {
    expect(poemSlugFromPathname("/")).toBeNull();
    expect(poemSlugFromPathname("/v/gu-yi")).toBeNull();
    expect(poemSlugFromPathname("/p/ji-rang-ge/extra")).toBeNull();
  });
});
