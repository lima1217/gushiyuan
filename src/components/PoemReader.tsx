"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BreadcrumbItem } from "@/components/Breadcrumbs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PoemNav } from "@/components/PoemNav";
import { PoemLine } from "@/components/PoemLine";
import { ReadingDirectionProvider } from "@/components/ReadingDirectionProvider";
import { ReadingDirectionToggle } from "@/components/ReadingDirectionToggle";
import {
  useScriptVariant,
  useVariantText,
} from "@/components/ScriptVariantProvider";
import { SiteChromeActions } from "@/components/SiteChromeActions";
import type {
  LineageByLineWithTraditional,
  PoemMetaWithTraditional,
  PoemWithTraditional,
} from "@/lib/script-conversion";
import { parsePoemBody } from "@/lib/poem-body";
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
  layout = "horizontal",
}: {
  dynasty: string;
  author: string;
  layout?: "horizontal" | "vertical";
}) {
  return (
    <p className="poem-reader__meta" aria-label={`${dynasty} · ${author}`}>
      <span className="poem-reader__meta-dynasty">{dynasty}</span>
      {layout === "horizontal" ? (
        <span className="poem-reader__meta-sep" aria-hidden="true">
          ·
        </span>
      ) : null}
      <span className="poem-reader__meta-author">{author}</span>
    </p>
  );
}

type PoemReaderProps = {
  poem: PoemWithTraditional;
  breadcrumbs: BreadcrumbItem[];
  prev?: PoemMetaWithTraditional;
  next?: PoemMetaWithTraditional;
  lineageByLine: LineageByLineWithTraditional;
};

export function PoemReader({
  poem,
  breadcrumbs,
  prev,
  next,
  lineageByLine,
}: PoemReaderProps) {
  const { variant } = useScriptVariant();
  const title = useVariantText({
    simplified: poem.title,
    traditional: poem.titleTraditional,
  });
  const author = useVariantText({
    simplified: poem.author,
    traditional: poem.authorTraditional,
  });
  const dynasty = useVariantText({
    simplified: poem.dynasty,
    traditional: poem.dynastyTraditional,
  });
  const body = useVariantText({
    simplified: poem.body,
    traditional: poem.bodyTraditional,
  });
  const { chapters } = useMemo(() => parsePoemBody(body), [body]);
  const chapterOffsets = useMemo(() => chapterSentenceOffsets(chapters), [chapters]);
  const verticalChapters = useMemo(
    () => groupVerticalColumnsByChapter(chapters),
    [chapters],
  );
  const sentenceCount = chapters.reduce(
    (total, chapter) => total + chapter.length,
    0,
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<ReadingDirection>(
    DEFAULT_READING_DIRECTION,
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setDirection(readStoredReadingDirection(localStorage));
    });
    return () => cancelAnimationFrame(frame);
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
  }, [direction, sentenceCount, variant]);

  function handleDirectionChange(value: ReadingDirection) {
    setDirection(value);
    persistReadingDirection(localStorage, value);
  }

  const horizontalContent = (
    <>
      <header className="poem-reader__header">
        <h1 className="poem-reader__title">{title}</h1>
        <PoemAttribution dynasty={dynasty} author={author} />
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
                    <h1 className="poem-reader__title">{title}</h1>
                    <PoemAttribution
                      dynasty={dynasty}
                      author={author}
                      layout="vertical"
                    />
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
