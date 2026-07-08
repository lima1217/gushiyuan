import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_READING_DIRECTION,
  READING_DIRECTION_STORAGE_KEY,
  overlaySideForReadingDirection,
  parseReadingDirection,
  persistReadingDirection,
  readStoredReadingDirection,
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
