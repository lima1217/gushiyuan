import fs from "fs";
import path from "path";
import matter from "gray-matter";

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

export type Poem = PoemMeta & {
  body: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content");
const POEMS_DIR = path.join(CONTENT_DIR, "poems");
const VOLUMES_FILE = path.join(CONTENT_DIR, "volumes.json");
const VOLUME_MANIFEST_DIR = path.join(CONTENT_DIR, "volumes");

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

function parsePoemFile(slug: string): Poem {
  const filePath = path.join(POEMS_DIR, `${slug}.md`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: requireField(data, "title", slug),
    author: requireField(data, "author", slug),
    authorSlug: requireField(data, "authorSlug", slug),
    dynasty: requireField(data, "dynasty", slug),
    volume: requireField(data, "volume", slug),
    body: content.trim(),
  };
}

export function getAllPoems(): PoemMeta[] {
  const files = fs.readdirSync(POEMS_DIR).filter((f) => f.endsWith(".md"));

  return files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const { title, author, authorSlug, dynasty, volume } = parsePoemFile(slug);
      return { slug, title, author, authorSlug, dynasty, volume };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug, "zh-CN"));
}

export function getPoemBySlug(slug: string): Poem | undefined {
  const filePath = path.join(POEMS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  return parsePoemFile(slug);
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
  for (const poem of orderedPoems) {
    if (!seen.has(poem.authorSlug)) {
      seen.set(poem.authorSlug, { slug: poem.authorSlug, name: poem.author });
    }
  }

  return [...seen.values()];
}

export function getPoemsByAuthor(
  volumeSlug: string,
  authorSlug: string,
): PoemMeta[] {
  const manifest = getVolumeManifest(volumeSlug);
  const poems = getAllPoems().filter(
    (p) => p.volume === volumeSlug && p.authorSlug === authorSlug,
  );

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
