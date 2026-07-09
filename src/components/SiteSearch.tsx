"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchIcon } from "lucide-react";
import { useUiText } from "@/components/ScriptVariantProvider";

type SiteSearchDialogComponent = typeof import("@/components/SiteSearchDialog").SiteSearchDialog;

export function SiteSearch() {
  const openSearch = useUiText("searchOpen");
  const [open, setOpen] = useState(false);
  const [Dialog, setDialog] = useState<SiteSearchDialogComponent | null>(null);

  const preloadDialog = useCallback(() => {
    if (Dialog) {
      return;
    }

    void import("@/components/SiteSearchDialog").then((mod) => {
      setDialog(() => mod.SiteSearchDialog);
    });
  }, [Dialog]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k") {
        return;
      }

      if (!(event.metaKey || event.ctrlKey)) {
        return;
      }

      event.preventDefault();
      preloadDialog();
      setOpen((current) => !current);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [preloadDialog]);

  function handleOpen(nextOpen: boolean) {
    if (nextOpen) {
      preloadDialog();
    }
    setOpen(nextOpen);
  }

  return (
    <>
      <button
        type="button"
        className="site-chrome__control site-chrome__control--icon"
        onClick={() => handleOpen(true)}
        onMouseEnter={preloadDialog}
        onFocus={preloadDialog}
        aria-label={openSearch}
      >
        <SearchIcon aria-hidden="true" className="size-3.5" />
      </button>

      {Dialog && open ? (
        <Dialog open={open} onOpenChange={handleOpen} />
      ) : null}
    </>
  );
}
