import { isAnonymousAuthor, type Poem } from "@/lib/poems";
import { shouldHidePoemAuthor } from "@/lib/poem-display";
import { SITE_NAME, SITE_URL } from "@/lib/site-identity";

/**
 * frontmatter 的 author 是目录归类，不全是人名（「尧时民歌」「古诗十九首」「乐府歌辞」「国语」等）。
 * 这类归类不标成 schema.org Person。
 */
const NON_PERSON_AUTHOR = /(歌|谣|谚|辞|诗|首|作|国语|家语|月令|无名氏)$/;

export function isPersonAuthor(poem: Pick<Poem, "author" | "title">): boolean {
  return (
    !shouldHidePoemAuthor(poem) &&
    !isAnonymousAuthor(poem.author) &&
    !NON_PERSON_AUTHOR.test(poem.author)
  );
}

export function poemPagePath(slug: string): string {
  return `/p/${slug}`;
}

/** 诗页 JSON-LD：schema.org 无 Poem 类型，用 CreativeWork + genre，并挂到《古诗源》选本下。 */
export function buildPoemStructuredData(poem: Poem): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    genre: "诗",
    name: poem.title,
    ...(isPersonAuthor(poem) ? { author: { "@type": "Person", name: poem.author } } : {}),
    inLanguage: "zh-Hans",
    text: poem.body.replace(/\n+/g, ""),
    url: `${SITE_URL}${poemPagePath(poem.slug)}`,
    isPartOf: {
      "@type": "Book",
      name: SITE_NAME,
      editor: { "@type": "Person", name: "沈德潜" },
    },
  };
}

/** 序列化为可安全内嵌 <script> 的 JSON（转义 `<`，防止提前闭合标签）。 */
export function serializeStructuredData(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
