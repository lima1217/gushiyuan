/**
 * Import 古逸卷 103 poems from 中华书局《古诗源》epub.
 *
 * Usage: node scripts/import-gu-yi-from-epub.mjs <path-to.epub>
 *
 * Overwrites content/poems/*.md (gu-yi only) and content/volumes/gu-yi-manifest.json.
 * Slugs and manifest order are preserved; poem text is simplified with period punctuation.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { GU_YI_METADATA } from "./gu-yi-metadata.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const POEMS_DIR = path.join(ROOT, "content", "poems");
const MANIFEST_PATH = path.join(ROOT, "content", "volumes", "gu-yi-manifest.json");
const EPUB_HTML_PATH = "text/part0007.html";

const DYNASTY = "古逸";
const VOLUME = "gu-yi";
const EXPECTED_COUNT = 103;

/** Punctuation that marks mis-tagged commentary after inline notes are stripped. */
const POLLUTION_PATTERN = /[，,：:；;？?！!""''「」『』《》]/;

/** Allowed punctuation in poem body lines (besides CJK characters). */
const ALLOWED_PUNCT = new Set(["。", "、"]);

/**
 * @param {string} html
 */
export function extractTitleFromH3(html) {
  const titleAttr = html.match(/\btitle="([^"]+)"/);
  if (titleAttr) {
    return titleAttr[1].trim();
  }

  let inner = html.replace(/<span class="kaiti1[^"]*">[\s\S]*?<\/span>/gi, "");
  inner = inner.replace(/<[^>]+>/g, "").trim();
  inner = inner.replace(/[\u3000\s]+/g, "");
  inner = inner.replace(/[二三四五六七八九十百千]+章$/, "");
  return inner.trim();
}

/**
 * Remove kaiti/kaiti1 spans including nested markup.
 * @param {string} html
 */
function removeKaitiSpans(html) {
  const openPattern = /<span class="kaiti1?[^"]*">/gi;
  let result = html;
  let match;

  while ((match = openPattern.exec(result)) !== null) {
    const start = match.index;
    let depth = 1;
    let i = start + match[0].length;

    while (i < result.length && depth > 0) {
      const rest = result.slice(i);
      if (rest.startsWith("<span")) {
        depth += 1;
        i = result.indexOf(">", i) + 1;
      } else if (rest.startsWith("</span>")) {
        depth -= 1;
        i += 7;
      } else {
        i += 1;
      }
    }

    result = result.slice(0, start) + result.slice(i);
    openPattern.lastIndex = start;
  }

  return result;
}

/**
 * Strip inline notes and HTML, leaving plain poem text.
 * @param {string} html
 */
export function stripPoemHtml(html) {
  let text = removeKaitiSpans(html);
  text = text.replace(/<br[^>]*\/?>/gi, "");
  text = text.replace(/<[^>]+>/g, "");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
  return text.trim();
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function isPollutedParagraph(text) {
  return POLLUTION_PATTERN.test(text);
}

/**
 * Split a poem paragraph into one line per sentence, each ending with 。
 * @param {string} text
 * @returns {string[]}
 */
export function splitIntoLines(text) {
  const parts = text
    .split("。")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.map((part) => `${part}。`);
}

/**
 * @param {string} line
 */
export function validateLinePunctuation(line) {
  for (const char of line) {
    if (/[\u4e00-\u9fff]/.test(char)) {
      continue;
    }
    if (!ALLOWED_PUNCT.has(char)) {
      throw new Error(`Disallowed character "${char}" in line: ${line}`);
    }
  }
  if (!line.endsWith("。")) {
    throw new Error(`Line must end with 。: ${line}`);
  }
}

/**
 * @param {string[][]} chapters
 * @returns {string}
 */
export function formatBody(chapters) {
  return chapters.map((chapter) => chapter.join("\n")).join("\n\n");
}

/**
 * @param {string} html
 * @returns {Array<{ title: string, chapters: string[][] }>}
 */
export function parseGuYiEntries(html) {
  const h3Pattern =
    /<h3 class="kindle-cn-heading3"[^>]*>([\s\S]*?)<\/h3>/gi;
  const matches = [...html.matchAll(h3Pattern)];

  const rejected = [];
  const entries = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const title = extractTitleFromH3(match[0]);
    const sectionStart = match.index + match[0].length;
    const sectionEnd =
      i + 1 < matches.length ? matches[i + 1].index : html.length;
    const section = html.slice(sectionStart, sectionEnd);

    const poemPattern =
      /<p class="kindle-cn-poem-left">([\s\S]*?)<\/p>/gi;
    const poemBlocks = [...section.matchAll(poemPattern)];

    const chapters = [];

    for (const block of poemBlocks) {
      const raw = block[1];
      const text = stripPoemHtml(raw);

      if (!text) {
        continue;
      }

      if (isPollutedParagraph(text)) {
        rejected.push({ title, text: text.slice(0, 80) + (text.length > 80 ? "…" : "") });
        continue;
      }

      const lines = splitIntoLines(text);
      for (const line of lines) {
        validateLinePunctuation(line);
      }
      chapters.push(lines);
    }

    entries.push({ title, chapters });
  }

  return { entries, rejected };
}

/**
 * @param {string} epubPath
 */
export function readEpubHtml(epubPath) {
  return execSync(`unzip -p ${JSON.stringify(epubPath)} ${EPUB_HTML_PATH}`, {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

/**
 * @param {{ title: string, author: string, authorSlug: string, body: string }} poem
 */
export function renderPoemMarkdown({ title, author, authorSlug, body }) {
  return `---
title: ${title}
author: ${author}
authorSlug: ${authorSlug}
dynasty: ${DYNASTY}
volume: ${VOLUME}
---

${body}
`;
}

/**
 * @param {string} epubPath
 */
export function importGuYiFromEpub(epubPath) {
  if (GU_YI_METADATA.length !== EXPECTED_COUNT) {
    throw new Error(
      `Metadata count ${GU_YI_METADATA.length} !== ${EXPECTED_COUNT}`,
    );
  }

  const html = readEpubHtml(epubPath);
  const { entries, rejected } = parseGuYiEntries(html);

  if (entries.length !== EXPECTED_COUNT) {
    throw new Error(
      `Extracted ${entries.length} entries from epub, expected ${EXPECTED_COUNT}`,
    );
  }

  const manifest = GU_YI_METADATA.map((meta) => meta.slug);
  const logLines = [];

  for (let i = 0; i < EXPECTED_COUNT; i++) {
    const meta = GU_YI_METADATA[i];
    const entry = entries[i];
    const body = formatBody(entry.chapters);

    fs.writeFileSync(
      path.join(POEMS_DIR, `${meta.slug}.md`),
      renderPoemMarkdown({
        title: entry.title,
        author: meta.author,
        authorSlug: meta.authorSlug,
        body,
      }),
    );

    logLines.push(`${meta.slug}\t${entry.title}`);
  }

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  return { count: EXPECTED_COUNT, rejected, logLines };
}

function main() {
  const epubPath = process.argv[2];
  if (!epubPath) {
    console.error("Usage: node scripts/import-gu-yi-from-epub.mjs <path-to.epub>");
    process.exit(1);
  }

  if (!fs.existsSync(epubPath)) {
    console.error(`Epub not found: ${epubPath}`);
    process.exit(1);
  }

  const { count, rejected, logLines } = importGuYiFromEpub(epubPath);

  console.log(`Imported ${count} gu-yi poems.`);
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
