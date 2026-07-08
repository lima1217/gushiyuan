"use client";

import Link from "next/link";
import { AnnotationPopover } from "@/components/AnnotationPopover";
import type { LineageClue } from "@/lib/lineage-types";

type LineageHintProps = {
  clue: LineageClue;
  lineIndex: number;
  children: React.ReactNode;
};

function streamHref(stream: LineageClue["streams"][number]): string {
  if (stream.poemSlug !== undefined && stream.lineIndex !== undefined) {
    return `/p/${stream.poemSlug}#line-${stream.lineIndex}`;
  }

  return `/l/${stream.id}`;
}

export function LineageHint({ clue, lineIndex, children }: LineageHintProps) {
  return (
    <AnnotationPopover
      triggerId={`line-${lineIndex}`}
      ariaLabel="查看此句的源流线索"
      triggerLabel={
        <span className="poem-reader__line-inner">
          {children}
          <span className="poem-reader__lineage-mark" aria-hidden="true">
            源
          </span>
        </span>
      }
      triggerClassName="poem-reader__line poem-reader__line--lineage"
      contentClassName="lineage-hint__content w-72 max-w-[min(18rem,calc(100vw-2rem))] flex-col items-stretch gap-2 rounded-lg border border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)] bg-[var(--color-paper)] px-3 py-2.5 text-[var(--color-ink)] shadow-md ring-0"
      sideOffset={10}
    >
      <p className="lineage-hint__label">后世化用</p>
      <ul className="lineage-hint__list">
        {clue.streams.map((stream) => (
          <li key={stream.id} className="lineage-hint__item">
            <Link href={streamHref(stream)} className="lineage-hint__link">
              <span className="lineage-hint__relation">{stream.relation}</span>
              <span className="lineage-hint__text">{stream.text}</span>
              <span className="lineage-hint__meta">
                {stream.author}
                {stream.work ? ` · ${stream.work}` : ""}
              </span>
              <span className="lineage-hint__source">{stream.source}</span>
            </Link>
          </li>
        ))}
      </ul>
    </AnnotationPopover>
  );
}
