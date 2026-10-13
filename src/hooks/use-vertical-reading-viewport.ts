"use client";

import { useEffect, type RefObject } from "react";
import {
  alignVerticalScrollToFirstColumn,
  applyVerticalReadingWheelDelta,
  hasVerticalReadingHorizontalOverflow,
  resolveNegativeVerticalScrollOrigin,
  shouldConsumeVerticalReadingWheel,
  verticalReadingScrollLeft,
} from "@/lib/vertical-layout";

type UseVerticalReadingViewportOptions = {
  readingAreaRef: RefObject<HTMLElement | null>;
  viewportRef: RefObject<HTMLElement | null>;
  negativeScrollOriginRef: RefObject<boolean>;
  /** 正文句数 / 简繁 / 版式变化时重新对齐起读列 */
  layoutKey: string | number;
};

/** 竖排阅读区：起读列对齐、负原点 sticky、滚轮映射为横向滚动。 */
export function useVerticalReadingViewport({
  readingAreaRef,
  viewportRef,
  negativeScrollOriginRef,
  layoutKey,
}: UseVerticalReadingViewportOptions) {
  useEffect(() => {
    const scrollViewport = viewportRef.current;
    if (!scrollViewport) {
      return;
    }

    let cancelled = false;
    let raf = 0;

    function noteScrollOrigin() {
      if (!scrollViewport) {
        return;
      }
      const maxScroll = Math.max(
        scrollViewport.scrollWidth - scrollViewport.clientWidth,
        0,
      );
      negativeScrollOriginRef.current = resolveNegativeVerticalScrollOrigin(
        scrollViewport.scrollLeft,
        maxScroll,
        negativeScrollOriginRef.current,
      );
    }

    let hashTargetHighlighted = false;

    /**
     * 检索命中句跳来时（`#line-N`）居中该句而非对齐起读列。
     * 软导航用 pushState 换 hash，`:target` 不生效，故另加类名播放高亮。
     */
    function centerHashTarget(): boolean {
      if (!scrollViewport) {
        return false;
      }
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash.startsWith("line-")) {
        return false;
      }
      const line = document.getElementById(hash);
      if (!line || !scrollViewport.contains(line)) {
        return false;
      }
      const lineRect = line.getBoundingClientRect();
      const viewportRect = scrollViewport.getBoundingClientRect();
      const delta =
        lineRect.left +
        lineRect.width / 2 -
        (viewportRect.left + viewportRect.width / 2);
      if (Math.abs(delta) >= 1) {
        scrollViewport.scrollLeft += delta;
      }
      noteScrollOrigin();
      if (!hashTargetHighlighted) {
        hashTargetHighlighted = true;
        line.classList.remove("poem-reader__hash-hit");
        void line.offsetWidth;
        line.classList.add("poem-reader__hash-hit");
        line.addEventListener(
          "animationend",
          () => line.classList.remove("poem-reader__hash-hit"),
          { once: true },
        );
      }
      return true;
    }

    function alignVerticalReadingStart() {
      if (!scrollViewport || cancelled) {
        return;
      }
      if (centerHashTarget()) {
        return;
      }
      const target = verticalReadingScrollLeft(
        scrollViewport.scrollWidth,
        scrollViewport.clientWidth,
      );
      const current = scrollViewport.scrollLeft;
      // Skip no-op scroll writes (font settle / ResizeObserver chatter during VT).
      if (Math.abs(current - target) < 1) {
        noteScrollOrigin();
        return;
      }
      if (target > 0 && Math.abs(current + target) < 1) {
        noteScrollOrigin();
        return;
      }
      alignVerticalScrollToFirstColumn(scrollViewport, target);
      noteScrollOrigin();
    }

    function scheduleAlign() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(alignVerticalReadingStart);
      });
    }

    negativeScrollOriginRef.current = false;
    alignVerticalReadingStart();
    scheduleAlign();

    const observer = new ResizeObserver(scheduleAlign);
    observer.observe(scrollViewport);

    void document.fonts.ready.then(() => {
      if (!cancelled) {
        scheduleAlign();
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [layoutKey, viewportRef, negativeScrollOriginRef]);

  useEffect(() => {
    const readingArea = readingAreaRef.current;
    const scrollViewport = viewportRef.current;
    if (!readingArea || !scrollViewport) {
      return;
    }
    const viewport = scrollViewport;

    function noteScrollOriginFromViewport() {
      const maxScroll = Math.max(viewport.scrollWidth - viewport.clientWidth, 0);
      negativeScrollOriginRef.current = resolveNegativeVerticalScrollOrigin(
        viewport.scrollLeft,
        maxScroll,
        negativeScrollOriginRef.current,
      );
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
          viewport.scrollWidth,
          viewport.clientWidth,
        )
      ) {
        return;
      }

      if (!shouldConsumeVerticalReadingWheel(event.deltaX, event.deltaY)) {
        return;
      }

      event.preventDefault();
      applyVerticalReadingWheelDelta(viewport, event.deltaY);
      noteScrollOriginFromViewport();
    }

    readingArea.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("scroll", noteScrollOriginFromViewport, {
      passive: true,
    });
    return () => {
      readingArea.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("scroll", noteScrollOriginFromViewport);
    };
  }, [layoutKey, readingAreaRef, viewportRef, negativeScrollOriginRef]);
}
