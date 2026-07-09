/**
 * Import a volume's poems from 中华书局《古诗源》epub.
 *
 * Usage: node scripts/import-from-epub.mjs <path-to.epub> <volume-slug>
 *
 * Currently supports: han, wei, jin, song, qi, liang, chen, bei-chao, sui
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BEI_CHAO_CONFIG } from "./bei-chao-config.mjs";
import { CHEN_CONFIG } from "./chen-config.mjs";
import { HAN_CONFIG } from "./han-config.mjs";
import { JIN_CONFIG } from "./jin-config.mjs";
import { LIANG_CONFIG } from "./liang-config.mjs";
import { QI_CONFIG } from "./qi-config.mjs";
import { SONG_CONFIG } from "./song-config.mjs";
import { SUI_CONFIG } from "./sui-config.mjs";
import { WEI_CONFIG } from "./wei-config.mjs";
import {
  extractTitleFromHeading,
  firstLineTitle,
  formatBody,
  processPoemBlocks,
  readEpubHtmlParts,
  renderPoemMarkdown,
  stripPoemHtml,
} from "./epub-poem-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const POEMS_DIR = path.join(ROOT, "content", "poems");
const MANIFEST_DIR = path.join(ROOT, "content", "volumes");

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

/**
 * @param {string} html
 * @param {{ onReject: (item: { title: string, text: string }) => void }} options
 */
export function parseHanPoemBodies(html, options) {
  const h3Pattern =
    /<h3 class="kindle-cn-heading3"[^>]*>([\s\S]*?)<\/h3>/gi;
  const h3Matches = [...html.matchAll(h3Pattern)];
  const results = [];

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
      ].map((match) => match[1]);

      if (SINGLE_LONG_NODES.has(author)) {
        const chapters = processPoemBlocks(poemBlocks, {
          title: author,
          onReject: options.onReject,
        });
        results.push({ title: author, chapters });
        continue;
      }

      if (SPLIT_NODES.has(author)) {
        for (const raw of poemBlocks) {
          const text = stripPoemHtml(raw);
          const title = firstLineTitle(text);
          const chapters = processPoemBlocks([raw], {
            title,
            onReject: options.onReject,
          });
          results.push({ title, chapters });
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

      const rawBlocks = [
        ...h4Section.matchAll(/<p class="kindle-cn-poem-left">([\s\S]*?)<\/p>/gi),
        ...h4Section.matchAll(/<p class="calibre5">([\s\S]*?)<\/p>/gi),
      ].map((match) => match[1]);

      const chapters = processPoemBlocks(rawBlocks, {
        title,
        onReject: options.onReject,
      });
      results.push({ title, chapters });
    }
  }

  return results;
}

/**
 * @param {string} epubPath
 * @param {typeof HAN_CONFIG} config
 */
export function importHanFromEpub(epubPath, config) {
  const html = readEpubHtmlParts(epubPath, config.epubParts);
  const rejected = [];
  const parsed = parseHanPoemBodies(html, {
    onReject: (item) => rejected.push(item),
  });

  if (parsed.length !== config.expectedCount) {
    throw new Error(
      `Extracted ${parsed.length} Han entries from epub, expected ${config.expectedCount}`,
    );
  }

  if (config.entries.length !== config.expectedCount) {
    throw new Error(
      `Config has ${config.entries.length} entries, expected ${config.expectedCount}`,
    );
  }

  const manifest = config.entries.map((entry) => entry.slug);
  const logLines = [];

  for (let i = 0; i < config.expectedCount; i++) {
    const meta = config.entries[i];
    const entry = parsed[i];
    const body = formatBody(entry.chapters);

    fs.writeFileSync(
      path.join(POEMS_DIR, `${meta.slug}.md`),
      renderPoemMarkdown({
        title: meta.title,
        author: meta.author,
        authorSlug: meta.authorSlug,
        dynasty: meta.dynasty ?? config.dynasty,
        volume: config.volume,
        body,
      }),
    );

    logLines.push(`${meta.slug}\t${meta.title}`);
  }

  const manifestPath = path.join(MANIFEST_DIR, `${config.volume}-manifest.json`);
  fs.mkdirSync(MANIFEST_DIR, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  return { count: config.expectedCount, rejected, logLines };
}

const VOLUME_IMPORTERS = {
  han: (epubPath) => importHanFromEpub(epubPath, HAN_CONFIG),
  wei: (epubPath) => importHanFromEpub(epubPath, WEI_CONFIG),
  jin: (epubPath) => importHanFromEpub(epubPath, JIN_CONFIG),
  song: (epubPath) => importHanFromEpub(epubPath, SONG_CONFIG),
  qi: (epubPath) => importHanFromEpub(epubPath, QI_CONFIG),
  liang: (epubPath) => importHanFromEpub(epubPath, LIANG_CONFIG),
  chen: (epubPath) => importHanFromEpub(epubPath, CHEN_CONFIG),
  "bei-chao": (epubPath) => importHanFromEpub(epubPath, BEI_CHAO_CONFIG),
  sui: (epubPath) => importHanFromEpub(epubPath, SUI_CONFIG),
};

function main() {
  const epubPath = process.argv[2];
  const volumeSlug = process.argv[3];

  if (!epubPath || !volumeSlug) {
    console.error(
      "Usage: node scripts/import-from-epub.mjs <path-to.epub> <volume-slug>",
    );
    process.exit(1);
  }

  if (!fs.existsSync(epubPath)) {
    console.error(`Epub not found: ${epubPath}`);
    process.exit(1);
  }

  const importer = VOLUME_IMPORTERS[volumeSlug];
  if (!importer) {
    console.error(`Unsupported volume: ${volumeSlug}`);
    process.exit(1);
  }

  const { count, rejected, logLines } = importer(epubPath);

  console.log(`Imported ${count} ${volumeSlug} poems.`);
  console.log("\nSlug ↔ title:");
  for (const line of logLines) {
    console.log(`  ${line}`);
  }

  if (rejected.length > 0) {
    console.log("\nRejected paragraphs (pollution guard):");
    for (const item of rejected) {
      console.log(`  [${item.title}] ${item.text}`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
