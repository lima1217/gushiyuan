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
import { parsePoemBody } from "@/lib/poem-body";
import type { Poem, PoemMeta } from "@/lib/poems";
import {
  DEFAULT_READING_DIRECTION,
  type ReadingDirection,
  alignVerticalScrollToFirstColumn,
  chapterSentenceOffsets,
  groupVerticalColumnsByChapter,
  persistReadingDirection,
  readStoredReadingDirection,
  verticalReadingScrollLeft,
} from "@/lib/reading-direction";
import { cn } from "@/lib/utils";

function PoemAttribution({
  dynasty,
  author,
}: {
  dynasty: string;
  author: string;
}) {
  return (
    <p className="poem-reader__meta" aria-label={`${dynasty} · ${author}`}>
      <span className="poem-reader__meta-dynasty">{dynasty}</span>
      <span className="poem-reader__meta-sep" aria-hidden="true">
        ·
      </span>
      <span className="poem-reader__meta-author">{author}</span>
    </p>
  );
}

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
  const { chapters } = parsePoemBody(poem.body);
  const chapterOffsets = chapterSentenceOffsets(chapters);
  const verticalChapters = groupVerticalColumnsByChapter(chapters);
  const sentenceCount = chapters.reduce(
    (total, chapter) => total + chapter.length,
    0,
  );

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

    let cancelled = false;

    function alignVerticalReadingStart() {
      if (!viewport) {
        return;
      }
      const target = verticalReadingScrollLeft(
        viewport.scrollWidth,
        viewport.clientWidth,
      );
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
  }, [direction, sentenceCount]);

  function handleDirectionChange(value: ReadingDirection) {
    setDirection(value);
    persistReadingDirection(localStorage, value);
  }

  const horizontalContent = (
    <>
      <header className="poem-reader__header">
        <h1 className="poem-reader__title">{poem.title}</h1>
        <PoemAttribution dynasty={poem.dynasty} author={poem.author} />
      </header>
      <div className="poem-reader__body">
        {chapters.map((sentences, chapterIndex) => {
          const startLineIndex = chapterOffsets[chapterIndex] ?? 0;
          return (
            <div
              key={`chapter-${chapterIndex}`}
              className={cn(
                "poem-reader__chapter",
                chapterIndex > 0 && "poem-reader__chapter--follows",
              )}
            >
              {sentences.map((sentence, sentenceIndex) => {
                const lineIndex = startLineIndex + sentenceIndex;
                return (
                  <PoemLine
                    key={`${lineIndex}-${sentence}`}
                    line={sentence}
                    lineIndex={lineIndex}
                    lineageClue={lineageByLine.get(lineIndex)}
                  />
                );
              })}
            </div>
          );
        })}
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
                <div className="poem-reader__columns">
                  <header className="poem-reader__masthead">
                    <h1 className="poem-reader__title">{poem.title}</h1>
                    <PoemAttribution dynasty={poem.dynasty} author={poem.author} />
                  </header>
                  {verticalChapters.map((columns, chapterIndex) => {
                    const startLineIndex = chapterOffsets[chapterIndex] ?? 0;
                    return (
                      <div
                        key={`chapter-${chapterIndex}`}
                        className="poem-reader__chapter-columns"
                      >
                        {columns.map((columnLines, colIndex) => {
                          const columnStartIndex =
                            startLineIndex +
                            columns
                              .slice(0, colIndex)
                              .reduce((sum, column) => sum + column.length, 0);
                          return (
                            <div
                              key={`col-${chapterIndex}-${colIndex}`}
                              className="poem-reader__body-column"
                            >
                              {columnLines.map((line, offset) => {
                                const lineIndex = columnStartIndex + offset;
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
