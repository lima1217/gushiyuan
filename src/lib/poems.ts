import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { parsePoemBody, type PoemBodyStructure } from "./poem-body";
import {
  parseVerticalLayoutOverride,
  type VerticalLayoutOverride,
} from "./vertical-layout";

export type { PoemBodyStructure };
export { parsePoemBody };

export type Volume = {
  slug: string;
  name: string;
};

export type PoemMeta = {
  slug: string;
  title: string;
  author: string;
  authorSlug: string;
  dynasty: string;
  volume: string;
};

export type AuthorMeta = {
  slug: string;
  name: string;
};

export const ANONYMOUS_AUTHOR_NAME = "佚名";
export const ANONYMOUS_AUTHOR_SLUG = "yi-ming";

export function isAnonymousAuthor(author: string): boolean {
  return author === ANONYMOUS_AUTHOR_NAME;
}

export function getCatalogAuthorSlug(
  poem: Pick<PoemMeta, "author" | "authorSlug">,
): string {
  return isAnonymousAuthor(poem.author)
    ? ANONYMOUS_AUTHOR_SLUG
    : poem.authorSlug;
}

export function isLegacyAnonymousAuthorSlug(authorSlug: string): boolean {
  return authorSlug.startsWith(`${ANONYMOUS_AUTHOR_SLUG}-`);
}

export type Poem = PoemMeta & {
  body: string;
  verticalLayout?: VerticalLayoutOverride;
};

const CONTENT_DIR = path.join(process.cwd(), "content");
const POEMS_DIR = path.join(CONTENT_DIR, "poems");
const VOLUMES_FILE = path.join(CONTENT_DIR, "volumes.json");
const VOLUME_MANIFEST_DIR = path.join(CONTENT_DIR, "volumes");

type PoemFileData = PoemMeta & {
  body: string;
  verticalLayout?: VerticalLayoutOverride;
};

const poemCacheEnabled = process.env.NODE_ENV === "production";

let cachedAllPoems: PoemMeta[] | null = null;
const poemFileCache = new Map<string, PoemFileData>();

function getVolumeManifest(volumeSlug: string): string[] | undefined {
  const manifestPath = path.join(
    VOLUME_MANIFEST_DIR,
    `${volumeSlug}-manifest.json`,
  );
  if (!fs.existsSync(manifestPath)) {
    return undefined;
  }
  const raw = fs.readFileSync(manifestPath, "utf-8");
  return JSON.parse(raw) as string[];
}

function sortByManifestOrder<T extends { slug: string }>(
  items: T[],
  manifest: string[],
): T[] {
  const order = new Map(manifest.map((slug, index) => [slug, index]));
  return [...items].sort(
    (a, b) =>
      (order.get(a.slug) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(b.slug) ?? Number.MAX_SAFE_INTEGER),
  );
}

function requireField(
  data: Record<string, unknown>,
  key: string,
  slug: string,
): string {
  const value = data[key];
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(
      `Poem "${slug}" is missing required frontmatter field "${key}"`,
    );
  }
  return String(value);
}

function loadPoemFile(slug: string): PoemFileData | undefined {
  if (poemCacheEnabled) {
    const cached = poemFileCache.get(slug);
    if (cached) {
      return cached;
    }
  }

  const filePath = path.join(POEMS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const poem: PoemFileData = {
    slug,
    title: requireField(data, "title", slug),
    author: requireField(data, "author", slug),
    authorSlug: requireField(data, "authorSlug", slug),
    dynasty: requireField(data, "dynasty", slug),
    volume: requireField(data, "volume", slug),
    verticalLayout: parseVerticalLayoutOverride(data.verticalLayout),
    body: content.trim(),
  };

  if (poemCacheEnabled) {
    poemFileCache.set(slug, poem);
  }
  return poem;
}

function toPoemMeta(poem: PoemFileData): PoemMeta {
  return {
    slug: poem.slug,
    title: poem.title,
    author: poem.author,
    authorSlug: poem.authorSlug,
    dynasty: poem.dynasty,
    volume: poem.volume,
  };
}

function toPoem(poem: PoemFileData): Poem {
  return {
    slug: poem.slug,
    title: poem.title,
    author: poem.author,
    authorSlug: poem.authorSlug,
    dynasty: poem.dynasty,
    volume: poem.volume,
    body: poem.body,
    verticalLayout: poem.verticalLayout,
  };
}

export function getAllPoems(): PoemMeta[] {
  if (poemCacheEnabled && cachedAllPoems) {
    return cachedAllPoems;
  }

  const files = fs.readdirSync(POEMS_DIR).filter((f) => f.endsWith(".md"));

  const poems = files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const poem = loadPoemFile(slug);
      if (!poem) {
        throw new Error(`Poem file "${slug}" disappeared during indexing`);
      }
      return toPoemMeta(poem);
    })
    .sort((a, b) => a.slug.localeCompare(b.slug, "zh-CN"));

  if (poemCacheEnabled) {
    cachedAllPoems = poems;
  }

  return poems;
}

export function getPoemBySlug(slug: string): Poem | undefined {
  const poem = loadPoemFile(slug);
  return poem ? toPoem(poem) : undefined;
}

export function getAllVolumes(): Volume[] {
  const raw = fs.readFileSync(VOLUMES_FILE, "utf-8");
  return JSON.parse(raw) as Volume[];
}

export function getVolumeBySlug(slug: string): Volume | undefined {
  return getAllVolumes().find((v) => v.slug === slug);
}

export function getAuthorsByVolume(volumeSlug: string): AuthorMeta[] {
  const manifest = getVolumeManifest(volumeSlug);
  const volumePoems = getAllPoems().filter((p) => p.volume === volumeSlug);
  const orderedPoems = manifest
    ? sortByManifestOrder(volumePoems, manifest)
    : volumePoems.sort((a, b) => {
        const byAuthor = a.author.localeCompare(b.author, "zh-CN");
        return byAuthor !== 0
          ? byAuthor
          : a.title.localeCompare(b.title, "zh-CN");
      });

  const seen = new Map<string, AuthorMeta>();
  let anonymousAdded = false;

  for (const poem of orderedPoems) {
    if (isAnonymousAuthor(poem.author)) {
      if (!anonymousAdded) {
        seen.set(ANONYMOUS_AUTHOR_SLUG, {
          slug: ANONYMOUS_AUTHOR_SLUG,
          name: ANONYMOUS_AUTHOR_NAME,
        });
        anonymousAdded = true;
      }
      continue;
    }

    if (!seen.has(poem.authorSlug)) {
      seen.set(poem.authorSlug, { slug: poem.authorSlug, name: poem.author });
    }
  }

  return [...seen.values()];
}

export function getAuthorInVolume(
  volumeSlug: string,
  authorSlug: string,
): AuthorMeta | undefined {
  if (
    authorSlug === ANONYMOUS_AUTHOR_SLUG ||
    isLegacyAnonymousAuthorSlug(authorSlug)
  ) {
    const hasAnonymous = getAllPoems().some(
      (p) => p.volume === volumeSlug && isAnonymousAuthor(p.author),
    );
    return hasAnonymous
      ? { slug: ANONYMOUS_AUTHOR_SLUG, name: ANONYMOUS_AUTHOR_NAME }
      : undefined;
  }

  return getAuthorsByVolume(volumeSlug).find((a) => a.slug === authorSlug);
}

export function getAuthorPageParams(): {
  volumeSlug: string;
  authorSlug: string;
}[] {
  const params: { volumeSlug: string; authorSlug: string }[] = [];
  const seen = new Set<string>();

  for (const volume of getAllVolumes()) {
    for (const author of getAuthorsByVolume(volume.slug)) {
      const key = `${volume.slug}/${author.slug}`;
      seen.add(key);
      params.push({ volumeSlug: volume.slug, authorSlug: author.slug });
    }

    for (const poem of getAllPoems()) {
      if (
        poem.volume !== volume.slug ||
        !isAnonymousAuthor(poem.author) ||
        !isLegacyAnonymousAuthorSlug(poem.authorSlug)
      ) {
        continue;
      }

      const key = `${volume.slug}/${poem.authorSlug}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      params.push({ volumeSlug: volume.slug, authorSlug: poem.authorSlug });
    }
  }

  return params;
}

export function getPoemsByAuthor(
  volumeSlug: string,
  authorSlug: string,
): PoemMeta[] {
  const manifest = getVolumeManifest(volumeSlug);
  const poems = getAllPoems().filter((p) => {
    if (p.volume !== volumeSlug) {
      return false;
    }

    if (
      authorSlug === ANONYMOUS_AUTHOR_SLUG ||
      isLegacyAnonymousAuthorSlug(authorSlug)
    ) {
      return isAnonymousAuthor(p.author);
    }

    return p.authorSlug === authorSlug;
  });

  if (manifest) {
    return sortByManifestOrder(poems, manifest);
  }

  return poems.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
}

export function getPoemsByVolume(volumeSlug: string): PoemMeta[] {
  const manifest = getVolumeManifest(volumeSlug);
  const poems = getAllPoems().filter((p) => p.volume === volumeSlug);

  if (manifest) {
    return sortByManifestOrder(poems, manifest);
  }

  const result: PoemMeta[] = [];
  for (const author of getAuthorsByVolume(volumeSlug)) {
    result.push(...getPoemsByAuthor(volumeSlug, author.slug));
  }
  return result;
}

export function getAdjacentPoemsInVolume(slug: string): {
  prev?: PoemMeta;
  next?: PoemMeta;
} {
  const poem = getPoemBySlug(slug);
  if (!poem) {
    return {};
  }

  const volumePoems = getPoemsByVolume(poem.volume);
  const index = volumePoems.findIndex((item) => item.slug === slug);
  if (index === -1) {
    return {};
  }

  return {
    prev: index > 0 ? volumePoems[index - 1] : undefined,
    next: index < volumePoems.length - 1 ? volumePoems[index + 1] : undefined,
  };
}

export function isVolumeEmpty(volumeSlug: string): boolean {
  return getAuthorsByVolume(volumeSlug).length === 0;
}
