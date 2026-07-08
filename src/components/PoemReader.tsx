"use client";

import { useEffect, useState } from "react";
import type { Character } from "@/lib/character-types";
import type { LineageByLine } from "@/lib/lineage";
import type { Poem } from "@/lib/poems";
import {
  DEFAULT_READING_DIRECTION,
  type ReadingDirection,
  persistReadingDirection,
  readStoredReadingDirection,
} from "@/lib/reading-direction";
import { cn } from "@/lib/utils";
import { PoemLine } from "@/components/PoemLine";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type PoemReaderProps = {
  poem: Poem;
  keyCharacters: Record<string, Character>;
  lineageByLine: LineageByLine;
};

export function PoemReader({ poem, keyCharacters, lineageByLine }: PoemReaderProps) {
  const lines = poem.body.split("\n").filter(Boolean);
  const [direction, setDirection] = useState<ReadingDirection>(
    DEFAULT_READING_DIRECTION,
  );

  useEffect(() => {
    setDirection(readStoredReadingDirection(localStorage));
  }, []);

  function handleDirectionChange(value: string) {
    if (value !== "horizontal" && value !== "vertical") {
      return;
    }

    setDirection(value);
    persistReadingDirection(localStorage, value);
  }

  return (
    <article
      className={cn(
        "poem-reader relative flex min-h-dvh flex-col items-center justify-center px-8 py-16 md:px-12 md:py-24",
        direction === "vertical" && "poem-reader--vertical",
      )}
    >
      <div className="poem-reader__toolbar">
        <ToggleGroup
          value={[direction]}
          onValueChange={(value) => {
            const next = value.at(-1);
            if (next) {
              handleDirectionChange(next);
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
      </div>

      <div className="poem-reader__sheet">
        <header className="poem-reader__header">
          <h1 className="poem-reader__title">{poem.title}</h1>
          <p className="poem-reader__meta">
            {poem.dynasty} · {poem.author}
          </p>
        </header>
        <div className="poem-reader__body">
          {lines.map((line, index) => (
            <PoemLine
              key={`${index}-${line}`}
              line={line}
              lineIndex={index}
              keyCharacters={keyCharacters}
              lineageClue={lineageByLine.get(index)}
            />
          ))}
        </div>
        {(poem.base || poem.variants.length > 0) && (
          <footer className="poem-reader__collation">
            {poem.base && (
              <p className="poem-reader__base">底本：{poem.base}</p>
            )}
            {poem.variants.length > 0 && (
              <ol className="poem-reader__variants">
                {poem.variants.map((variant) => (
                  <li
                    key={`${variant.line}-${variant.at ?? ""}-${variant.note}`}
                    className="poem-reader__variant"
                  >
                    <span className="poem-reader__variant-mark" aria-hidden="true">
                      {variant.line}
                    </span>
                    {variant.at && (
                      <span className="poem-reader__variant-at">「{variant.at}」</span>
                    )}
                    <span>{variant.note}</span>
                  </li>
                ))}
              </ol>
            )}
          </footer>
        )}
      </div>
    </article>
  );
}
