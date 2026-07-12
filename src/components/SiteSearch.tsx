"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SearchIcon } from "lucide-react";
import { useUiText } from "@/components/ScriptVariantProvider";
import {
  computeSearchDialogAnchor,
  type SearchDialogAnchorStyle,
} from "@/lib/search-dialog-anchor";

type SiteSearchDialogComponent = typeof import("@/components/SiteSearchDialog").SiteSearchDialog;

export function SiteSearch() {
  const openSearch = useUiText("searchOpen");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<SearchDialogAnchorStyle | null>(null);
  const [Dialog, setDialog] = useState<SiteSearchDialogComponent | null>(null);

  const preloadDialog = useCallback(() => {
    if (Dialog) {
      return;
    }

    void import("@/components/SiteSearchDialog").then((mod) => {
      setDialog(() => mod.SiteSearchDialog);
    });
  }, [Dialog]);

  const measureAnchor = useCallback(() => {
    setAnchor(computeSearchDialogAnchor(triggerRef.current));
  }, []);

  const handleOpen = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        preloadDialog();
        setAnchor(computeSearchDialogAnchor(triggerRef.current));
      } else {
        setAnchor(null);
      }
      setOpen(nextOpen);
    },
    [preloadDialog],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k") {
        return;
      }

      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }

      event.preventDefault();
      handleOpen(!open);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleOpen, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    window.addEventListener("resize", measureAnchor);
    window.addEventListener("scroll", measureAnchor, true);
    return () => {
      window.removeEventListener("resize", measureAnchor);
      window.removeEventListener("scroll", measureAnchor, true);
    };
  }, [open, measureAnchor]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="site-chrome__control site-chrome__control--icon"
        onClick={() => handleOpen(true)}
        onMouseEnter={preloadDialog}
        onFocus={preloadDialog}
        aria-label={openSearch}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <SearchIcon aria-hidden="true" className="size-3.5" />
      </button>

      {Dialog && open ? (
        <Dialog
          open={open}
          onOpenChange={handleOpen}
          anchor={anchor}
        />
      ) : null}
    </>
  );
}
