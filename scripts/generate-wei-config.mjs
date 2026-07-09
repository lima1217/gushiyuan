/**
 * Generate Wei volume catalog config from epub structure.
 * Run: node scripts/generate-wei-config.mjs
 * Output: scripts/wei-config.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pinyin } from "pinyin-pro";
import {
  extractTitleFromHeading,
  firstLineTitle,
  readEpubHtmlParts,
  stripPoemHtml,
} from "./epub-poem-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "wei-config.mjs");
const DEFAULT_EPUB = "/Users/lima/Desktop/古诗源.epub";

const EPUB_PARTS = ["text/part0011.html", "text/part0012.html"];

const SPLIT_NODES = new Set([
  "古诗十九首",
  "拟苏李诗",
  "古诗",
  "古诗三首",
  "古诗一首",
  "古诗二首",
  "古绝句",
]);

const SINGLE_LONG_NODES = new Set(["古诗为焦仲卿妻作"]);

/** Slugs restored from pre-#29 site (must not change). */
const SLUG_OVERRIDES = {
  "武帝|短歌行": "duan-ge-xing",
  "武帝|观沧海": "guan-cang-hai",
  "武帝|龟虽寿": "gui-sui-shou",
  "武帝|蒿里行": "hao-li-xing",
};

/** Explicit slug disambiguation for duplicate titles. */
const SLUG_DISAMBIGUATION = {
  "文帝|短歌行": "wen-di-duan-ge-xing",
  "文帝|杂诗": "wen-di-za-shi",
  "文帝|善哉行": "wen-di-shan-zai-xing",
  "文帝|燕歌行": "wen-di-yan-ge-xing",
  "曹植|杂诗": "cao-zhi-za-shi",
  "曹植|七哀诗": "cao-zhi-qi-ai-shi",
  "曹植|箜篌引": "cao-zhi-kong-hou-yin",
  "曹植|怨歌行": "cao-zhi-yuan-ge-xing",
  "王粲|七哀诗": "wang-can-qi-ai-shi",
  "陈琳|饮马长城窟行": "chen-lin-yin-ma-chang-cheng-ku-xing",
  "徐幹|杂诗": "xu-gan-za-shi",
  "应璩|杂诗": "ying-qu-za-shi",
  "嵇康|杂诗": "ji-kang-za-shi",
};

/**
 * @param {string} text
 */
function toSlug(text) {
  return pinyin(text, { toneType: "none", type: "array" })
    .join("-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * @param {string} author
 */
function authorSlugFor(author) {
  const overrides = {
    杂歌谣辞: "za-ge-yao-ci",
    古诗十九首: "gu-shi-shi-jiu-shou",
    古诗为焦仲卿妻作: "gu-shi-wei-jiao-zhong-qing-qi-zuo",
    拟苏李诗: "ni-su-li-shi",
    古诗: "gu-shi",
    古诗三首: "gu-shi-san-shou",
    古诗一首: "gu-shi-yi-shou",
    古诗二首: "gu-shi-er-shou",
    古绝句: "gu-jue-ju",
  };
  return overrides[author] ?? toSlug(author);
}

/**
 * @param {string} html
 */
function parseCatalogEntries(html) {
  const h3Pattern =
    /<h3 class="kindle-cn-heading3"[^>]*>([\s\S]*?)<\/h3>/gi;
  const h3Matches = [...html.matchAll(h3Pattern)];
  const entries = [];

  for (let i = 0; i < h3Matches.length; i++) {
    const author = extractTitleFromHeading(h3Matches[i][0]);
    const sectionStart = h3Matches[i].index + h3Matches[i][0].length;
    const sectionEnd =
      i + 1 < h3Matches.length ? h3Matches[i + 1].index : html.length;
    const section = html.slice(sectionStart, sectionEnd);

    const h4Matches = [
      ...section.matchAll(/<h4 class="kindle-cn-heading1">([\s\S]*?)<\/h4>/gi),
    ];

    if (h4Matches.length === 0) {
      const poemBlocks = [
        ...section.matchAll(/<p class="kindle-cn-poem-left">([\s\S]*?)<\/p>/gi),
      ];

      if (SINGLE_LONG_NODES.has(author)) {
        entries.push({
          author,
          title: author,
          mode: "multi-chapter",
        });
        continue;
      }

      if (SPLIT_NODES.has(author)) {
        for (const block of poemBlocks) {
          const text = stripPoemHtml(block[1]);
          entries.push({
            author,
            title: firstLineTitle(text),
            mode: "single",
          });
        }
        continue;
      }

      throw new Error(`Unexpected no-h4 node: ${author}`);
    }

    for (let j = 0; j < h4Matches.length; j++) {
      const title = extractTitleFromHeading(h4Matches[j][0]);
      const h4Start = h4Matches[j].index + h4Matches[j][0].length;
      const h4End =
        j + 1 < h4Matches.length ? h4Matches[j + 1].index : section.length;
      const h4Section = section.slice(h4Start, h4End);
      const blocks = [
        ...h4Section.matchAll(/<p class="kindle-cn-poem-left">([\s\S]*?)<\/p>/gi),
      ];
      const calibre5 = [
        ...h4Section.matchAll(/<p class="calibre5">([\s\S]*?)<\/p>/gi),
      ];
      const mode =
        blocks.length + calibre5.length > 1 ? "multi-chapter" : "single";

      entries.push({ author, title, mode });
    }
  }

  return entries;
}

/**
 * @param {Array<{ author: string, title: string, mode: string }>} entries
 */
function assignSlugs(entries) {
  const usedSlugs = new Set();
  const result = [];

  for (const entry of entries) {
    const key = `${entry.author}|${entry.title}`;
    let slug =
      SLUG_OVERRIDES[key] ??
      SLUG_DISAMBIGUATION[key] ??
      toSlug(entry.title);

    if (usedSlugs.has(slug)) {
      const authorPrefix = authorSlugFor(entry.author);
      slug = `${authorPrefix}-${slug}`;
    }

    if (usedSlugs.has(slug)) {
      throw new Error(`Duplicate slug "${slug}" for ${key}`);
    }

    usedSlugs.add(slug);
    result.push({
      slug,
      title: entry.title,
      author: entry.author,
      authorSlug: authorSlugFor(entry.author),
      mode: entry.mode,
    });
  }

  return result;
}

function renderConfigModule(entries) {
  const lines = entries.map((entry) => {
    return `  { slug: ${JSON.stringify(entry.slug)}, title: ${JSON.stringify(entry.title)}, author: ${JSON.stringify(entry.author)}, authorSlug: ${JSON.stringify(entry.authorSlug)}, mode: ${JSON.stringify(entry.mode)} }`;
  });

  return `/**
 * Wei volume catalog config (原书卷五–六).
 * Generated by scripts/generate-wei-config.mjs — edit overrides there, then regenerate.
 */
export const WEI_CONFIG = {
  volume: "wei",
  dynasty: "魏",
  epubParts: ${JSON.stringify(EPUB_PARTS, null, 2).replace(/\n/g, "\n  ")},
  expectedCount: ${entries.length},
  entries: [
${lines.join(",\n")}
  ],
};
`;
}

function main() {
  const epubPath = process.argv[2] ?? DEFAULT_EPUB;
  const html = readEpubHtmlParts(epubPath, EPUB_PARTS);
  const catalog = parseCatalogEntries(html);
  const entries = assignSlugs(catalog);

  fs.writeFileSync(OUTPUT_PATH, renderConfigModule(entries));
  console.log(`Wrote ${entries.length} entries to ${OUTPUT_PATH}`);
}

main();
