"use client";

import { useEffect, useMemo, useRef } from "react";
import type { BreadcrumbItem } from "@/components/Breadcrumbs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PoemNav } from "@/components/PoemNav";
import { PoemLine, PoemSentence } from "@/components/PoemLine";
import {
  useScriptVariant,
  useVariantText,
} from "@/components/ScriptVariantProvider";
import type {
  LineageByLineWithTraditional,
  PoemMetaWithTraditional,
  PoemWithTraditional,
} from "@/lib/script-conversion";
import { parsePoemBody } from "@/lib/poem-body";
import {
  VERTICAL_LAYOUT_LINE_PER_COLUMN,
  alignVerticalScrollToFirstColumn,
  applyVerticalReadingWheelDelta,
  chapterSentenceOffsets,
  hasVerticalReadingHorizontalOverflow,
  prepareVerticalDisplayChapters,
  resolveVerticalLayout,
  resolveVerticalHeadAlignment,
  shouldConsumeVerticalReadingWheel,
  verticalReadingScrollLeft,
} from "@/lib/vertical-layout";
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
  const { chapters: sourceChapters } = useMemo(
    () => parsePoemBody(poem.body),
    [poem.body],
  );
  const { chapters } = useMemo(() => parsePoemBody(body), [body]);
  const chapterOffsets = useMemo(() => chapterSentenceOffsets(chapters), [chapters]);
  const displayChapters = useMemo(
    () => prepareVerticalDisplayChapters(chapters),
    [chapters],
  );
  const verticalLayout = useMemo(
    () => resolveVerticalLayout(sourceChapters, poem.verticalLayout),
    [sourceChapters, poem.verticalLayout],
  );
  const sentenceCount = chapters.reduce(
    (total, chapter) => total + chapter.length,
    0,
  );

  const readingAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const head = headRef.current;
    const columns = columnsRef.current;
    if (!viewport || !head || !columns) {
      return;
    }

    let cancelled = false;

    function applyHeadAlignment() {
      const layout = layoutRef.current;
      if (!layout || !head || !columns || !viewport) {
        return;
      }

      const columnsRect = columns.getBoundingClientRect();
      const layoutRect = layout.getBoundingClientRect();
      const alignment = resolveVerticalHeadAlignment({
        viewportWidth: viewport.clientWidth,
        columnsWidth: columnsRect.width,
        columnsOffsetLeft: columnsRect.left - layoutRect.left,
      });

      if (alignment.mode === "gutter") {
        head.style.removeProperty("width");
        head.style.removeProperty("margin-inline-start");
        head.style.removeProperty("padding-inline-end");
        return;
      }

      head.style.width = `${alignment.width}px`;
      head.style.marginInlineStart = `${alignment.offsetLeft}px`;
      head.style.paddingInlineEnd = "0";
    }

    function syncVerticalReadingLayout() {
      if (!viewport) {
        return;
      }
      const target = verticalReadingScrollLeft(
        viewport.scrollWidth,
        viewport.clientWidth,
      );
      alignVerticalScrollToFirstColumn(viewport, target);
      applyHeadAlignment();
    }

    syncVerticalReadingLayout();
    const frame = requestAnimationFrame(syncVerticalReadingLayout);

    const observer = new ResizeObserver(() => {
      syncVerticalReadingLayout();
    });
    observer.observe(viewport);
    observer.observe(columns);

    void document.fonts.ready.then(() => {
      if (!cancelled) {
        syncVerticalReadingLayout();
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      head.style.removeProperty("width");
      head.style.removeProperty("margin-inline-start");
      head.style.removeProperty("padding-inline-end");
    };
  }, [sentenceCount, variant, verticalLayout]);

  useEffect(() => {
    const readingArea = readingAreaRef.current;
    const scrollViewport = viewportRef.current;
    if (!readingArea || !scrollViewport) {
      return;
    }

    function onWheel(event: WheelEvent) {
      if (
        event.target instanceof Element &&
        event.target.closest('[data-slot="popover-content"]')
      ) {
        return;
      }

      if (
        !hasVerticalReadingHorizontalOverflow(
          scrollViewport.scrollWidth,
          scrollViewport.clientWidth,
        )
      ) {
        return;
      }

      if (!shouldConsumeVerticalReadingWheel(event.deltaX, event.deltaY)) {
        return;
      }

      event.preventDefault();
      applyVerticalReadingWheelDelta(scrollViewport, event.deltaY);
    }

    readingArea.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      readingArea.removeEventListener("wheel", onWheel);
    };
  }, [sentenceCount, variant, verticalLayout]);

  return (
    <main
      id="main-content"
      className="poem-reader poem-reader--vertical relative flex min-h-dvh flex-col"
    >
      <div ref={readingAreaRef} className="poem-reader__viewport">
        <div ref={layoutRef} className="poem-reader__vertical-layout">
          <div ref={headRef} className="poem-reader__vertical-head site-breadcrumbs-bar">
            <Breadcrumbs items={breadcrumbs} />
          </div>
          <div ref={viewportRef} className="poem-reader__columns-viewport">
            <div
              ref={columnsRef}
              className={cn(
                "poem-reader__columns",
                verticalLayout === VERTICAL_LAYOUT_LINE_PER_COLUMN
                  ? "poem-reader__columns--line-per-column"
                  : "poem-reader__columns--reflow",
              )}
            >
              <header className="poem-reader__masthead">
                <h1 className="poem-reader__title">{title}</h1>
                <PoemAttribution dynasty={dynasty} author={author} />
              </header>
              {displayChapters.map((sentences, chapterIndex) => {
                const startLineIndex = chapterOffsets[chapterIndex] ?? 0;
                if (verticalLayout === VERTICAL_LAYOUT_LINE_PER_COLUMN) {
                  return (
                    <div
                      key={`chapter-${chapterIndex}`}
                      className="poem-reader__chapter-columns"
                    >
                      {sentences.map((line, sentenceIndex) => {
                        const lineIndex = startLineIndex + sentenceIndex;
                        return (
                          <div
                            key={`${lineIndex}-${line}`}
                            className="poem-reader__body-column"
                          >
                            <PoemLine
                              line={line}
                              lineIndex={lineIndex}
                              lineageClue={lineageByLine.get(lineIndex)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div
                    key={`chapter-${chapterIndex}`}
                    className="poem-reader__reflow-chapter"
                  >
                    {sentences.map((sentence, sentenceIndex) => {
                      const lineIndex = startLineIndex + sentenceIndex;
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
      </div>
    </main>
  );
}
