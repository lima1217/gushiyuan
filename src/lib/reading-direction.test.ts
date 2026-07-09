import { describe, expect, it, vi } from "vitest";
import {
  alignVerticalScrollToFirstColumn,
  chapterSentenceOffsets,
  DEFAULT_READING_DIRECTION,
  groupHorizontalRows,
  groupHorizontalRowsByChapter,
  groupVerticalColumnsByChapter,
  groupVerticalLineColumns,
  READING_DIRECTION_STORAGE_KEY,
  overlaySideForReadingDirection,
  parseReadingDirection,
  persistReadingDirection,
  readStoredReadingDirection,
  verticalColumnSizeForCount,
  verticalReadingScrollLeft,
} from "./reading-direction";

describe("parseReadingDirection", () => {
  it("returns vertical only for the vertical token", () => {
    expect(parseReadingDirection("vertical")).toBe("vertical");
  });

  it("falls back to horizontal for missing or unknown values", () => {
    expect(parseReadingDirection(null)).toBe("horizontal");
    expect(parseReadingDirection("")).toBe("horizontal");
    expect(parseReadingDirection("landscape")).toBe("horizontal");
  });
});

describe("readStoredReadingDirection", () => {
  it("reads the persisted direction from storage", () => {
    const storage = {
      getItem: vi.fn().mockReturnValue("vertical"),
    };

    expect(readStoredReadingDirection(storage)).toBe("vertical");
    expect(storage.getItem).toHaveBeenCalledWith(READING_DIRECTION_STORAGE_KEY);
  });

  it("returns the default when nothing is stored", () => {
    const storage = {
      getItem: vi.fn().mockReturnValue(null),
    };

    expect(readStoredReadingDirection(storage)).toBe(DEFAULT_READING_DIRECTION);
  });
});

describe("persistReadingDirection", () => {
  it("writes the direction to storage", () => {
    const storage = {
      setItem: vi.fn(),
    };

    persistReadingDirection(storage, "vertical");

    expect(storage.setItem).toHaveBeenCalledWith(
      READING_DIRECTION_STORAGE_KEY,
      "vertical",
    );
  });
});

describe("overlaySideForReadingDirection", () => {
  it("opens popovers below in horizontal mode", () => {
    expect(overlaySideForReadingDirection("horizontal", "popover")).toBe(
      "bottom",
    );
  });

  it("opens tooltips above in horizontal mode", () => {
    expect(overlaySideForReadingDirection("horizontal", "tooltip")).toBe("top");
  });

  it("opens overlays to the left in vertical mode", () => {
    expect(overlaySideForReadingDirection("vertical", "popover")).toBe("left");
    expect(overlaySideForReadingDirection("vertical", "tooltip")).toBe("left");
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

describe("chapterSentenceOffsets", () => {
  it("assigns continuous global sentence indexes across chapters", () => {
    const chapters = [
      ["句1。", "句2。", "句3。", "句4。", "句5。"],
      ["句6。", "句7。", "句8。"],
    ];

    expect(chapterSentenceOffsets(chapters)).toEqual([0, 5]);
  });
});

describe("groupHorizontalRows", () => {
  const sentences = (count: number) =>
    Array.from({ length: count }, (_, i) => `句${i + 1}。`);

  it.each([
    { count: 1, expected: [["句1。"]] },
    { count: 2, expected: [["句1。"], ["句2。"]] },
    { count: 4, expected: [["句1。"], ["句2。"], ["句3。"], ["句4。"]] },
    {
      count: 5,
      expected: [["句1。"], ["句2。"], ["句3。"], ["句4。"], ["句5。"]],
    },
  ])("puts $count sentences one per row", ({ count, expected }) => {
    expect(groupHorizontalRows(sentences(count))).toEqual(expected);
  });
});

describe("groupHorizontalRowsByChapter", () => {
  it("groups each chapter independently", () => {
    const chapters = [
      ["日出而作。", "日入而息。", "凿井而饮。", "耕田而食。", "帝力于我何有哉。"],
      ["麛裘而鞸。", "投之无戾。", "鞸之麛裘。", "投之无邮。"],
    ];

    expect(groupHorizontalRowsByChapter(chapters)).toEqual([
      [["日出而作。"], ["日入而息。"], ["凿井而饮。"], ["耕田而食。"], ["帝力于我何有哉。"]],
      [["麛裘而鞸。"], ["投之无戾。"], ["鞸之麛裘。"], ["投之无邮。"]],
    ]);
  });
});

describe("verticalColumnSizeForCount", () => {
  it.each([
    { count: 3, size: 3 },
    { count: 4, size: 2 },
    { count: 5, size: 3 },
    { count: 6, size: 2 },
  ])("uses $size sentences per column for $count sentences", ({ count, size }) => {
    expect(verticalColumnSizeForCount(count)).toBe(size);
  });
});

describe("groupVerticalLineColumns", () => {
  const lines = (count: number) =>
    Array.from({ length: count }, (_, i) => `line-${i + 1}`);

  it("puts three odd-count lines in one column", () => {
    expect(groupVerticalLineColumns(lines(3))).toEqual([lines(3)]);
  });

  it("splits five odd-count lines into three and two", () => {
    expect(groupVerticalLineColumns(lines(5))).toEqual([
      lines(3),
      ["line-4", "line-5"],
    ]);
  });

  it("balances seven odd-count lines into three, two, and two", () => {
    expect(groupVerticalLineColumns(lines(7))).toEqual([
      lines(3),
      ["line-4", "line-5"],
      ["line-6", "line-7"],
    ]);
  });

  it("splits four even-count lines into two columns of two", () => {
    expect(groupVerticalLineColumns(lines(4))).toEqual([
      ["line-1", "line-2"],
      ["line-3", "line-4"],
    ]);
  });

  it("splits six even-count lines into three columns of two", () => {
    expect(groupVerticalLineColumns(lines(6))).toEqual([
      ["line-1", "line-2"],
      ["line-3", "line-4"],
      ["line-5", "line-6"],
    ]);
  });
});

describe("groupVerticalColumnsByChapter", () => {
  it("groups each chapter by its own sentence parity", () => {
    const chapters = [
      [
        "日出而作。",
        "日入而息。",
        "凿井而饮。",
        "耕田而食。",
        "帝力于我何有哉。",
      ],
      ["麛裘而鞸。", "投之无戾。", "鞸之麛裘。", "投之无邮。"],
      ["衮衣章甫。", "实获我所。", "章甫衮衣。", "惠我无私。"],
    ];

    expect(groupVerticalColumnsByChapter(chapters)).toEqual([
      [chapters[0].slice(0, 3), chapters[0].slice(3)],
      [chapters[1].slice(0, 2), chapters[1].slice(2)],
      [chapters[2].slice(0, 2), chapters[2].slice(2)],
    ]);
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
