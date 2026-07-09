"use client";

import type { LineageClue } from "@/lib/lineage-types";
import { LineageHint } from "@/components/LineageHint";

type LineageClueWithTraditional = Omit<LineageClue, "streams"> & {
  streams: (LineageClue["streams"][number] & {
    textTraditional?: string;
    authorTraditional?: string;
    workTraditional?: string;
    relationTraditional?: string;
    sourceTraditional?: string;
  })[];
};

type PoemSentenceProps = {
  sentence: string;
  lineIndex: number;
  lineageClue?: LineageClueWithTraditional;
  inline?: boolean;
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
      {splitIntoCharacters(sentence).map((character, index) => (
        <span
          key={`${lineIndex}-${index}-${character}`}
          className="poem-reader__char"
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

type PoemLineProps = {
  line: string;
  lineIndex: number;
  lineageClue?: LineageClueWithTraditional;
  verticalColumn?: boolean;
};

export function PoemLine({
  line,
  lineIndex,
  lineageClue,
  verticalColumn = false,
}: PoemLineProps) {
  return (
    <PoemSentence
      sentence={line}
      lineIndex={lineIndex}
      lineageClue={lineageClue}
      verticalColumn={verticalColumn}
    />
  );
}

type PoemRowProps = {
  sentences: string[];
  startLineIndex: number;
  lineageByLine: Map<number, LineageClueWithTraditional>;
};

export function PoemRow({
  sentences,
  startLineIndex,
  lineageByLine,
}: PoemRowProps) {
  return (
    <p className="poem-reader__line">
      {sentences.map((sentence, offset) => {
        const lineIndex = startLineIndex + offset;
        return (
          <PoemSentence
            key={`${lineIndex}-${sentence}`}
            sentence={sentence}
            lineIndex={lineIndex}
            lineageClue={lineageByLine.get(lineIndex)}
            inline
          />
        );
      })}
    </p>
  );
}
