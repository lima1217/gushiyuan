const NAVIGATION_TIMEOUT_MS = 2000;

type NavigateFn = (href: string) => void;

let pendingResolve: (() => void) | null = null;
let pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;

function settlePendingNavigation(): void {
  if (pendingTimeoutId !== null) {
    clearTimeout(pendingTimeoutId);
    pendingTimeoutId = null;
  }
  const resolve = pendingResolve;
  pendingResolve = null;
  resolve?.();
}

/** True when the browser exposes View Transitions and the user allows motion. */
export function shouldUsePoemViewTransition(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  if (!("startViewTransition" in document)) {
    return false;
  }
  if (typeof window === "undefined") {
    return false;
  }
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Resolve a pending poem navigation so the view transition can capture the
 * new DOM after `/p/[slug]` has remounted.
 */
export function notifyPoemNavigationPainted(): void {
  settlePendingNavigation();
}

/**
 * Navigate between poem pages under a short crossfade when supported.
 * Falls back to an immediate navigate() when VT is unavailable or reduced.
 */
export function navigateWithPoemTransition(
  href: string,
  navigate: NavigateFn,
): void {
  if (!shouldUsePoemViewTransition()) {
    navigate(href);
    return;
  }

  const startViewTransition = document.startViewTransition.bind(document);

  startViewTransition(async () => {
    await new Promise<void>((resolve) => {
      // Abort any in-flight poem VT so rapid ←/→ does not leave a hung promise.
      settlePendingNavigation();
      pendingResolve = resolve;
      pendingTimeoutId = setTimeout(() => {
        notifyPoemNavigationPainted();
      }, NAVIGATION_TIMEOUT_MS);
      navigate(href);
    });
  });
}

/** Soft-nav click that should use poem view transitions (plain left click). */
export function isPlainPrimaryClick(event: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
