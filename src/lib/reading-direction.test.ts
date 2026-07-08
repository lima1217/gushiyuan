import { describe, expect, it, vi } from "vitest";
import {
  alignVerticalScrollToFirstColumn,
  DEFAULT_READING_DIRECTION,
  groupVerticalLineColumns,
  READING_DIRECTION_STORAGE_KEY,
  overlaySideForReadingDirection,
  parseReadingDirection,
  persistReadingDirection,
  readStoredReadingDirection,
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

describe("groupVerticalLineColumns", () => {
  const lines = (count: number) =>
    Array.from({ length: count }, (_, i) => `line-${i + 1}`);

  it("keeps short poems in a single column", () => {
    expect(groupVerticalLineColumns(lines(3))).toEqual([lines(3)]);
    expect(groupVerticalLineColumns(lines(4))).toEqual([lines(4)]);
  });

  it("chunks by four when the count is a multiple of four", () => {
    expect(groupVerticalLineColumns(lines(8))).toEqual([
      ["line-1", "line-2", "line-3", "line-4"],
      ["line-5", "line-6", "line-7", "line-8"],
    ]);
  });

  it("keeps five-line poems in one column for even spacing", () => {
    expect(groupVerticalLineColumns(lines(5))).toEqual([lines(5)]);
  });

  it("balances nine lines into three columns of three", () => {
    expect(groupVerticalLineColumns(lines(9))).toEqual([
      lines(3),
      ["line-4", "line-5", "line-6"],
      ["line-7", "line-8", "line-9"],
    ]);
  });

  it("keeps a trailing quartet when thirteen lines would otherwise orphan one", () => {
    expect(groupVerticalLineColumns(lines(13))).toEqual([
      lines(3),
      ["line-4", "line-5", "line-6"],
      ["line-7", "line-8", "line-9"],
      ["line-10", "line-11", "line-12", "line-13"],
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
