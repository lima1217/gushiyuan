"use client";

import Link from "next/link";
import { AnnotationPopover } from "@/components/AnnotationPopover";
import { VariantText } from "@/components/VariantText";
import { useUiText } from "@/components/ScriptVariantProvider";
import type { LineageClue } from "@/lib/lineage-types";
import type { LineageClueWithTraditional } from "@/lib/script-conversion";

type LineageHintProps = {
  clue: LineageClueWithTraditional;
  lineIndex: number;
  children: React.ReactNode;
  inline?: boolean;
};

function streamHref(stream: LineageClue["streams"][number]): string {
  if (stream.poemSlug !== undefined && stream.lineIndex !== undefined) {
    return `/p/${stream.poemSlug}#line-${stream.lineIndex}`;
  }

  return `/l/${stream.id}`;
}

export function LineageHint({
  clue,
  lineIndex,
  children,
  inline = false,
}: LineageHintProps) {
  const ariaLabel = useUiText("lineageAria");
  const mark = useUiText("lineageMark");
  const label = useUiText("lineageLabel");

  return (
    <AnnotationPopover
      triggerId={`line-${lineIndex}`}
      ariaLabel={ariaLabel}
      triggerLabel={
        <span className="poem-reader__line-inner">
          {children}
          <span className="poem-reader__lineage-mark" aria-hidden="true">
            {mark}
          </span>
        </span>
      }
      triggerClassName={
        inline
          ? "poem-reader__sentence poem-reader__sentence--lineage"
          : "poem-reader__line poem-reader__line--lineage"
      }
      contentClassName="lineage-hint__content w-72 max-w-[min(18rem,calc(100vw-2rem))] flex-col items-stretch gap-2 rounded-lg bg-paper px-3 py-2.5 text-ink shadow-overlay"
      sideOffset={10}
    >
      <p className="lineage-hint__label">{label}</p>
      <ul className="lineage-hint__list">
        {clue.streams.map((stream) => (
          <li key={stream.id} className="lineage-hint__item">
            <Link href={streamHref(stream)} className="lineage-hint__link">
              <span className="lineage-hint__relation">
                <VariantText
                  text={{
                    simplified: stream.relation,
                    traditional: stream.relationTraditional,
                  }}
                />
              </span>
              <span className="lineage-hint__text">
                <VariantText
                  text={{
                    simplified: stream.text,
                    traditional: stream.textTraditional,
                  }}
                />
              </span>
              <span className="lineage-hint__meta">
                <VariantText
                  text={{
                    simplified: stream.author,
                    traditional: stream.authorTraditional,
                  }}
                />
                {stream.work ? (
                  <>
                    {" · "}
                    <VariantText
                      text={{
                        simplified: stream.work,
                        traditional: stream.workTraditional ?? stream.work,
                      }}
                    />
                  </>
                ) : null}
              </span>
              <span className="lineage-hint__source">
                <VariantText
                  text={{
                    simplified: stream.source,
                    traditional: stream.sourceTraditional,
                  }}
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </AnnotationPopover>
  );
}
