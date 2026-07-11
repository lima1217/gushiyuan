import { preload } from "react-dom";
import { WENKAI_SUBSET_PATHS } from "@/lib/wenkai-subset-path.generated";

export { WENKAI_SUBSET_PATHS };

function preloadWenkaiSlice(path: string): void {
  preload(path, {
    as: "font",
    crossOrigin: "anonymous",
    type: "font/woff2",
  });
}

/** Preload only the first unicode-range slice (UI/fallback glyphs). */
export function preloadWenkaiSubset(): void {
  const firstSlice = WENKAI_SUBSET_PATHS[0];
  if (!firstSlice) {
    return;
  }

  preloadWenkaiSlice(firstSlice);
}

/** Preload slices after the first — used on poem pages to warm glyph coverage. */
export function preloadRemainingWenkaiSubsets(): void {
  for (const path of WENKAI_SUBSET_PATHS.slice(1)) {
    preloadWenkaiSlice(path);
  }
}

/**
 * Schedule remaining-slice preload after the current frame is idle so poem
 * paint is not competing with ~1.3MB of font fetches.
 */
export function schedulePreloadRemainingWenkaiSubsets(): () => void {
  let cancelled = false;

  function run() {
    if (!cancelled) {
      preloadRemainingWenkaiSubsets();
    }
  }

  let idleId: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (typeof requestIdleCallback === "function") {
    idleId = requestIdleCallback(run, { timeout: 2000 });
  } else {
    timeoutId = setTimeout(run, 1);
  }

  return () => {
    cancelled = true;
    if (idleId !== undefined && typeof cancelIdleCallback === "function") {
      cancelIdleCallback(idleId);
    }
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  };
}
