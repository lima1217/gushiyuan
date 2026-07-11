import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isPlainPrimaryClick,
  navigateWithPoemTransition,
  notifyPoemNavigationPainted,
  shouldUsePoemViewTransition,
} from "./poem-view-transition";

describe("shouldUsePoemViewTransition", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is false when startViewTransition is missing", () => {
    vi.stubGlobal("document", {});
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false }),
    });
    expect(shouldUsePoemViewTransition()).toBe(false);
  });

  it("is false when the user prefers reduced motion", () => {
    vi.stubGlobal("document", { startViewTransition: vi.fn() });
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: true }),
    });
    expect(shouldUsePoemViewTransition()).toBe(false);
  });

  it("is true when VT exists and motion is allowed", () => {
    vi.stubGlobal("document", { startViewTransition: vi.fn() });
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false }),
    });
    expect(shouldUsePoemViewTransition()).toBe(true);
  });
});

describe("navigateWithPoemTransition", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    notifyPoemNavigationPainted();
  });

  it("navigates immediately without view transitions", () => {
    vi.stubGlobal("document", {});
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false }),
    });
    const navigate = vi.fn();
    navigateWithPoemTransition("/p/yin-jiu", navigate);
    expect(navigate).toHaveBeenCalledWith("/p/yin-jiu");
  });

  it("waits for paint notification inside startViewTransition", async () => {
    const updateCalls: Array<() => Promise<void>> = [];
    const startViewTransition = vi.fn((update: () => Promise<void>) => {
      updateCalls.push(update);
      return {};
    });
    vi.stubGlobal("document", { startViewTransition });
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false }),
    });

    const navigate = vi.fn();
    navigateWithPoemTransition("/p/yin-jiu", navigate);
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();

    const updatePromise = updateCalls[0]!();
    expect(navigate).toHaveBeenCalledWith("/p/yin-jiu");

    let settled = false;
    void updatePromise.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    notifyPoemNavigationPainted();
    await updatePromise;
    expect(settled).toBe(true);
  });
});

describe("isPlainPrimaryClick", () => {
  it("accepts unmodified left clicks only", () => {
    expect(
      isPlainPrimaryClick({
        button: 0,
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
      }),
    ).toBe(true);
    expect(
      isPlainPrimaryClick({
        button: 0,
        metaKey: true,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
      }),
    ).toBe(false);
    expect(
      isPlainPrimaryClick({
        button: 1,
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
      }),
    ).toBe(false);
  });
});
