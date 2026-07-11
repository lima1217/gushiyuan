"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { BreadcrumbItem } from "@/components/Breadcrumbs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PoemNav } from "@/components/PoemNav";
import { SiteChromeTrail } from "@/components/SiteChromeTrail";
import { VariantText } from "@/components/VariantText";
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
  shouldConsumeVerticalReadingWheel,
  verticalReadingScrollLeft,
} from "@/lib/vertical-layout";
import { cn } from "@/lib/utils";
import type { VariantableText } from "@/lib/script-variant";
import {
  navigateWithPoemTransition,
  notifyPoemNavigationPainted,
} from "@/lib/poem-view-transition";
import { schedulePreloadRemainingWenkaiSubsets } from "@/lib/wenkai-font";

function PoemAttribution({
  dynasty,
  author,
  hideAuthor,
}: {
  dynasty: VariantableText;
  author: VariantableText;
  hideAuthor?: boolean;
}) {
  return (
    <p className="poem-reader__meta">
      <span className="poem-reader__meta-dynasty">
        <VariantText text={dynasty} />
      </span>
      {hideAuthor ? null : (
        <span className="poem-reader__meta-author">
          <VariantText text={author} />
        </span>
      )}
    </p>
  );
}

type PoemReaderProps = {
  poem: PoemWithTraditional;
  breadcrumbs: BreadcrumbItem[];
  prev?: PoemMetaWithTraditional & { crossVolume?: boolean };
  next?: PoemMetaWithTraditional & { crossVolume?: boolean };
  prevVolume?: PoemMetaWithTraditional;
  nextVolume?: PoemMetaWithTraditional;
  lineageByLine: LineageByLineWithTraditional;
};

export function PoemReader({
  poem,
  breadcrumbs,
  prev,
  next,
  prevVolume,
  nextVolume,
  lineageByLine,
}: PoemReaderProps) {
  const router = useRouter();
  const { variant } = useScriptVariant();
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

  useEffect(() => {
    for (const neighbor of [prev, next, prevVolume, nextVolume]) {
      if (neighbor) {
        router.prefetch(`/p/${neighbor.slug}`);
      }
    }
  }, [next, nextVolume, prev, prevVolume, router]);

  useEffect(() => {
    notifyPoemNavigationPainted();
  }, [poem.slug]);

  useEffect(() => schedulePreloadRemainingWenkaiSubsets(), []);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }
      if (
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight" &&
        event.key !== "ArrowUp" &&
        event.key !== "ArrowDown"
      ) {
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      if (event.key === "ArrowLeft" && prev) {
        event.preventDefault();
        navigateWithPoemTransition(`/p/${prev.slug}`, (href) => {
          router.push(href);
        });
        return;
      }
      if (event.key === "ArrowRight" && next) {
        event.preventDefault();
        navigateWithPoemTransition(`/p/${next.slug}`, (href) => {
          router.push(href);
        });
        return;
      }
      if (event.key === "ArrowUp" && prevVolume) {
        event.preventDefault();
        navigateWithPoemTransition(`/p/${prevVolume.slug}`, (href) => {
          router.push(href);
        });
        return;
      }
      if (event.key === "ArrowDown" && nextVolume) {
        event.preventDefault();
        navigateWithPoemTransition(`/p/${nextVolume.slug}`, (href) => {
          router.push(href);
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, nextVolume, prev, prevVolume, router]);

  useEffect(() => {
    const scrollViewport = viewportRef.current;
    if (!scrollViewport) {
      return;
    }

    let cancelled = false;

    function alignVerticalReadingStart() {
      if (!scrollViewport) {
        return;
      }
      const target = verticalReadingScrollLeft(
        scrollViewport.scrollWidth,
        scrollViewport.clientWidth,
      );
      alignVerticalScrollToFirstColumn(scrollViewport, target);
    }

    alignVerticalReadingStart();
    const frame = requestAnimationFrame(alignVerticalReadingStart);

    const observer = new ResizeObserver(alignVerticalReadingStart);
    observer.observe(scrollViewport);

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
  }, [sentenceCount, variant, verticalLayout]);

  useEffect(() => {
    const readingArea = readingAreaRef.current;
    const scrollViewport = viewportRef.current;
    if (!readingArea || !scrollViewport) {
      return;
    }

    function onWheel(event: WheelEvent) {
      if (!scrollViewport) {
        return;
      }

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
      <SiteChromeTrail>
        <Breadcrumbs items={breadcrumbs} />
      </SiteChromeTrail>
      <div ref={readingAreaRef} className="poem-reader__viewport">
        <div className="poem-reader__vertical-layout">
          <div ref={viewportRef} className="poem-reader__columns-viewport">
            <div
              className={cn(
                "poem-reader__columns",
                verticalLayout === VERTICAL_LAYOUT_LINE_PER_COLUMN
                  ? "poem-reader__columns--line-per-column"
                  : "poem-reader__columns--reflow",
              )}
            >
              <header className="poem-reader__masthead">
                <h1 className="poem-reader__title">
                  <VariantText
                    text={{
                      simplified: poem.title,
                      traditional: poem.titleTraditional,
                    }}
                  />
                </h1>
                <PoemAttribution
                  dynasty={{
                    simplified: poem.dynasty,
                    traditional: poem.dynastyTraditional,
                  }}
                  author={{
                    simplified: poem.author,
                    traditional: poem.authorTraditional,
                  }}
                  hideAuthor={poem.author === poem.title}
                />
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
                              verticalColumn
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
