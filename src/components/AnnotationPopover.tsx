"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type AnnotationPopoverProps = {
  /** Visible content of the trigger button. */
  triggerLabel: React.ReactNode;
  /** Accessible label describing the trigger's action. */
  ariaLabel: string;
  /** Class for the trigger button. */
  triggerClassName?: string;
  /** id for the trigger button (e.g. anchor target `line-N`). */
  triggerId?: string;
  /** Class for the popover content panel. */
  contentClassName?: string;
  /** Distance from the trigger to the popover panel. */
  sideOffset?: number;
  /** Popover body. */
  children: React.ReactNode;
};

/**
 * 行内注解的点击型浮层。点击触发器打开、点击外部或 Esc 关闭，
 * 键盘可聚焦、触屏可用。竖排阅读中浮层固定从左侧弹出。
 *
 * 抽自字形演变的点击 Popover 模式，现为「源」等行内注解共用。
 */
export function AnnotationPopover({
  triggerLabel,
  ariaLabel,
  triggerClassName,
  triggerId,
  contentClassName,
  sideOffset = 8,
  children,
}: AnnotationPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        id={triggerId}
        className={triggerClassName}
        aria-label={ariaLabel}
      >
        {triggerLabel}
      </PopoverTrigger>
      <PopoverContent
        side="left"
        sideOffset={sideOffset}
        className={contentClassName}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
