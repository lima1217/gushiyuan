import { describe, expect, it } from "vitest";
import {
  buildSiteUiText,
  makeTextVariant,
  toTraditional,
} from "@/lib/script-conversion";

describe("toTraditional", () => {
  it("converts simplified text with OpenCC s2t dictionaries", () => {
    expect(toTraditional("古诗源 陶渊明 齐")).toBe("古詩源 陶淵明 齊");
  });

  it("applies classical-context overrides after OpenCC conversion", () => {
    expect(toTraditional("子曰诗云")).toBe("子曰詩云");
    expect(toTraditional("皇后行千里")).toBe("皇后行千里");
  });
});

describe("makeTextVariant", () => {
  it("embeds simplified and derived traditional text", () => {
    expect(makeTextVariant("古诗源")).toEqual({
      simplified: "古诗源",
      traditional: "古詩源",
    });
  });
});

describe("buildSiteUiText", () => {
  it("derives traditional variants for fixed UI copy", () => {
    const uiText = buildSiteUiText();

    expect(uiText.siteName).toEqual({
      simplified: "古诗源",
      traditional: "古詩源",
    });
    expect(uiText.searchPlaceholder.traditional).toBe("詩題、作者…");
    expect(uiText.searchMatchCount).toEqual({
      simplified: "找到 %n 项",
      traditional: "找到 %n 項",
    });
    expect(uiText.languageTraditional).toEqual({
      simplified: "繁体",
      traditional: "繁體",
    });
    expect(uiText.volumeAuthorsAria.traditional).toBe("詩人");
    expect(uiText.authorPoemsAria.traditional).toBe("詩作");
    expect(uiText.poemCountLabel).toEqual({
      simplified: "%n 首",
      traditional: "%n 首",
    });
  });
});
