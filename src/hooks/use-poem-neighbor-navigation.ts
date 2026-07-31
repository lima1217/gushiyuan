"use client";

import { useEffect, type RefObject } from "react";
import { useRouter } from "next/navigation";
import {
  applyVerticalReadingKeyboardScroll,
  hasVerticalReadingHorizontalOverflow,
  isVerticalReadingAtHorizontalEdge,
  resolveNegativeVerticalScrollOrigin,
  verticalReadingScrollBehavior,
} from "@/lib/vertical-layout";
import { navigateWithPoemTransition } from "@/lib/poem-view-transition";

type NeighborHref = { slug: string } | undefined;

type UsePoemNeighborNavigationOptions = {
  viewportRef: RefObject<HTMLElement | null>;
  negativeScrollOriginRef: RefObject<boolean>;
  prev: NeighborHref;
  next: NeighborHref;
  prevVolume: NeighborHref;
  nextVolume: NeighborHref;
};

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

/** Prefetch 邻接诗页 + 方向键翻诗/翻卷（含竖排横向滚到端点后再切）。 */
export function usePoemNeighborNavigation({
  viewportRef,
  negativeScrollOriginRef,
  prev,
  next,
  prevVolume,
  nextVolume,
}: UsePoemNeighborNavigationOptions) {
  const router = useRouter();

  useEffect(() => {
    for (const neighbor of [prev, next, prevVolume, nextVolume]) {
      if (neighbor) {
        router.prefetch(`/p/${neighbor.slug}`);
      }
    }
  }, [next, nextVolume, prev, prevVolume, router]);

  useEffect(() => {
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
        return;
      }

      // 左右：有横向未读内容时由 JS 主动滚阅读区；滚到该方向端点后再切诗。
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const viewport = viewportRef.current;
        if (viewport) {
          const { scrollLeft, scrollWidth, clientWidth } = viewport;
          const maxScroll = Math.max(scrollWidth - clientWidth, 0);
          negativeScrollOriginRef.current = resolveNegativeVerticalScrollOrigin(
            scrollLeft,
            maxScroll,
            negativeScrollOriginRef.current,
          );
          if (
            hasVerticalReadingHorizontalOverflow(scrollWidth, clientWidth) &&
            !isVerticalReadingAtHorizontalEdge(
              scrollLeft,
              scrollWidth,
              clientWidth,
              event.key === "ArrowLeft" ? "left" : "right",
            )
          ) {
            event.preventDefault();
            negativeScrollOriginRef.current =
              applyVerticalReadingKeyboardScroll(
                viewport,
                event.key,
                verticalReadingScrollBehavior(
                  window.matchMedia("(prefers-reduced-motion: reduce)")
                    .matches,
                ),
                negativeScrollOriginRef.current,
              );
            return;
          }
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
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    next,
    nextVolume,
    prev,
    prevVolume,
    router,
    viewportRef,
    negativeScrollOriginRef,
  ]);
}
