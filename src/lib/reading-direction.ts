export const VERTICAL_LINES_PER_COLUMN_ODD = 3;
export const VERTICAL_LINES_PER_COLUMN_EVEN = 2;
export const HORIZONTAL_SENTENCES_PER_ROW = 1;

/** 竖排列宽：奇数句三章一列，偶数句两章一列。 */
export function verticalColumnSizeForCount(count: number): number {
  return count % 2 === 1
    ? VERTICAL_LINES_PER_COLUMN_ODD
    : VERTICAL_LINES_PER_COLUMN_EVEN;
}

/**
 * 竖排分列：同一竖行内叠放若干句，列自右向左。
 * 列宽由句数奇偶决定（奇 3 / 偶 2）；奇数句且按三切分余一时改为 …3+2+2。
 */
export function groupVerticalLineColumns(
  lines: string[],
  columnSize?: number,
): string[][] {
  const count = lines.length;
  if (count === 0) {
    return [];
  }

  const size = columnSize ?? verticalColumnSizeForCount(count);

  if (size === 3 && count % 3 === 1 && count > 3) {
    const columns: string[][] = [];
    let index = 0;
    const leadingThrees = Math.floor((count - 4) / 3);
    for (let i = 0; i < leadingThrees; i++) {
      columns.push(lines.slice(index, index + 3));
      index += 3;
    }
    columns.push(lines.slice(index, index + 2));
    columns.push(lines.slice(index + 2, count));
    return columns;
  }

  const columns: string[][] = [];
  for (let i = 0; i < count; i += size) {
    columns.push(lines.slice(i, i + size));
  }
  return columns;
}

/** 横排正文分行：默认每行一句。 */
export function groupHorizontalRows(
  sentences: string[],
  rowSize = HORIZONTAL_SENTENCES_PER_ROW,
): string[][] {
  const rows: string[][] = [];
  for (let i = 0; i < sentences.length; i += rowSize) {
    rows.push(sentences.slice(i, i + rowSize));
  }
  return rows;
}

export function groupHorizontalRowsByChapter(
  chapters: string[][],
  rowSize = HORIZONTAL_SENTENCES_PER_ROW,
): string[][][] {
  return chapters.map((chapter) => groupHorizontalRows(chapter, rowSize));
}

export function groupVerticalColumnsByChapter(
  chapters: string[][],
): string[][][] {
  return chapters.map((chapter) => groupVerticalLineColumns(chapter));
}

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

export type ReadingDirection = "horizontal" | "vertical";

export type OverlayKind = "popover" | "tooltip";

export const READING_DIRECTION_STORAGE_KEY = "gushiyuan-reading-direction";

export const DEFAULT_READING_DIRECTION: ReadingDirection = "horizontal";

export function parseReadingDirection(
  value: string | null,
): ReadingDirection {
  if (value === "vertical") {
    return "vertical";
  }
  return "horizontal";
}

export function readStoredReadingDirection(
  storage: Pick<Storage, "getItem">,
): ReadingDirection {
  return parseReadingDirection(
    storage.getItem(READING_DIRECTION_STORAGE_KEY),
  );
}

export function persistReadingDirection(
  storage: Pick<Storage, "setItem">,
  direction: ReadingDirection,
): void {
  storage.setItem(READING_DIRECTION_STORAGE_KEY, direction);
}

export function overlaySideForReadingDirection(
  direction: ReadingDirection,
  kind: OverlayKind,
): "bottom" | "left" | "top" {
  if (direction === "vertical") {
    return "left";
  }

  return kind === "popover" ? "bottom" : "top";
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
