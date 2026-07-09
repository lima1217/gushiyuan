/**
 * Generate Sui volume catalog config from epub structure.
 * Run: node scripts/generate-sui-config.mjs
 * Output: scripts/sui-config.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pinyin } from "pinyin-pro";
import { BEI_CHAO_CONFIG } from "./bei-chao-config.mjs";
import { CHEN_CONFIG } from "./chen-config.mjs";
import { HAN_CONFIG } from "./han-config.mjs";
import { JIN_CONFIG } from "./jin-config.mjs";
import { LIANG_CONFIG } from "./liang-config.mjs";
import { QI_CONFIG } from "./qi-config.mjs";
import { SONG_CONFIG } from "./song-config.mjs";
import { WEI_CONFIG } from "./wei-config.mjs";
import {
  extractTitleFromHeading,
  firstLineTitle,
  hasCjk,
  readEpubHtmlParts,
  stripPoemHtml,
} from "./epub-poem-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "sui-config.mjs");
const DEFAULT_EPUB = "/Users/lima/Desktop/古诗源.epub";

const EPUB_PARTS = ["text/part0020_split_004.html"];

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

/** Explicit slug disambiguation for duplicate titles. */
const SLUG_DISAMBIGUATION = {
  "炀帝|白马篇": "yang-di-bai-ma-pian",
  "明馀庆|从军行": "ming-yu-qing-cong-jun-xing",
  "孔绍安|送别诗": "kong-shao-an-song-bie-shi",
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
    无名氏: "wu-ming-shi",
    古诗十九首: "gu-shi-shi-jiu-shou",
    古诗为焦仲卿妻作: "gu-shi-wei-jiao-zhong-qing-qi-zuo",
    拟苏李诗: "ni-su-li-shi",
    古诗: "gu-shi",
    古诗三首: "gu-shi-san-shou",
    古诗一首: "gu-shi-yi-shou",
    古诗二首: "gu-shi-er-shou",
    古绝句: "gu-jue-ju",
    炀帝: "yang-di",
    吕让: "lv-rang",
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
      const poemBlocks = [...blocks, ...calibre5].filter((match) =>
        hasCjk(stripPoemHtml(match[1])),
      );
      const mode = poemBlocks.length > 1 ? "multi-chapter" : "single";

      entries.push({ author, title, mode });
    }
  }

  return entries;
}

/**
 * @returns {Set<string>}
 */
function loadReservedSlugs() {
  const reserved = new Set();
  const guYiManifest = path.join(
    __dirname,
    "..",
    "content",
    "volumes",
    "gu-yi-manifest.json",
  );
  for (const slug of JSON.parse(fs.readFileSync(guYiManifest, "utf8"))) {
    reserved.add(slug);
  }
  for (const entry of HAN_CONFIG.entries) {
    reserved.add(entry.slug);
  }
  for (const entry of WEI_CONFIG.entries) {
    reserved.add(entry.slug);
  }
  for (const entry of JIN_CONFIG.entries) {
    reserved.add(entry.slug);
  }
  for (const entry of SONG_CONFIG.entries) {
    reserved.add(entry.slug);
  }
  for (const entry of QI_CONFIG.entries) {
    reserved.add(entry.slug);
  }
  for (const entry of LIANG_CONFIG.entries) {
    reserved.add(entry.slug);
  }
  for (const entry of CHEN_CONFIG.entries) {
    reserved.add(entry.slug);
  }
  for (const entry of BEI_CHAO_CONFIG.entries) {
    reserved.add(entry.slug);
  }
  return reserved;
}

/**
 * @param {Array<{ author: string, title: string, mode: string }>} entries
 */
function assignSlugs(entries) {
  const usedSlugs = loadReservedSlugs();
  const result = [];

  for (const entry of entries) {
    const key = `${entry.author}|${entry.title}`;
    let slug = SLUG_DISAMBIGUATION[key] ?? toSlug(entry.title);

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
 * Sui volume catalog config (原书卷十四·隋诗).
 * Generated by scripts/generate-sui-config.mjs — edit overrides there, then regenerate.
 */
export const SUI_CONFIG = {
  volume: "sui",
  dynasty: "隋",
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
