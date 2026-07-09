import { describe, expect, it, vi } from "vitest";
import {
  MAX_LINE_PER_COLUMN_SENTENCES,
  VERTICAL_LAYOUT_LINE_PER_COLUMN,
  VERTICAL_LAYOUT_OVERRIDE_LINE_PER_COLUMN,
  VERTICAL_LAYOUT_OVERRIDE_REFLOW,
  VERTICAL_LAYOUT_REFLOW,
  alignVerticalScrollToFirstColumn,
  chapterSentenceOffsets,
  inferVerticalLayout,
  parseVerticalLayoutOverride,
  prepareVerticalDisplayChapters,
  resolveVerticalLayout,
  stripVerticalPunctuation,
  verticalReadingScrollLeft,
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
