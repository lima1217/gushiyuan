"use client";

import { useEffect, useRef, useState } from "react";
import type { BreadcrumbItem } from "@/components/Breadcrumbs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PoemNav } from "@/components/PoemNav";
import { PoemLine } from "@/components/PoemLine";
import { ReadingDirectionProvider } from "@/components/ReadingDirectionProvider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Character } from "@/lib/character-types";
import type { LineageByLine } from "@/lib/lineage";
import type { Poem, PoemMeta } from "@/lib/poems";
import {
  DEFAULT_READING_DIRECTION,
  type ReadingDirection,
  persistReadingDirection,
  readStoredReadingDirection,
} from "@/lib/reading-direction";
import { cn } from "@/lib/utils";

type PoemReaderProps = {
  poem: Poem;
  breadcrumbs: BreadcrumbItem[];
  prev?: PoemMeta;
  next?: PoemMeta;
  keyCharacters: Record<string, Character>;
  lineageByLine: LineageByLine;
};

export function PoemReader({
  poem,
  breadcrumbs,
  prev,
  next,
  keyCharacters,
  lineageByLine,
}: PoemReaderProps) {
  const lines = poem.body.split("\n").filter(Boolean);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<ReadingDirection>(
    DEFAULT_READING_DIRECTION,
  );

  useEffect(() => {
    setDirection(readStoredReadingDirection(localStorage));
  }, []);

  useEffect(() => {
    if (direction !== "vertical") {
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    function alignVerticalReadingStart() {
      if (!viewport) {
        return;
      }
      const overflow = viewport.scrollWidth - viewport.clientWidth;
      viewport.scrollLeft = overflow > 0 ? overflow : 0;
    }

    alignVerticalReadingStart();
    const frame = requestAnimationFrame(alignVerticalReadingStart);
    return () => cancelAnimationFrame(frame);
  }, [direction, lines.length]);

  function handleDirectionChange(value: string) {
    if (value !== "horizontal" && value !== "vertical") {
      return;
    }

    setDirection(value);
    persistReadingDirection(localStorage, value);
  }

  const poemContent = (
    <>
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
    </>
  );

  return (
    <main
      id="main-content"
      className={cn(
        "poem-reader relative flex min-h-dvh flex-col",
        direction === "vertical"
          ? "poem-reader--vertical"
          : "poem-reader--horizontal items-center justify-center",
      )}
    >
      <div className="poem-reader__toolbar">
        <ToggleGroup
          value={[direction]}
          onValueChange={(value) => {
            const nextDirection = value.at(-1);
            if (nextDirection) {
              handleDirectionChange(nextDirection);
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

      <div className="poem-reader__viewport">
        <ReadingDirectionProvider direction={direction}>
          <div className="poem-reader__sheet">
            <Breadcrumbs items={breadcrumbs} />
            {direction === "vertical" ? (
              <div ref={viewportRef} className="poem-reader__columns-viewport">
                <div className="poem-reader__columns">{poemContent}</div>
              </div>
            ) : (
              poemContent
            )}
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
                        <span
                          className="poem-reader__variant-mark"
                          aria-hidden="true"
                        >
                          {variant.line}
                        </span>
                        {variant.at && (
                          <span className="poem-reader__variant-at">
                            「{variant.at}」
                          </span>
                        )}
                        <span>{variant.note}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </footer>
            )}
            <PoemNav prev={prev} next={next} />
          </div>
        </ReadingDirectionProvider>
      </div>
    </main>
  );
}
