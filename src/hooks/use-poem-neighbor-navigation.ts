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

/** 横滑翻诗的最小水平位移（px）与水平占比；低于阈值视为点按或竖向手势。 */
const SWIPE_MIN_DISTANCE_PX = 64;
const SWIPE_MAX_SLOPE = 0.6;

/**
 * Prefetch 邻接诗页 + 方向键/横滑翻诗翻卷（含竖排横向滚到端点后再切）。
 * 方向与竖排一致：← 或手指向右滑 = 往后读（下一首），反之回上一首。
 */
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

        // 竖排列自右向左：← 与阅读同向，读完再按即进下一首；→ 回上一首。
        const target = event.key === "ArrowLeft" ? next : prev;
        if (target) {
          event.preventDefault();
          navigateWithPoemTransition(`/p/${target.slug}`, (href) => {
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

  // 触屏横滑：仅当手势开始时阅读区已在该方向端点（无可滚内容）才切诗，不与长诗横滚抢手势。
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    let start:
      | { x: number; y: number; atLeft: boolean; atRight: boolean }
      | null = null;

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1 || !viewport) {
        start = null;
        return;
      }
      const touch = event.touches[0]!;
      const { scrollLeft, scrollWidth, clientWidth } = viewport;
      start = {
        x: touch.clientX,
        y: touch.clientY,
        atLeft: isVerticalReadingAtHorizontalEdge(
          scrollLeft,
          scrollWidth,
          clientWidth,
          "left",
        ),
        atRight: isVerticalReadingAtHorizontalEdge(
          scrollLeft,
          scrollWidth,
          clientWidth,
          "right",
        ),
      };
    }

    function onTouchEnd(event: TouchEvent) {
      const origin = start;
      start = null;
      const touch = event.changedTouches[0];
      if (!origin || !touch || document.querySelector('[role="dialog"]')) {
        return;
      }
      const dx = touch.clientX - origin.x;
      const dy = touch.clientY - origin.y;
      if (
        Math.abs(dx) < SWIPE_MIN_DISTANCE_PX ||
        Math.abs(dy) > Math.abs(dx) * SWIPE_MAX_SLOPE
      ) {
        return;
      }

      const target =
        dx > 0 ? (origin.atLeft ? next : undefined) : origin.atRight ? prev : undefined;
      if (target) {
        navigateWithPoemTransition(`/p/${target.slug}`, (href) => {
          router.push(href);
        });
      }
    }

    function onTouchCancel() {
      start = null;
    }

    viewport.addEventListener("touchstart", onTouchStart, { passive: true });
    viewport.addEventListener("touchend", onTouchEnd, { passive: true });
    viewport.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      viewport.removeEventListener("touchstart", onTouchStart);
      viewport.removeEventListener("touchend", onTouchEnd);
      viewport.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [next, prev, router, viewportRef]);
}
