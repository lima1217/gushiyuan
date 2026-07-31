"use client";

import type { LineageClueWithTraditional } from "@/lib/script-conversion";
import { LineageHint } from "@/components/LineageHint";

type PoemSentenceProps = {
  sentence: string;
  lineIndex: number;
  lineageClue?: LineageClueWithTraditional;
  /** 栏内回行：句嵌在章容器里，用 span */
  inline?: boolean;
  /** 一句一列：逐字拆成 flex 字盒 */
  verticalColumn?: boolean;
};

function splitIntoCharacters(text: string): string[] {
  return [...text];
}

function VerticalColumnCharacters({
  sentence,
  lineIndex,
}: {
  sentence: string;
  lineIndex: number;
}) {
  return (
    <>
      <span className="sr-only">{sentence}</span>
      {splitIntoCharacters(sentence).map((character, index) => (
        <span
          key={`${lineIndex}-${index}-${character}`}
          className="poem-reader__char"
          aria-hidden="true"
        >
          {character}
        </span>
      ))}
    </>
  );
}

export function PoemSentence({
  sentence,
  lineIndex,
  lineageClue,
  inline = false,
  verticalColumn = false,
}: PoemSentenceProps) {
  const content = verticalColumn ? (
    <VerticalColumnCharacters sentence={sentence} lineIndex={lineIndex} />
  ) : (
    sentence
  );

  if (lineageClue) {
    return (
      <LineageHint clue={lineageClue} lineIndex={lineIndex} inline={inline}>
        {content}
      </LineageHint>
    );
  }

  if (inline) {
    return (
      <span id={`line-${lineIndex}`} className="poem-reader__sentence">
        {content}
      </span>
    );
  }

  return (
    <p id={`line-${lineIndex}`} className="poem-reader__line">
      {content}
    </p>
  );
}
