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

export type PoemVariant = {
  line: number;
  at?: string;
  note: string;
};

export type Poem = PoemMeta & {
  body: string;
  keyChars: string[];
  base?: string;
  variants: PoemVariant[];
};

const CONTENT_DIR = path.join(process.cwd(), "content");
const POEMS_DIR = path.join(CONTENT_DIR, "poems");
const VOLUMES_FILE = path.join(CONTENT_DIR, "volumes.json");

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

function parseKeyChars(data: Record<string, unknown>): string[] {
  const value = data.keyChars;
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBase(data: Record<string, unknown>): string | undefined {
  const value = data.base;
  if (value === undefined || value === null) {
    return undefined;
  }

  const base = String(value).trim();
  return base || undefined;
}

function parseVariants(data: Record<string, unknown>): PoemVariant[] {
  const value = data.variants;
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;
    const line = record.line;
    const note = record.note;

    if (typeof line !== "number" || line < 1 || !Number.isInteger(line)) {
      return [];
    }

    if (typeof note !== "string" || note.trim() === "") {
      return [];
    }

    const at =
      typeof record.at === "string" && record.at.trim()
        ? record.at.trim()
        : undefined;

    return [{ line, ...(at ? { at } : {}), note: note.trim() }];
  });
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
    keyChars: parseKeyChars(data),
    base: parseBase(data),
    variants: parseVariants(data),
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
  const seen = new Map<string, AuthorMeta>();

  for (const poem of getAllPoems()) {
    if (poem.volume !== volumeSlug) continue;
    if (!seen.has(poem.authorSlug)) {
      seen.set(poem.authorSlug, { slug: poem.authorSlug, name: poem.author });
    }
  }

  return [...seen.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "zh-CN"),
  );
}

export function getPoemsByAuthor(
  volumeSlug: string,
  authorSlug: string,
): PoemMeta[] {
  return getAllPoems()
    .filter((p) => p.volume === volumeSlug && p.authorSlug === authorSlug)
    .sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
}

export function getPoemsByKeyChar(char: string): PoemMeta[] {
  return getAllPoems()
    .filter((poem) => getPoemBySlug(poem.slug)?.keyChars.includes(char))
    .sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
}

export function getPoemsByVolume(volumeSlug: string): PoemMeta[] {
  const poems: PoemMeta[] = [];

  for (const author of getAuthorsByVolume(volumeSlug)) {
    poems.push(...getPoemsByAuthor(volumeSlug, author.slug));
  }

  return poems;
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
