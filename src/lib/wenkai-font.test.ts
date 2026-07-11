import { describe, expect, it } from "vitest";
import { WENKAI_SUBSET_PATHS } from "@/lib/wenkai-subset-path.generated";

describe("wenkai subset preload coverage", () => {
  it("keeps a first slice for layout preload and remaining slices for poem warm-up", () => {
    expect(WENKAI_SUBSET_PATHS.length).toBeGreaterThan(1);
    expect(WENKAI_SUBSET_PATHS[0]).toMatch(/wenkai-subset\.0\./);
    expect(WENKAI_SUBSET_PATHS.slice(1)).toHaveLength(
      WENKAI_SUBSET_PATHS.length - 1,
    );
  });
});
