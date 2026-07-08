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

/** 竖排阅读起点：列自右向左，滚动到最右端。 */
export function verticalReadingScrollLeft(
  scrollWidth: number,
  clientWidth: number,
): number {
  const overflow = scrollWidth - clientWidth;
  return overflow > 0 ? overflow : 0;
}
