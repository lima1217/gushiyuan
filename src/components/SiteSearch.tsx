"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { filterSearchIndex } from "@/lib/search-filter";
import type { SearchIndex } from "@/lib/search-index-types";

type SiteSearchProps = {
  index: SearchIndex;
};

export function SiteSearch({ index }: SiteSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => filterSearchIndex(index, query),
    [index, query],
  );

  const hasResults =
    results.poems.length > 0 || results.authors.length > 0;

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
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
      setOpen((current) => !current);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        className="site-search__trigger"
        onClick={() => setOpen(true)}
        aria-label="打开检索"
      >
        <SearchIcon aria-hidden="true" className="size-3.5" />
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="站内检索"
        description="按诗题或作者检索"
        className="border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)] bg-[var(--color-paper)] text-[var(--color-ink)] sm:max-w-lg"
        showCloseButton
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="诗题、作者…"
            value={query}
            onValueChange={setQuery}
            className="text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
          />
          <CommandList className="max-h-80">
            {!hasResults ? (
              <CommandEmpty className="text-[var(--color-ink-muted)]">
                {query.trim() ? "未找到匹配" : "输入诗题或作者"}
              </CommandEmpty>
            ) : null}

            {results.poems.length > 0 ? (
              <CommandGroup heading="诗">
                {results.poems.map((poem) => (
                  <CommandItem
                    key={`poem-${poem.slug}`}
                    value={`${poem.title} ${poem.author}`}
                    onSelect={() => navigate(`/p/${poem.slug}`)}
                  >
                    <span>{poem.title}</span>
                    <span className="ml-auto text-xs text-[var(--color-ink-muted)]">
                      {poem.author}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {results.authors.length > 0 ? (
              <CommandGroup heading="作者">
                {results.authors.map((author) => (
                  <CommandItem
                    key={`author-${author.authorSlug}`}
                    value={author.name}
                    onSelect={() =>
                      navigate(`/v/${author.volume}/${author.authorSlug}`)
                    }
                  >
                    <span>{author.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
