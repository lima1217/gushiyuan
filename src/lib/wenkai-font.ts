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

/**
 * 切片按字频排序（见 scripts/generate-font-subset.ts），前 4 片覆盖全站约 86% 的正文字次。
 * 空闲时只预热这几片常用字；其余罕用字片由 unicode-range 按需加载，不再整套拉取。
 */
export const WARM_WENKAI_SLICE_COUNT = 4;

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

/** 省流量模式或 2G/3G 下跳过预热，只按需加载。 */
export function shouldWarmWenkaiSubsets(
  connection: NetworkInformationLike | undefined,
): boolean {
  if (!connection) {
    return true;
  }
  if (connection.saveData) {
    return false;
  }
  return !["slow-2g", "2g", "3g"].includes(connection.effectiveType ?? "");
}

/** Preload the common-glyph slices after the first — warms the next poem. */
export function preloadRemainingWenkaiSubsets(): void {
  for (const path of WENKAI_SUBSET_PATHS.slice(1, WARM_WENKAI_SLICE_COUNT)) {
    preloadWenkaiSlice(path);
  }
}

/**
 * Schedule common-slice preload after the current frame is idle so poem
 * paint is not competing with font fetches.
 */
export function schedulePreloadRemainingWenkaiSubsets(): () => void {
  const connection = (
    navigator as Navigator & { connection?: NetworkInformationLike }
  ).connection;
  if (!shouldWarmWenkaiSubsets(connection)) {
    return () => {};
  }

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
