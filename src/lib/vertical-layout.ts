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

export function hasVerticalReadingHorizontalOverflow(
  scrollWidth: number,
  clientWidth: number,
): boolean {
  return scrollWidth > clientWidth + 1;
}

/**
 * 边缘判定容差（px）。须同时满足两侧约束：
 * 下界——容纳 scroll-padding（上限 2rem）与 scroll-snap 造成的残留，实测左缘可稳定停在约 24px；
 * 上界——必须小于一栏间距（22px 字号下实测 45px），否则整栏未读也会被判为已到边缘而提前翻页。
 */
export const VERTICAL_READING_EDGE_EPSILON_PX = 36;

/**
 * 竖排横向滚动是否已到视觉左/右端点。
 * 起读列在最右：正原点 ≈ +overflow，负原点 ≈ -overflow；读完端两种原点都 ≈ 0。
 */
export function isVerticalReadingAtHorizontalEdge(
  scrollLeft: number,
  scrollWidth: number,
  clientWidth: number,
  edge: "left" | "right",
  epsilon = VERTICAL_READING_EDGE_EPSILON_PX,
): boolean {
  const maxScroll = Math.max(scrollWidth - clientWidth, 0);
  if (maxScroll <= epsilon) {
    return true;
  }

  if (edge === "right") {
    return (
      Math.abs(scrollLeft - maxScroll) <= epsilon ||
      Math.abs(scrollLeft + maxScroll) <= epsilon
    );
  }

  return Math.abs(scrollLeft) <= epsilon;
}

/** 触控板已有横向 delta 时不劫持；否则把纵向滚轮映射为横向阅读滚动。 */
export function shouldConsumeVerticalReadingWheel(
  deltaX: number,
  deltaY: number,
): boolean {
  return Math.abs(deltaY) >= Math.abs(deltaX);
}

/** 滚轮下滚 → 视口向左移，沿竖排阅读方向推进。 */
export function verticalReadingWheelScrollLeft(deltaY: number): number {
  return -deltaY;
}

export function applyVerticalReadingWheelDelta(
  viewport: HTMLElement,
  deltaY: number,
): void {
  viewport.scrollBy({
    left: verticalReadingWheelScrollLeft(deltaY),
    behavior: "instant",
  });
}

/** 方向键横向滚动步长：一屏，便于长诗按视口翻栏。 */
export function verticalReadingKeyboardScrollStep(clientWidth: number): number {
  return Math.max(clientWidth, 1);
}

/**
 * 当前 `scrollLeft` 是否为负原点实现（起读端 ≈ -overflow）。
 * 仅认清晰负向信号；近 0 时请用 `resolveNegativeVerticalScrollOrigin` + sticky。
 */
export function isNegativeVerticalScrollOrigin(
  scrollLeft: number,
  maxScroll: number,
): boolean {
  if (maxScroll <= 0) {
    return false;
  }
  return scrollLeft < -0.5;
}

/**
 * 解析竖排横向滚动是否为负原点。
 * 清晰负向（小于 -0.5）或明显正向（大于边缘容差）覆盖 sticky；
 * 读完端附近（含 scroll-snap 残留约 24px）沿用 sticky。
 */
export function resolveNegativeVerticalScrollOrigin(
  scrollLeft: number,
  maxScroll: number,
  stickyNegativeOrigin = false,
  ambiguousEpsilon = VERTICAL_READING_EDGE_EPSILON_PX,
): boolean {
  if (maxScroll <= 0) {
    return false;
  }
  if (scrollLeft < -0.5) {
    return true;
  }
  if (scrollLeft > ambiguousEpsilon) {
    return false;
  }
  return stickyNegativeOrigin;
}

/**
 * ArrowLeft：沿阅读方向推进（视口左移）；ArrowRight：回退到起读端。
 * 正原点推进 → 负 delta；负原点推进 → 正 delta。
 */
export function verticalReadingKeyboardScrollDelta(
  key: "ArrowLeft" | "ArrowRight",
  scrollLeft: number,
  scrollWidth: number,
  clientWidth: number,
  stickyNegativeOrigin = false,
): number {
  const maxScroll = Math.max(scrollWidth - clientWidth, 0);
  const step = verticalReadingKeyboardScrollStep(clientWidth);
  const negativeOrigin = resolveNegativeVerticalScrollOrigin(
    scrollLeft,
    maxScroll,
    stickyNegativeOrigin,
  );
  const towardReadingEnd = key === "ArrowLeft";

  if (towardReadingEnd) {
    return negativeOrigin ? step : -step;
  }
  return negativeOrigin ? -step : step;
}

export function verticalReadingScrollBehavior(
  prefersReducedMotion: boolean,
): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}

/** 应用键盘横向滚动，并返回更新后的负原点 sticky。 */
export function applyVerticalReadingKeyboardScroll(
  viewport: HTMLElement,
  key: "ArrowLeft" | "ArrowRight",
  behavior: ScrollBehavior,
  stickyNegativeOrigin = false,
): boolean {
  const { scrollLeft, scrollWidth, clientWidth } = viewport;
  const maxScroll = Math.max(scrollWidth - clientWidth, 0);
  const negativeOrigin = resolveNegativeVerticalScrollOrigin(
    scrollLeft,
    maxScroll,
    stickyNegativeOrigin,
  );
  viewport.scrollBy({
    left: verticalReadingKeyboardScrollDelta(
      key,
      scrollLeft,
      scrollWidth,
      clientWidth,
      stickyNegativeOrigin,
    ),
    behavior,
  });
  return negativeOrigin;
}

