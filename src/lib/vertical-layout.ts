export const VERTICAL_LAYOUT_LINE_PER_COLUMN = "line-per-column";
export const VERTICAL_LAYOUT_REFLOW = "reflow";

export const VERTICAL_LAYOUT_OVERRIDE_LINE_PER_COLUMN = "一句一列";
export const VERTICAL_LAYOUT_OVERRIDE_REFLOW = "栏内回行";
export const MAX_LINE_PER_COLUMN_SENTENCES = 60;

export type VerticalLayout =
  | typeof VERTICAL_LAYOUT_LINE_PER_COLUMN
  | typeof VERTICAL_LAYOUT_REFLOW;

export type VerticalLayoutOverride =
  | typeof VERTICAL_LAYOUT_OVERRIDE_LINE_PER_COLUMN
  | typeof VERTICAL_LAYOUT_OVERRIDE_REFLOW;

export const VALID_VERTICAL_LAYOUT_OVERRIDES = [
  VERTICAL_LAYOUT_OVERRIDE_LINE_PER_COLUMN,
  VERTICAL_LAYOUT_OVERRIDE_REFLOW,
] as const;

const VERTICAL_PUNCTUATION_RE = /[。、]/g;

/** 各章首句的全局序号（0 起，跨章连续）。 */
export function chapterSentenceOffsets(chapters: string[][]): number[] {
  const offsets: number[] = [];
  let total = 0;
  for (const chapter of chapters) {
    offsets.push(total);
    total += chapter.length;
  }
  return offsets;
}

export function stripVerticalPunctuation(text: string): string {
  return text.replace(VERTICAL_PUNCTUATION_RE, "");
}

function sentenceLengthForLayout(sentence: string): number {
  return Array.from(stripVerticalPunctuation(sentence)).length;
}

export function parseVerticalLayoutOverride(
  value: unknown,
): VerticalLayoutOverride | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (
    value === VERTICAL_LAYOUT_OVERRIDE_LINE_PER_COLUMN ||
    value === VERTICAL_LAYOUT_OVERRIDE_REFLOW
  ) {
    return value;
  }

  throw new Error(
    `Invalid verticalLayout override "${String(value)}"; expected ${VALID_VERTICAL_LAYOUT_OVERRIDES.join(" / ")}`,
  );
}

export function layoutForOverride(
  override: VerticalLayoutOverride,
): VerticalLayout {
  return override === VERTICAL_LAYOUT_OVERRIDE_LINE_PER_COLUMN
    ? VERTICAL_LAYOUT_LINE_PER_COLUMN
    : VERTICAL_LAYOUT_REFLOW;
}

export function inferVerticalLayout(chapters: string[][]): VerticalLayout {
  const lengths = chapters.flat().map(sentenceLengthForLayout);
  if (lengths.length === 0) {
    return VERTICAL_LAYOUT_REFLOW;
  }

  const [firstLength] = lengths;
  const isRegularVerse =
    firstLength >= 3 &&
    firstLength <= 8 &&
    lengths.every((length) => length === firstLength);
  const isShortEnoughForLinePerColumn =
    lengths.length <= MAX_LINE_PER_COLUMN_SENTENCES;

  return isRegularVerse && isShortEnoughForLinePerColumn
    ? VERTICAL_LAYOUT_LINE_PER_COLUMN
    : VERTICAL_LAYOUT_REFLOW;
}

export function resolveVerticalLayout(
  chapters: string[][],
  override?: VerticalLayoutOverride,
): VerticalLayout {
  return override ? layoutForOverride(override) : inferVerticalLayout(chapters);
}

export function prepareVerticalDisplayChapters(
  chapters: string[][],
): string[][] {
  return chapters.map((chapter) => chapter.map(stripVerticalPunctuation));
}

/**
 * 竖排阅读起点：列自右向左，滚动到最右端（首列）。
 *
 * 跨浏览器健壮化：`scrollLeft` 的原点方向在不同浏览器/书写模式下不一致
 * （Chrome 在 `vertical-rl` 下原点为正且向左滚动递减；Firefox/Safari 的
 * 行为也曾不一致）。本函数只返回「最右端」的绝对滚动位置，由调用方
 * 对实际 `scrollLeft` 原点做正负两种情况兜底定位。
 */
export function verticalReadingScrollLeft(
  scrollWidth: number,
  clientWidth: number,
): number {
  const overflow = scrollWidth - clientWidth;
  return overflow > 0 ? overflow : 0;
}

/**
 * 将竖排首列（最右端）滚动到视口内，兼容 `scrollLeft` 原点正负两种浏览器实现。
 *
 * `vertical-rl` 下首列在最右端。在原点为正的浏览器（Chrome 桌面），
 * 最右端 = `scrollWidth - clientWidth`；在原点为负或 RTL-like 的实现里，
 * 最右端可能对应负值。本方法先尝试正值，再在未到位时尝试负值兜底。
 */
export function alignVerticalScrollToFirstColumn(
  viewport: HTMLElement,
  target: number,
): void {
  const maxScroll = viewport.scrollWidth - viewport.clientWidth;
  const positive = Math.min(Math.max(target, 0), Math.max(maxScroll, 0));

  viewport.scrollTo({ left: positive, behavior: "instant" });

  // 原点为负的浏览器：正向滚动无法到达首列时，向负方向兜底。
  if (Math.abs(viewport.scrollLeft - positive) > 1 && target > 0) {
    viewport.scrollTo({ left: -target, behavior: "instant" });
  }
}
