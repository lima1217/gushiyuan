"use client";

import { useUiText } from "@/components/ScriptVariantProvider";
import type { ReadingDirection } from "@/lib/reading-direction";

type ReadingDirectionToggleProps = {
  direction: ReadingDirection;
  onDirectionChange: (direction: ReadingDirection) => void;
};

export function ReadingDirectionToggle({
  direction,
  onDirectionChange,
}: ReadingDirectionToggleProps) {
  const horizontal = useUiText("readingHorizontal");
  const vertical = useUiText("readingVertical");
  const ariaLabel = useUiText(
    direction === "horizontal"
      ? "readingDirectionAriaHorizontal"
      : "readingDirectionAriaVertical",
  );
  const label = direction === "horizontal" ? horizontal : vertical;

  return (
    <button
      type="button"
      className="site-chrome__control site-chrome__control--text"
      aria-label={ariaLabel}
      onClick={() =>
        onDirectionChange(
          direction === "horizontal" ? "vertical" : "horizontal",
        )
      }
    >
      {label}
    </button>
  );
}
