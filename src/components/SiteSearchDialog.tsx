"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { VariantText } from "@/components/VariantText";
import { useUiText } from "@/components/ScriptVariantProvider";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { loadSearchIndex } from "@/lib/load-search-index";
import {
  searchDialogAnchorCss,
  type SearchDialogAnchorStyle,
} from "@/lib/search-dialog-anchor";
import { filterSearchIndex } from "@/lib/search-filter";
import type { SearchIndex } from "@/lib/search-index-types";
import { cn } from "@/lib/utils";

type SiteSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor?: SearchDialogAnchorStyle | null;
};

export function SiteSearchDialog({
  open,
  onOpenChange,
  anchor = null,
}: SiteSearchDialogProps) {
  const router = useRouter();
  const searchTitle = useUiText("searchTitle");
  const searchDescription = useUiText("searchDescription");
  const searchPlaceholder = useUiText("searchPlaceholder");
  const searchNoMatch = useUiText("searchNoMatch");
  const searchLoadError = useUiText("searchLoadError");
  const searchPoemsHeading = useUiText("searchPoemsHeading");
  const searchAuthorsHeading = useUiText("searchAuthorsHeading");
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 150);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setLoadError(false);
        setQuery("");
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!open || index || loadError) {
      return;
    }

    let cancelled = false;

    loadSearchIndex()
      .then((loadedIndex) => {
        if (!cancelled) {
          setIndex(loadedIndex);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, index, loadError]);

  const results = useMemo(() => {
    if (!index) {
      return { poems: [], authors: [] };
    }
    return filterSearchIndex(index, debouncedQuery);
  }, [index, debouncedQuery]);

  const hasResults =
    results.poems.length > 0 || results.authors.length > 0;

  const navigate = useCallback(
    (href: string) => {
      handleOpenChange(false);
      router.push(href);
    },
    [handleOpenChange, router],
  );

  const emptyMessage = loadError
    ? searchLoadError
    : debouncedQuery.trim()
      ? searchNoMatch
      : null;

  const showList = hasResults || Boolean(emptyMessage);

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={searchTitle}
      description={searchDescription}
      className={cn(
        "w-[min(100%,26rem)] gap-0 overflow-hidden rounded-xl border-0 bg-[var(--color-paper)] p-0 text-[var(--color-ink)] shadow-[0_24px_56px_-18px_color-mix(in_srgb,var(--color-ink)_30%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--color-ink)_14%,transparent)] sm:max-w-md",
        anchor?.className,
      )}
      contentStyle={searchDialogAnchorCss(anchor?.style)}
    >
      <Command
        shouldFilter={false}
        disablePointerSelection
        className="rounded-none bg-transparent p-0 text-[var(--color-ink)]"
      >
        <CommandInput
          aria-label={searchTitle}
          name="site-search"
          autoComplete="off"
          placeholder={searchPlaceholder}
          value={query}
          onValueChange={setQuery}
          className="text-center text-[1.05rem] tracking-[0.02em] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] md:text-[1.05rem]"
        />

        {showList ? (
          <>
            <div
              aria-hidden="true"
              className="mx-3 h-px bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]"
            />
            <CommandList className="max-h-[min(20rem,calc(100dvh-11rem))] touch-pan-y overscroll-contain px-1.5 py-1.5">
            {!hasResults && emptyMessage ? (
              <CommandEmpty className="py-8 text-[var(--color-ink-muted)]">
                {emptyMessage}
              </CommandEmpty>
            ) : null}

            {results.poems.length > 0 ? (
              <CommandGroup
                heading={searchPoemsHeading}
                className="**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:text-[0.7rem] **:[[cmdk-group-heading]]:font-normal **:[[cmdk-group-heading]]:tracking-[0.18em] **:[[cmdk-group-heading]]:text-[var(--color-ink-muted)]"
              >
                {results.poems.map((poem) => (
                  <CommandItem
                    key={`poem-${poem.slug}`}
                    value={`${poem.title} ${poem.titleTraditional} ${poem.author} ${poem.authorTraditional} ${poem.body} ${poem.bodyTraditional}`}
                    onSelect={() => navigate(`/p/${poem.slug}`)}
                    className="min-h-10 gap-3 rounded-lg px-3 py-2 data-selected:bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)] data-selected:text-[var(--color-ink)] [&>svg:last-child]:hidden"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[0.95rem] tracking-[0.02em]">
                        <VariantText
                          text={{
                            simplified: poem.title,
                            traditional: poem.titleTraditional,
                          }}
                        />
                      </span>
                      {poem.matchedLine ? (
                        <span className="truncate text-xs tracking-[0.04em] text-[var(--color-ink-muted)]">
                          <VariantText text={poem.matchedLine} />
                        </span>
                      ) : null}
                    </span>
                    {poem.author === poem.title ? null : (
                      <span className="ml-auto shrink-0 self-center text-xs tracking-[0.06em] text-[var(--color-ink-muted)]">
                        <VariantText
                          text={{
                            simplified: poem.author,
                            traditional: poem.authorTraditional,
                          }}
                        />
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {results.poems.length > 0 && results.authors.length > 0 ? (
              <CommandSeparator className="my-1.5 bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]" />
            ) : null}

            {results.authors.length > 0 ? (
              <CommandGroup
                heading={searchAuthorsHeading}
                className="**:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:text-[0.7rem] **:[[cmdk-group-heading]]:font-normal **:[[cmdk-group-heading]]:tracking-[0.18em] **:[[cmdk-group-heading]]:text-[var(--color-ink-muted)]"
              >
                {results.authors.map((author) => (
                  <CommandItem
                    key={`author-${author.authorSlug}`}
                    value={`${author.name} ${author.nameTraditional}`}
                    onSelect={() =>
                      navigate(`/v/${author.volume}/${author.authorSlug}`)
                    }
                    className="min-h-10 rounded-lg px-3 py-2 data-selected:bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)] data-selected:text-[var(--color-ink)] [&>svg:last-child]:hidden"
                  >
                    <span className="tracking-[0.02em]">
                      <VariantText
                        text={{
                          simplified: author.name,
                          traditional: author.nameTraditional,
                        }}
                      />
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
          </>
        ) : null}
      </Command>
    </CommandDialog>
  );
}
