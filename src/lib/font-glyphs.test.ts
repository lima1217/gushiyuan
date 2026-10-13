import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  collectSiteFontGlyphs,
  extractCodePoints,
  FONT_GLYPH_FALLBACK,
  rankSiteFontGlyphs,
  uniqueSortedCodePoints,
} from "@/lib/font-glyphs";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function makeTempContent(content: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "font-glyphs-"));
  tempDirs.push(dir);

  for (const [relativePath, body] of Object.entries(content)) {
    const filePath = path.join(dir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, body, "utf8");
  }

  return dir;
}

describe("extractCodePoints", () => {
  it("extracts supplementary-plane code points", () => {
    expect(extractCodePoints("𠮷")).toEqual([0x20bb7]);
  });

  it("deduplicates with uniqueSortedCodePoints", () => {
    expect(uniqueSortedCodePoints([67, 65, 66, 65])).toEqual([65, 66, 67]);
  });
});

describe("collectSiteFontGlyphs", () => {
  it("includes fallback punctuation and UI glyphs", () => {
    const glyphs = collectSiteFontGlyphs();
    for (const char of ["，", "。", "「", "」", "…", "源", "诗"]) {
      expect(glyphs).toContain(char.codePointAt(0));
    }
    expect(glyphs).toContain("K".codePointAt(0));
  });

  it("collects characters from content and ui literals", () => {
    const contentRoot = makeTempContent({
      "poems/test.md": "关关雎鸠",
    });

    const glyphs = collectSiteFontGlyphs({
      contentRoot,
      uiLiterals: "检索面板",
    });
    for (const char of "关关雎鸠检索面板") {
      expect(glyphs).toContain(char.codePointAt(0));
    }
    for (const char of "關關雎鳩檢索面板") {
      expect(glyphs).toContain(char.codePointAt(0));
    }
  });

  it("includes derived traditional code points from content", () => {
    const contentRoot = makeTempContent({
      "poems/test.md": "古诗源陶渊明",
    });

    const glyphs = collectSiteFontGlyphs({ contentRoot, uiLiterals: "" });

    for (const char of "古詩源陶淵明") {
      expect(glyphs).toContain(char.codePointAt(0));
    }
  });

  it("includes common punctuation from FONT_GLYPH_FALLBACK", () => {
    const glyphs = collectSiteFontGlyphs();
    for (const char of FONT_GLYPH_FALLBACK) {
      expect(glyphs).toContain(char.codePointAt(0));
    }
  });

  it("merges extraCodePoints for the simplified-variant extension point (#22)", () => {
    const contentRoot = makeTempContent({ "poems/test.md": "關雎" });
    const extra = ["鸠".codePointAt(0)!, "洲".codePointAt(0)!];

    const glyphs = collectSiteFontGlyphs({
      contentRoot,
      extraCodePoints: extra,
    });

    // 繁体内容码点
    for (const char of "關雎") {
      expect(glyphs).toContain(char.codePointAt(0));
    }
    // 简体扩展码点（#22 并入入口）
    for (const codePoint of extra) {
      expect(glyphs).toContain(codePoint);
    }
  });
});

describe("rankSiteFontGlyphs", () => {
  it("covers the same glyph set as collectSiteFontGlyphs", () => {
    const contentRoot = makeTempContent({
      "poems/a.md": "关关雎鸠",
      "poems/b.md": "在河之洲",
    });
    const options = { contentRoot, uiLiterals: "检索" };

    expect(uniqueSortedCodePoints(rankSiteFontGlyphs(options))).toEqual(
      collectSiteFontGlyphs(options),
    );
  });

  it("puts UI glyphs first, then content glyphs by document frequency", () => {
    const contentRoot = makeTempContent({
      "poems/a.md": "山月",
      "poems/b.md": "山风",
      "poems/c.md": "山月",
    });

    const ranked = rankSiteFontGlyphs({ contentRoot, uiLiterals: "检" });
    const position = (char: string) => ranked.indexOf(char.codePointAt(0)!);

    expect(position("检")).toBeLessThan(position("山"));
    expect(position("山")).toBeLessThan(position("月"));
    expect(position("月")).toBeLessThan(position("风"));
  });
});
