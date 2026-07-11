export function pickRandomPoemSlug(
  slugs: readonly string[],
  excludeSlug?: string | null,
): string | undefined {
  if (slugs.length === 0) {
    return undefined;
  }

  const candidates =
    excludeSlug === undefined || excludeSlug === null || excludeSlug === ""
      ? slugs
      : slugs.filter((slug) => slug !== excludeSlug);

  const pool = candidates.length > 0 ? candidates : slugs;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export function poemSlugFromPathname(pathname: string): string | null {
  const match = /^\/p\/([^/]+)\/?$/.exec(pathname);
  return match?.[1] ?? null;
}
