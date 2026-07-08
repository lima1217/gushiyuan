"use client";

import { useEffect, useRef, useState } from "react";
import type { BreadcrumbItem } from "@/components/Breadcrumbs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PoemNav } from "@/components/PoemNav";
import { PoemLine } from "@/components/PoemLine";
import { ReadingDirectionProvider } from "@/components/ReadingDirectionProvider";
import { ReadingDirectionToggle } from "@/components/ReadingDirectionToggle";
import { SiteChromeActions } from "@/components/SiteChromeActions";
import type { LineageByLine } from "@/lib/lineage";
import type { Poem, PoemMeta } from "@/lib/poems";
import {
  DEFAULT_READING_DIRECTION,
  type ReadingDirection,
  alignVerticalScrollToFirstColumn,
  groupVerticalLineColumns,
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

  // 竖排正文：四句一列（古籍版式）；余一句落单时均衡分列，避免末句孤列。
  const lineColumns = groupVerticalLineColumns(lines);
  const columnStartIndexes: number[] = [];
  let lineOffset = 0;
  for (const column of lineColumns) {
    columnStartIndexes.push(lineOffset);
    lineOffset += column.length;
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

  function handleDirectionChange(value: ReadingDirection) {
    setDirection(value);
    persistReadingDirection(localStorage, value);
  }

  // 横排：标题+朝代作者合一，正文逐行
  const horizontalContent = (
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
      <SiteChromeActions>
        <ReadingDirectionToggle
          direction={direction}
          onDirectionChange={handleDirectionChange}
        />
      </SiteChromeActions>

      <div className="poem-reader__viewport">
        <ReadingDirectionProvider direction={direction}>
          {direction === "vertical" ? (
            <div className="poem-reader__vertical-layout">
              <div className="poem-reader__vertical-head">
                <Breadcrumbs items={breadcrumbs} layout="horizontal" />
              </div>
              <div ref={viewportRef} className="poem-reader__columns-viewport">
                {/*
                  竖排正文区：仅诗题与正文成列，自右向左阅读。
                  row-reverse 让 masthead 落最右=起读列。
                */}
                <div className="poem-reader__columns">
                  <header className="poem-reader__masthead">
                    <h1 className="poem-reader__title">{poem.title}</h1>
                    <p className="poem-reader__meta">
                      {poem.dynasty} · {poem.author}
                    </p>
                  </header>
                  {lineColumns.map((columnLines, colIndex) => {
                    const startLineIndex = columnStartIndexes[colIndex] ?? 0;
                    return (
                      <div
                        key={`col-${colIndex}`}
                        className="poem-reader__body-column"
                      >
                        {columnLines.map((line, offset) => {
                          const lineIndex = startLineIndex + offset;
                          return (
                            <PoemLine
                              key={`${lineIndex}-${line}`}
                              line={line}
                              lineIndex={lineIndex}
                              lineageClue={lineageByLine.get(lineIndex)}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
              {(prev || next) && (
                <div className="poem-reader__vertical-foot">
                  <PoemNav prev={prev} next={next} />
                </div>
              )}
            </div>
          ) : (
            <div className="poem-reader__sheet">
              <Breadcrumbs items={breadcrumbs} />
              {horizontalContent}
              <PoemNav prev={prev} next={next} />
            </div>
          )}
        </ReadingDirectionProvider>
      </div>
    </main>
  );
}
