"use client";

import { useEffect, useRef, useState } from "react";
import type { BreadcrumbItem } from "@/components/Breadcrumbs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PoemNav } from "@/components/PoemNav";
import { PoemLine } from "@/components/PoemLine";
import { ReadingDirectionProvider } from "@/components/ReadingDirectionProvider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { LineageByLine } from "@/lib/lineage";
import type { Poem, PoemMeta } from "@/lib/poems";
import {
  DEFAULT_READING_DIRECTION,
  type ReadingDirection,
  alignVerticalScrollToFirstColumn,
  persistReadingDirection,
  readStoredReadingDirection,
  verticalReadingScrollLeft,
} from "@/lib/reading-direction";
import { cn } from "@/lib/utils";

type PoemReaderProps = {
  poem: Poem;
  breadcrumbs: BreadcrumbItem[];
  prev?: PoemMeta;
  next?: PoemMeta;
  lineageByLine: LineageByLine;
};

export function PoemReader({
  poem,
  breadcrumbs,
  prev,
  next,
  lineageByLine,
}: PoemReaderProps) {
  const lines = poem.body.split("\n").filter(Boolean);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<ReadingDirection>(
    DEFAULT_READING_DIRECTION,
  );

  // 竖排正文：四句一列（古籍版式，每列四句）
  const LINES_PER_COLUMN = 4;
  const lineColumns: string[][] = [];
  for (let i = 0; i < lines.length; i += LINES_PER_COLUMN) {
    lineColumns.push(lines.slice(i, i + LINES_PER_COLUMN));
  }

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

    let cancelled = false;

    function alignVerticalReadingStart() {
      if (!viewport) {
        return;
      }
      const target = verticalReadingScrollLeft(
        viewport.scrollWidth,
        viewport.clientWidth,
      );
      // 跨浏览器兜底：scrollLeft 原点正负两种情况都尝试。
      alignVerticalScrollToFirstColumn(viewport, target);
    }

    alignVerticalReadingStart();
    const frame = requestAnimationFrame(alignVerticalReadingStart);

    const observer = new ResizeObserver(() => {
      alignVerticalReadingStart();
    });
    observer.observe(viewport);

    void document.fonts.ready.then(() => {
      if (!cancelled) {
        alignVerticalReadingStart();
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
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
            lineageClue={lineageByLine.get(index)}
          />
        ))}
      </div>
    </>
  );

  const collationFooter =
    poem.variants.length > 0 ? (
      <footer className="poem-reader__collation">
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
    ) : null;

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
                <div className="poem-reader__columns">
                  {poemContent}
                  {collationFooter}
                </div>
              </div>
            ) : (
              <>
                {poemContent}
                {collationFooter}
              </>
            )}
            <PoemNav prev={prev} next={next} />
          </div>
        </ReadingDirectionProvider>
      </div>
    </main>
  );
}
