"use client";

import type { ReactElement } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * 顶栏图标按钮的悬停提示：只随指针悬停出现，触屏不弹。
 * 不随聚焦打开：弹层关闭后焦点回到按钮，否则提示会一直挂着；读屏仍有 aria-label。
 */
export function ChromeTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) {
  return (
    <Tooltip
      onOpenChange={(open, details) => {
        if (open && details.reason === "trigger-focus") {
          details.cancel();
        }
      }}
    >
      <TooltipTrigger render={children} delay={400} />
      <TooltipContent side="bottom" sideOffset={6} className="tracking-[0.08em]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
