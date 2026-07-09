import { describe, expect, it, vi } from "vitest";
import {
  MAX_LINE_PER_COLUMN_SENTENCES,
  VERTICAL_LAYOUT_LINE_PER_COLUMN,
  VERTICAL_LAYOUT_OVERRIDE_LINE_PER_COLUMN,
  VERTICAL_LAYOUT_OVERRIDE_REFLOW,
  VERTICAL_LAYOUT_REFLOW,
  alignVerticalScrollToFirstColumn,
  applyVerticalReadingWheelDelta,
  chapterSentenceOffsets,
  hasVerticalReadingHorizontalOverflow,
  inferVerticalLayout,
  parseVerticalLayoutOverride,
  prepareVerticalDisplayChapters,
  resolveVerticalLayout,
  resolveVerticalHeadAlignment,
  shouldConsumeVerticalReadingWheel,
  stripVerticalPunctuation,
  verticalReadingScrollLeft,
  verticalReadingWheelScrollLeft,
} from "./vertical-layout";

function repeatedLines(line: string, count: number): string[] {
  return Array.from({ length: count }, () => line);
}

describe("stripVerticalPunctuation", () => {
  it("removes periods and 顿号 for vertical display", () => {
    expect(stripVerticalPunctuation("山有木兮木有枝。")).toBe(
      "山有木兮木有枝",
    );
    expect(stripVerticalPunctuation("杖、铭。")).toBe("杖铭");
  });
});

describe("inferVerticalLayout", () => {
  it.each([
    { count: 3, line: "天地人。" },
    { count: 4, line: "关关雎鸠。" },
    { count: 5, line: "行行重行行。" },
    { count: 6, line: "悠悠洛阳道。" },
    { count: 7, line: "昔我往矣杨柳依。" },
    { count: 8, line: "天地玄黄宇宙洪荒。" },
  ])("uses one sentence per column for $count-character regular verse", ({ line }) => {
    expect(inferVerticalLayout([[line, line]])).toBe(
      VERTICAL_LAYOUT_LINE_PER_COLUMN,
    );
  });

  it("uses reflow for mixed-length verse", () => {
    expect(inferVerticalLayout([["日出而作。", "帝力于我何有哉。"]])).toBe(
      VERTICAL_LAYOUT_REFLOW,
    );
  });

  it("keeps short regular verse in one-sentence-per-column layout", () => {
    expect(
      inferVerticalLayout([
        repeatedLines("行行重行行。", MAX_LINE_PER_COLUMN_SENTENCES),
      ]),
    ).toBe(VERTICAL_LAYOUT_LINE_PER_COLUMN);
  });

  it("uses reflow for long narrative verse even when every sentence is regular", () => {
    expect(
      inferVerticalLayout([
        repeatedLines("行行重行行。", MAX_LINE_PER_COLUMN_SENTENCES + 1),
      ]),
    ).toBe(VERTICAL_LAYOUT_REFLOW);
  });

  it("classifies the whole poem across chapters", () => {
    expect(
      inferVerticalLayout([
        ["衮衣章甫。", "实获我所。"],
        ["章甫衮衣。", "惠我无私。"],
      ]),
    ).toBe(VERTICAL_LAYOUT_LINE_PER_COLUMN);
    expect(
      inferVerticalLayout([
        ["衮衣章甫。", "实获我所。"],
        ["日出而作。", "帝力于我何有哉。"],
      ]),
    ).toBe(VERTICAL_LAYOUT_REFLOW);
  });

  it("ignores periods and 顿号 when comparing sentence lengths", () => {
    expect(inferVerticalLayout([["山有木兮。", "木、有枝兮。"]])).toBe(
      VERTICAL_LAYOUT_LINE_PER_COLUMN,
    );
  });
});

describe("parseVerticalLayoutOverride", () => {
  it("accepts the two frontmatter override values", () => {
    expect(parseVerticalLayoutOverride("一句一列")).toBe(
      VERTICAL_LAYOUT_OVERRIDE_LINE_PER_COLUMN,
    );
    expect(parseVerticalLayoutOverride("栏内回行")).toBe(
      VERTICAL_LAYOUT_OVERRIDE_REFLOW,
    );
  });

  it("treats missing values as no override", () => {
    expect(parseVerticalLayoutOverride(undefined)).toBeUndefined();
    expect(parseVerticalLayoutOverride(null)).toBeUndefined();
    expect(parseVerticalLayoutOverride("")).toBeUndefined();
  });

  it("rejects invalid frontmatter values", () => {
    expect(() => parseVerticalLayoutOverride("齐言")).toThrow(
      /Invalid verticalLayout override/,
    );
  });
});

describe("resolveVerticalLayout", () => {
  it("lets frontmatter override automatic inference", () => {
    expect(
      resolveVerticalLayout(
        [["日出而作。", "帝力于我何有哉。"]],
        VERTICAL_LAYOUT_OVERRIDE_LINE_PER_COLUMN,
      ),
    ).toBe(VERTICAL_LAYOUT_LINE_PER_COLUMN);
    expect(
      resolveVerticalLayout(
        [["行行重行行。", "与君生别离。"]],
        VERTICAL_LAYOUT_OVERRIDE_REFLOW,
      ),
    ).toBe(VERTICAL_LAYOUT_REFLOW);
  });
});

describe("prepareVerticalDisplayChapters", () => {
  it("keeps chapter and sentence shape while removing vertical punctuation", () => {
    expect(
      prepareVerticalDisplayChapters([
        ["日出而作。", "凿井而饮。"],
        ["山、有木兮。"],
      ]),
    ).toEqual([["日出而作", "凿井而饮"], ["山有木兮"]]);
  });
});

describe("chapterSentenceOffsets", () => {
  it("assigns continuous global sentence indexes across chapters", () => {
    const chapters = [
      ["句1。", "句2。", "句3。", "句4。", "句5。"],
      ["句6。", "句7。", "句8。"],
    ];

    expect(chapterSentenceOffsets(chapters)).toEqual([0, 5]);
  });
});

describe("verticalReadingScrollLeft", () => {
  it("returns zero when content fits the viewport", () => {
    expect(verticalReadingScrollLeft(320, 320)).toBe(0);
    expect(verticalReadingScrollLeft(280, 320)).toBe(0);
  });

  it("returns overflow when content is wider than the viewport", () => {
    expect(verticalReadingScrollLeft(800, 320)).toBe(480);
  });
});

describe("alignVerticalScrollToFirstColumn", () => {
  type FakeViewport = {
    scrollWidth: number;
    clientWidth: number;
    scrollLeft: number;
    scrollTo: ReturnType<typeof vi.fn>;
  };

  function makeViewport(
    scrollWidth: number,
    clientWidth: number,
  ): FakeViewport {
    const el: FakeViewport = {
      scrollWidth,
      clientWidth,
      scrollLeft: 0,
      scrollTo: vi.fn((opts: { left: number }) => {
        el.scrollLeft = opts.left;
      }),
    };
    return el;
  }

  it("scrolls to the positive origin when the browser supports it", () => {
    const viewport = makeViewport(800, 320);
    alignVerticalScrollToFirstColumn(
      viewport as unknown as HTMLElement,
      480,
    );
    expect(viewport.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ left: 480 }),
    );
  });

  it("does not attempt negative fallback when target is zero", () => {
    const viewport = makeViewport(320, 320);
    alignVerticalScrollToFirstColumn(
      viewport as unknown as HTMLElement,
      0,
    );
    expect(viewport.scrollTo).toHaveBeenCalledTimes(1);
    expect(viewport.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ left: 0 }),
    );
  });
});

describe("hasVerticalReadingHorizontalOverflow", () => {
  it("is false when content fits the viewport", () => {
    expect(hasVerticalReadingHorizontalOverflow(320, 320)).toBe(false);
    expect(hasVerticalReadingHorizontalOverflow(320, 321)).toBe(false);
  });

  it("is true when content overflows by more than one pixel", () => {
    expect(hasVerticalReadingHorizontalOverflow(322, 320)).toBe(true);
  });
});

describe("shouldConsumeVerticalReadingWheel", () => {
  it("consumes vertical-dominant wheel deltas", () => {
    expect(shouldConsumeVerticalReadingWheel(0, 120)).toBe(true);
    expect(shouldConsumeVerticalReadingWheel(40, 120)).toBe(true);
  });

  it("ignores horizontal-dominant wheel deltas", () => {
    expect(shouldConsumeVerticalReadingWheel(120, 40)).toBe(false);
  });
});

describe("verticalReadingWheelScrollLeft", () => {
  it("maps wheel down to leftward reading progress", () => {
    expect(verticalReadingWheelScrollLeft(120)).toBe(-120);
    expect(verticalReadingWheelScrollLeft(-120)).toBe(120);
  });
});

describe("applyVerticalReadingWheelDelta", () => {
  it("scrolls the viewport by the mapped wheel delta", () => {
    const viewport = {
      scrollBy: vi.fn(),
    } as unknown as HTMLElement;

    applyVerticalReadingWheelDelta(viewport, 120);

    expect(viewport.scrollBy).toHaveBeenCalledWith({
      left: -120,
      behavior: "instant",
    });
  });
});

describe("resolveVerticalHeadAlignment", () => {
  it("syncs to centered columns when content fits the viewport", () => {
    expect(
      resolveVerticalHeadAlignment({
        viewportWidth: 800,
        columnsWidth: 320,
        columnsOffsetLeft: 240,
      }),
    ).toEqual({
      mode: "columns",
      offsetLeft: 240,
      width: 320,
    });
  });

  it("falls back to gutter alignment when columns overflow", () => {
    expect(
      resolveVerticalHeadAlignment({
        viewportWidth: 800,
        columnsWidth: 801,
        columnsOffsetLeft: 0,
      }),
    ).toEqual({ mode: "gutter" });
  });

  it("falls back to gutter alignment before columns are measured", () => {
    expect(
      resolveVerticalHeadAlignment({
        viewportWidth: 800,
        columnsWidth: 0,
        columnsOffsetLeft: 0,
      }),
    ).toEqual({ mode: "gutter" });
  });

  it("clamps negative offsets to zero", () => {
    expect(
      resolveVerticalHeadAlignment({
        viewportWidth: 800,
        columnsWidth: 320,
        columnsOffsetLeft: -4,
      }),
    ).toEqual({
      mode: "columns",
      offsetLeft: 0,
      width: 320,
    });
  });
});
