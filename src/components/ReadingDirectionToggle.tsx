"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ReadingDirection } from "@/lib/reading-direction";

type ReadingDirectionToggleProps = {
  direction: ReadingDirection;
  onDirectionChange: (direction: ReadingDirection) => void;
};

export function ReadingDirectionToggle({
  direction,
  onDirectionChange,
}: ReadingDirectionToggleProps) {
  return (
    <ToggleGroup
      value={[direction]}
      onValueChange={(value) => {
        const nextDirection = value.at(-1);
        if (nextDirection === "horizontal" || nextDirection === "vertical") {
          onDirectionChange(nextDirection);
        }
      }}
      variant="outline"
      size="sm"
      spacing={0}
      aria-label="阅读方向"
    >
      <ToggleGroupItem value="horizontal" aria-label="横排">
        横
      </ToggleGroupItem>
      <ToggleGroupItem value="vertical" aria-label="竖排">
        竖
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
