"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import {
  useScriptVariant,
  useUiText,
} from "@/components/ScriptVariantProvider";
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
import { textForScriptVariant } from "@/lib/script-variant";

type SiteSearchProps = {
  index: SearchIndex;
};

export function SiteSearch({ index }: SiteSearchProps) {
  const router = useRouter();
  const { variant } = useScriptVariant();
  const openSearch = useUiText("searchOpen");
  const searchTitle = useUiText("searchTitle");
  const searchDescription = useUiText("searchDescription");
  const searchPlaceholder = useUiText("searchPlaceholder");
  const searchNoMatch = useUiText("searchNoMatch");
  const searchPrompt = useUiText("searchPrompt");
  const searchPoemsHeading = useUiText("searchPoemsHeading");
  const searchAuthorsHeading = useUiText("searchAuthorsHeading");
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
        className="site-chrome__control site-chrome__control--icon"
        onClick={() => setOpen(true)}
        aria-label={openSearch}
      >
        <SearchIcon aria-hidden="true" className="size-3.5" />
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={searchTitle}
        description={searchDescription}
        className="border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)] bg-[var(--color-paper)] text-[var(--color-ink)] sm:max-w-lg"
        showCloseButton
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
            className="text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
          />
          <CommandList className="max-h-80">
            {!hasResults ? (
              <CommandEmpty className="text-[var(--color-ink-muted)]">
                {query.trim() ? searchNoMatch : searchPrompt}
              </CommandEmpty>
            ) : null}

            {results.poems.length > 0 ? (
              <CommandGroup heading={searchPoemsHeading}>
                {results.poems.map((poem) => {
                  const title = textForScriptVariant(
                    {
                      simplified: poem.title,
                      traditional: poem.titleTraditional,
                    },
                    variant,
                  );
                  const author = textForScriptVariant(
                    {
                      simplified: poem.author,
                      traditional: poem.authorTraditional,
                    },
                    variant,
                  );

                  return (
                    <CommandItem
                      key={`poem-${poem.slug}`}
                      value={`${poem.title} ${poem.titleTraditional} ${poem.author} ${poem.authorTraditional}`}
                      onSelect={() => navigate(`/p/${poem.slug}`)}
                    >
                      <span>{title}</span>
                      <span className="ml-auto text-xs text-[var(--color-ink-muted)]">
                        {author}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}

            {results.authors.length > 0 ? (
              <CommandGroup heading={searchAuthorsHeading}>
                {results.authors.map((author) => {
                  const name = textForScriptVariant(
                    {
                      simplified: author.name,
                      traditional: author.nameTraditional,
                    },
                    variant,
                  );

                  return (
                    <CommandItem
                      key={`author-${author.authorSlug}`}
                      value={`${author.name} ${author.nameTraditional}`}
                      onSelect={() =>
                        navigate(`/v/${author.volume}/${author.authorSlug}`)
                      }
                    >
                      <span>{name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
