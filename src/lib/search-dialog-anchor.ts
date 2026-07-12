import type { CSSProperties } from "react";

const VIEWPORT_PAD = 12;
const GAP_BELOW_TRIGGER = 8;
const DIALOG_MAX_WIDTH_PX = 26 * 16;

export type SearchDialogAnchorVars = {
  "--search-dialog-top": string;
  "--search-dialog-left": string;
  "--search-dialog-origin": string;
};

export type SearchDialogAnchorStyle = {
  className: "site-search-dialog--anchored";
  style: SearchDialogAnchorVars;
};

/**
 * Position the search dialog just below the trigger, right-biased toward it,
 * and set transform-origin so open/close zoom toward the button.
 */
export function computeSearchDialogAnchor(
  anchor: HTMLElement | null,
  viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0,
  viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0,
): SearchDialogAnchorStyle | null {
  if (!anchor || viewportWidth <= 0) {
    return null;
  }

  const rect = anchor.getBoundingClientRect();
  const dialogWidth = Math.min(
    DIALOG_MAX_WIDTH_PX,
    viewportWidth - VIEWPORT_PAD * 2,
  );
  let left = rect.right - dialogWidth;
  left = Math.min(left, viewportWidth - VIEWPORT_PAD - dialogWidth);
  left = Math.max(VIEWPORT_PAD, left);

  const top = Math.min(
    rect.bottom + GAP_BELOW_TRIGGER,
    Math.max(VIEWPORT_PAD, viewportHeight - VIEWPORT_PAD - 160),
  );

  const originX = Math.min(
    Math.max(0, rect.left + rect.width / 2 - left),
    dialogWidth,
  );

  return {
    className: "site-search-dialog--anchored",
    style: {
      "--search-dialog-top": `${Math.round(top)}px`,
      "--search-dialog-left": `${Math.round(left)}px`,
      "--search-dialog-origin": `${Math.round(originX)}px 0px`,
    },
  };
}

export function searchDialogAnchorCss(
  vars: SearchDialogAnchorVars | undefined,
): CSSProperties | undefined {
  return vars as CSSProperties | undefined;
}
