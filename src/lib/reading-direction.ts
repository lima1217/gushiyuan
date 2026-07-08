export const VERTICAL_LINES_PER_COLUMN = 4;

/**
 * 竖排正文分列：默认每列四句。余一句落单时（如五句古诗）改为 3+2、3+3+3
 * 等均衡分法，避免末句独占一列、列间距过大而显得突兀。
 */
export function groupVerticalLineColumns(
  lines: string[],
  columnSize = VERTICAL_LINES_PER_COLUMN,
): string[][] {
  const count = lines.length;
  if (count <= columnSize) {
    return [lines];
  }

  if (count % columnSize === 1) {
    // 五句短章不必硬拆两列，单列间距更匀
    if (count === 5) {
      return [lines];
    }

    const columns: string[][] = [];
    let index = 0;
    while (index < count) {
      const remaining = count - index;
      if (remaining === columnSize) {
        columns.push(lines.slice(index, index + columnSize));
        break;
      }
      if (remaining === 5) {
        columns.push(lines.slice(index, index + 3));
        columns.push(lines.slice(index + 3, count));
        break;
      }
      const take = Math.min(columnSize - 1, remaining);
      columns.push(lines.slice(index, index + take));
      index += take;
    }
    return columns;
  }

  const columns: string[][] = [];
  for (let i = 0; i < count; i += columnSize) {
    columns.push(lines.slice(i, i + columnSize));
  }
  return columns;
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
