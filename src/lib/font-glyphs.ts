import fs from "node:fs";
import path from "node:path";
import { FONT_UI_LITERALS } from "@/lib/font-ui-literals";
import { toTraditional } from "@/lib/script-conversion";

const CONTENT_ROOT = path.join(process.cwd(), "content");

/** UI、内容标点与检索面板所需的兜底字形。 */
export const FONT_GLYPH_FALLBACK =
  " \t\n\r" +
  "0123456789" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" +
  "，。、；：？！「」『』《》（）…—·\u201c\u201d\u2018\u2019\u3000" +
  "←→↑↓↔↕" +
  "⌘CtrlK";

export function extractCodePoints(text: string): number[] {
  const codePoints: number[] = [];
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined) {
      codePoints.push(codePoint);
    }
  }
  return codePoints;
}

export function uniqueSortedCodePoints(codePoints: Iterable<number>): number[] {
  return [...new Set(codePoints)].sort((a, b) => a - b);
}

function walkFiles(root: string, extensions: string[]): string[] {
  if (!fs.existsSync(root)) {
    return [];
  }

  const files: string[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (extensions.some((ext) => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  return files.sort();
}

export interface CollectSiteFontGlyphsOptions {
  contentRoot?: string;
  uiLiterals?: string;
  /**
   * 额外码点入口：供简繁切换（#22）并入简体/繁体字形。
   * #16 仅留出扩展点，不实现简繁派生逻辑。
   * 传入的码点会与内容、UI、fallback 合并去重。
   */
  extraCodePoints?: Iterable<number>;
}

export function collectSiteFontGlyphs(
  options?: CollectSiteFontGlyphsOptions,
): number[] {
  return uniqueSortedCodePoints(rankSiteFontGlyphs(options));
}

function addDocumentFrequency(
  frequency: Map<number, number>,
  text: string,
): void {
  for (const codePoint of new Set(extractCodePoints(text))) {
    frequency.set(codePoint, (frequency.get(codePoint) ?? 0) + 1);
  }
}

/**
 * 与 collectSiteFontGlyphs 同一字集，但按加载优先级排序：
 * UI/兜底字形在前（每页必用），其余按内容文件的文档频率降序（简繁取较高者），
 * 同频按码点升序。按此顺序分片可让一首诗只命中少数几片，而非按码点分散到全部分片。
 */
export function rankSiteFontGlyphs(
  options?: CollectSiteFontGlyphsOptions,
): number[] {
  const contentRoot = options?.contentRoot ?? CONTENT_ROOT;
  const uiLiterals = options?.uiLiterals ?? FONT_UI_LITERALS;

  const uiCodePoints = uniqueSortedCodePoints([
    ...extractCodePoints(FONT_GLYPH_FALLBACK),
    ...extractCodePoints(uiLiterals),
    ...extractCodePoints(toTraditional(uiLiterals)),
  ]);
  const uiSet = new Set(uiCodePoints);

  const simplifiedFrequency = new Map<number, number>();
  const traditionalFrequency = new Map<number, number>();
  for (const file of walkFiles(contentRoot, [".md", ".json"])) {
    const content = fs.readFileSync(file, "utf8");
    addDocumentFrequency(simplifiedFrequency, content);
    addDocumentFrequency(traditionalFrequency, toTraditional(content));
  }

  const score = (codePoint: number) =>
    Math.max(
      simplifiedFrequency.get(codePoint) ?? 0,
      traditionalFrequency.get(codePoint) ?? 0,
    );

  const contentCodePoints = uniqueSortedCodePoints([
    ...simplifiedFrequency.keys(),
    ...traditionalFrequency.keys(),
    ...(options?.extraCodePoints ?? []),
  ])
    .filter((codePoint) => !uiSet.has(codePoint))
    .sort((a, b) => score(b) - score(a) || a - b);

  return [...uiCodePoints, ...contentCodePoints];
}
