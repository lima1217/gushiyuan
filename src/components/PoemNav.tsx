"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VariantText } from "@/components/VariantText";
import {
  useUiText,
  useVariantText,
} from "@/components/ScriptVariantProvider";
import type { PoemMetaWithTraditional } from "@/lib/script-conversion";
import {
  isPlainPrimaryClick,
  navigateWithPoemTransition,
  shouldUsePoemViewTransition,
} from "@/lib/poem-view-transition";

type PoemNavMeta = PoemMetaWithTraditional & {
  crossVolume?: boolean;
};

type PoemNavProps = {
  prev?: PoemNavMeta;
  next?: PoemNavMeta;
};

function PoemNavTitle({ poem }: { poem: PoemNavMeta }) {
  const title = useVariantText({
    simplified: poem.title,
    traditional: poem.titleTraditional,
  });

  return (
    <span title={title}>
      <VariantText
        text={{
          simplified: poem.title,
          traditional: poem.titleTraditional,
        }}
      />
    </span>
  );
}

function PoemNavLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        if (!isPlainPrimaryClick(event) || !shouldUsePoemViewTransition()) {
          return;
        }
        event.preventDefault();
        navigateWithPoemTransition(href, (nextHref) => {
          router.push(nextHref);
        });
      }}
    >
      {children}
    </Link>
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
        <PoemNavLink
          href={`/p/${prev.slug}`}
          className="poem-nav__link poem-nav__link--prev"
        >
          <span className="poem-nav__label">{prevLabel}</span>
          <span className="poem-nav__title">
            <PoemNavTitle poem={prev} />
          </span>
        </PoemNavLink>
      ) : (
        <span className="poem-nav__spacer" />
      )}
      {next ? (
        <PoemNavLink
          href={`/p/${next.slug}`}
          className="poem-nav__link poem-nav__link--next"
        >
          <span className="poem-nav__label">{nextLabel}</span>
          <span className="poem-nav__title">
            <PoemNavTitle poem={next} />
          </span>
        </PoemNavLink>
      ) : (
        <span className="poem-nav__spacer" />
      )}
    </nav>
  );
}
