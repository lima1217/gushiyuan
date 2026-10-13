import { describe, expect, it } from "vitest";
import {
  shouldWarmWenkaiSubsets,
  WARM_WENKAI_SLICE_COUNT,
} from "@/lib/wenkai-font";
import { WENKAI_SUBSET_PATHS } from "@/lib/wenkai-subset-path.generated";

describe("wenkai subset preload coverage", () => {
  it("keeps a first slice for layout preload and a few common slices for poem warm-up", () => {
    expect(WENKAI_SUBSET_PATHS.length).toBeGreaterThan(WARM_WENKAI_SLICE_COUNT);
    expect(WENKAI_SUBSET_PATHS[0]).toMatch(/wenkai-subset\.0\./);
    expect(WENKAI_SUBSET_PATHS.slice(1, WARM_WENKAI_SLICE_COUNT)).toHaveLength(
      WARM_WENKAI_SLICE_COUNT - 1,
    );
  });
});

describe("shouldWarmWenkaiSubsets", () => {
  it("warms when connection info is unavailable", () => {
    expect(shouldWarmWenkaiSubsets(undefined)).toBe(true);
  });

  it("warms on fast connections", () => {
    expect(shouldWarmWenkaiSubsets({ effectiveType: "4g" })).toBe(true);
  });

  it("skips on save-data or slow connections", () => {
    expect(shouldWarmWenkaiSubsets({ saveData: true, effectiveType: "4g" })).toBe(
      false,
    );
    for (const effectiveType of ["slow-2g", "2g", "3g"]) {
      expect(shouldWarmWenkaiSubsets({ effectiveType })).toBe(false);
    }
  });
});
