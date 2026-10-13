"use client";

import { useEffect, useMemo, useRef } from "react";
import type { BreadcrumbItem } from "@/components/Breadcrumbs";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PoemNav } from "@/components/PoemNav";
import { SiteChromeTrail } from "@/components/SiteChromeTrail";
import { VariantText } from "@/components/VariantText";
import { PoemSentence } from "@/components/PoemSentence";
import {
  useScriptVariant,
  useUiText,
  useVariantText,
} from "@/components/ScriptVariantProvider";
import { usePoemNeighborNavigation } from "@/hooks/use-poem-neighbor-navigation";
import { useVerticalReadingViewport } from "@/hooks/use-vertical-reading-viewport";
import type {
  LineageByLineWithTraditional,
  PoemMetaWithTraditional,
  PoemWithTraditional,
} from "@/lib/script-conversion";
import { parsePoemBody } from "@/lib/poem-body";
import { shouldHidePoemAuthor } from "@/lib/poem-display";
import {
  VERTICAL_LAYOUT_LINE_PER_COLUMN,
  chapterSentenceOffsets,
  prepareVerticalDisplayChapters,
  resolveVerticalLayout,
} from "@/lib/vertical-layout";
import { cn } from "@/lib/utils";
import type { VariantableText } from "@/lib/script-variant";
import { notifyPoemNavigationPainted } from "@/lib/poem-view-transition";
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
  const { variant } = useScriptVariant();
  const poemBodyAria = useUiText("poemBodyAria");
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
  const layoutKey = `${sentenceCount}:${variant}:${verticalLayout}`;

  const readingAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  /** 负原点 sticky：读完端 scrollLeft≈0 时瞬时值无法区分，沿用曾观察到的负向信号。 */
  const negativeScrollOriginRef = useRef(false);

  usePoemNeighborNavigation({
    viewportRef,
    negativeScrollOriginRef,
    prev,
    next,
    prevVolume,
    nextVolume,
  });

  useVerticalReadingViewport({
    readingAreaRef,
    viewportRef,
    negativeScrollOriginRef,
    layoutKey,
  });

  useEffect(() => {
    notifyPoemNavigationPainted();
  }, [poem.slug]);

  useEffect(() => schedulePreloadRemainingWenkaiSubsets(), []);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="poem-reader relative flex flex-col"
    >
      <SiteChromeTrail>
        <Breadcrumbs items={breadcrumbs} />
      </SiteChromeTrail>
      <div ref={readingAreaRef} className="poem-reader__viewport">
        <div className="poem-reader__vertical-layout">
          <div
            ref={viewportRef}
            className="poem-reader__columns-viewport"
            tabIndex={0}
            role="region"
            aria-label={poemBodyAria}
          >
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
                  hideAuthor={shouldHidePoemAuthor(poem)}
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
                            <PoemSentence
                              sentence={line}
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
          <div className="poem-reader__progress" aria-hidden="true">
            <div className="poem-reader__progress-bar" />
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
