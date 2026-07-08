"use client";

import type { LineageClue } from "@/lib/lineage-types";
import { LineageHint } from "@/components/LineageHint";

type PoemLineProps = {
  line: string;
  lineIndex: number;
  lineageClue?: LineageClue;
};

export function PoemLine({ line, lineIndex, lineageClue }: PoemLineProps) {
  if (lineageClue) {
    return (
      <LineageHint clue={lineageClue} lineIndex={lineIndex}>
        {line}
      </LineageHint>
    );
  }

  return (
    <p id={`line-${lineIndex}`} className="poem-reader__line">
      {line}
    </p>
  );
}
