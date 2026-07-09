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
} from "@/components/ui/command";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { filterSearchIndex } from "@/lib/search-filter";
import {
  SEARCH_INDEX_URL,
  type SearchIndex,
} from "@/lib/search-index-types";

type SiteSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

let searchIndexPromise: Promise<SearchIndex> | null = null;

function loadSearchIndex(): Promise<SearchIndex> {
  if (searchIndexPromise) {
    return searchIndexPromise;
  }

  searchIndexPromise = fetch(SEARCH_INDEX_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load search index (${response.status})`);
      }
      return response.json() as Promise<SearchIndex>;
    })
    .catch((error) => {
      searchIndexPromise = null;
      throw error;
    });

  return searchIndexPromise;
}

export function SiteSearchDialog({ open, onOpenChange }: SiteSearchDialogProps) {
  const router = useRouter();
  const searchTitle = useUiText("searchTitle");
  const searchDescription = useUiText("searchDescription");
  const searchPlaceholder = useUiText("searchPlaceholder");
  const searchNoMatch = useUiText("searchNoMatch");
  const searchLoadError = useUiText("searchLoadError");
  const searchPrompt = useUiText("searchPrompt");
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
      : searchPrompt;

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={searchTitle}
      description={searchDescription}
      className="border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)] bg-[var(--color-paper)] text-[var(--color-ink)] sm:max-w-lg"
    >
      <Command shouldFilter={false}>
        <CommandInput
          aria-label={searchTitle}
          name="site-search"
          autoComplete="off"
          placeholder={searchPlaceholder}
          value={query}
          onValueChange={setQuery}
          className="text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
        />
        <CommandList className="max-h-80">
          {!hasResults ? (
            <CommandEmpty className="text-[var(--color-ink-muted)]">
              {emptyMessage}
            </CommandEmpty>
          ) : null}

            {results.poems.length > 0 ? (
              <CommandGroup heading={searchPoemsHeading}>
                {results.poems.map((poem) => (
                  <CommandItem
                    key={`poem-${poem.slug}`}
                    value={`${poem.title} ${poem.titleTraditional} ${poem.author} ${poem.authorTraditional}`}
                    onSelect={() => navigate(`/p/${poem.slug}`)}
                  >
                    <span>
                      <VariantText
                        text={{
                          simplified: poem.title,
                          traditional: poem.titleTraditional,
                        }}
                      />
                    </span>
                    <span className="ml-auto text-xs text-[var(--color-ink-muted)]">
                      <VariantText
                        text={{
                          simplified: poem.author,
                          traditional: poem.authorTraditional,
                        }}
                      />
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {results.authors.length > 0 ? (
              <CommandGroup heading={searchAuthorsHeading}>
                {results.authors.map((author) => (
                  <CommandItem
                    key={`author-${author.authorSlug}`}
                    value={`${author.name} ${author.nameTraditional}`}
                    onSelect={() =>
                      navigate(`/v/${author.volume}/${author.authorSlug}`)
                    }
                  >
                    <span>
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
      </Command>
    </CommandDialog>
  );
}
