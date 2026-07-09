import { describe, expect, it } from "vitest";
import {
  extractTitleFromHeading,
  iterateMergedH4Entries,
  parseChineseNumber,
  parseGroupChapterCount,
} from "./epub-poem-utils.mjs";

describe("parseChineseNumber", () => {
  it("parses simple and compound numerals", () => {
    expect(parseChineseNumber("六")).toBe(6);
    expect(parseChineseNumber("二")).toBe(2);
    expect(parseChineseNumber("二十")).toBe(20);
    expect(parseChineseNumber("二十三")).toBe(23);
    expect(parseChineseNumber("8")).toBe(8);
  });
});

describe("parseGroupChapterCount", () => {
  it("reads chapter counts from group titles", () => {
    expect(parseGroupChapterCount("补亡诗六章")).toBe(6);
    expect(parseGroupChapterCount("酬丁柴桑二章")).toBe(2);
    expect(parseGroupChapterCount("饮酒二十首")).toBe(20);
    expect(parseGroupChapterCount("南陔")).toBeNull();
  });
});

describe("iterateMergedH4Entries", () => {
  it("merges an empty group header with following sub-chapters", () => {
    const section = `
<h4 class="kindle-cn-heading1">补亡诗六章</h4>
<h4 class="kindle-cn-heading1">南陔</h4>
<p class="kindle-cn-poem-left">循彼南陔。言采其兰。</p>
<h4 class="kindle-cn-heading1">白华</h4>
<p class="kindle-cn-poem-left">白华朱萼。被于幽薄。</p>
<h4 class="kindle-cn-heading1">华黍</h4>
<p class="kindle-cn-poem-left">黮黮重云。辑辑和风。</p>
<h4 class="kindle-cn-heading1">由庚</h4>
<p class="kindle-cn-poem-left">荡荡夷庚。物则由之。</p>
<h4 class="kindle-cn-heading1">崇丘</h4>
<p class="kindle-cn-poem-left">瞻彼崇丘。其林蔼蔼。</p>
<h4 class="kindle-cn-heading1">由仪</h4>
<p class="kindle-cn-poem-left">肃肃君子。由仪率性。</p>
<h4 class="kindle-cn-heading1">杂诗</h4>
<p class="kindle-cn-poem-left">下一首。只有一首。</p>
`;
    const h4Matches = [
      ...section.matchAll(/<h4 class="kindle-cn-heading1">([\s\S]*?)<\/h4>/gi),
    ];
    const entries = iterateMergedH4Entries(section, h4Matches);

    expect(entries).toHaveLength(2);
    expect(entries[0].title).toBe("补亡诗六章");
    expect(entries[0].mode).toBe("multi-chapter");
    expect(entries[0].rawBlocks).toHaveLength(6);
    expect(entries[1].title).toBe("杂诗");
    expect(entries[1].mode).toBe("single");
  });

  it("extracts titles from heading markup", () => {
    const html =
      '<h4 class="kindle-cn-heading1" title="补亡诗六章">补亡诗六章</h4>';
    expect(extractTitleFromHeading(html)).toBe("补亡诗六章");
  });
});
