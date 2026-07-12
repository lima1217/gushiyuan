import { describe, expect, it } from "vitest";
import { computeSearchDialogAnchor } from "@/lib/search-dialog-anchor";

function mockAnchor(partial: Partial<DOMRect> & { width: number; height: number }) {
  const rect = {
    x: partial.x ?? partial.left ?? 0,
    y: partial.y ?? partial.top ?? 0,
    left: partial.left ?? 0,
    top: partial.top ?? 0,
    right: partial.right ?? (partial.left ?? 0) + partial.width,
    bottom: partial.bottom ?? (partial.top ?? 0) + partial.height,
    width: partial.width,
    height: partial.height,
    toJSON() {
      return this;
    },
  } satisfies DOMRect;

  return {
    getBoundingClientRect: () => rect,
  } as HTMLElement;
}

describe("computeSearchDialogAnchor", () => {
  it("returns null without an anchor", () => {
    expect(computeSearchDialogAnchor(null, 800, 600)).toBeNull();
  });

  it("right-biases the dialog under the trigger and sets origin toward it", () => {
    const anchor = mockAnchor({
      left: 700,
      top: 20,
      width: 28,
      height: 28,
      right: 728,
      bottom: 48,
    });

    const result = computeSearchDialogAnchor(anchor, 800, 600);
    expect(result).not.toBeNull();
    expect(result?.className).toBe("site-search-dialog--anchored");
    expect(result?.style["--search-dialog-top"]).toBe("56px");
    expect(result?.style["--search-dialog-left"]).toBe("312px");
    expect(result?.style["--search-dialog-origin"]).toBe("402px 0px");
  });

  it("keeps the dialog inside the viewport on the left edge", () => {
    const anchor = mockAnchor({
      left: 8,
      top: 16,
      width: 28,
      height: 28,
      right: 36,
      bottom: 44,
    });

    const result = computeSearchDialogAnchor(anchor, 400, 600);
    expect(result?.style["--search-dialog-left"]).toBe("12px");
    expect(result?.style["--search-dialog-top"]).toBe("52px");
  });
});
