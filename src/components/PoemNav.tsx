"use client";

import Link from "next/link";
import { VariantText } from "@/components/VariantText";
import { useUiText } from "@/components/ScriptVariantProvider";
import type { PoemMeta } from "@/lib/poems";

type PoemNavMeta = PoemMeta & {
  titleTraditional?: string;
  crossVolume?: boolean;
};

type PoemNavProps = {
  prev?: PoemNavMeta;
  next?: PoemNavMeta;
};

function PoemNavTitle({ poem }: { poem: PoemNavMeta }) {
  return (
    <VariantText
      text={{
        simplified: poem.title,
        traditional: poem.titleTraditional ?? poem.title,
      }}
    />
  );
}

export function PoemNav({ prev, next }: PoemNavProps) {
  const ariaLabel = useUiText("poemNavAria");
  const prevPoemLabel = useUiText("prevPoem");
  const nextPoemLabel = useUiText("nextPoem");
  const prevVolumeLabel = useUiText("prevVolume");
  const nextVolumeLabel = useUiText("nextVolume");

  if (!prev && !next) {
    return null;
  }

  const prevLabel = prev?.crossVolume ? prevVolumeLabel : prevPoemLabel;
  const nextLabel = next?.crossVolume ? nextVolumeLabel : nextPoemLabel;

  return (
    <nav aria-label={ariaLabel} className="poem-nav">
      {prev ? (
        <Link href={`/p/${prev.slug}`} className="poem-nav__link poem-nav__link--prev">
          <span className="poem-nav__label">{prevLabel}</span>
          <span className="poem-nav__title">
            <PoemNavTitle poem={prev} />
          </span>
        </Link>
      ) : (
        <span className="poem-nav__spacer" />
      )}
      {next ? (
        <Link href={`/p/${next.slug}`} className="poem-nav__link poem-nav__link--next">
          <span className="poem-nav__label">{nextLabel}</span>
          <span className="poem-nav__title">
            <PoemNavTitle poem={next} />
          </span>
        </Link>
      ) : (
        <span className="poem-nav__spacer" />
      )}
    </nav>
  );
}
