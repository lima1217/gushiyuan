/**
 * Shared epub poem parsing utilities for volume imports.
 */

/** Punctuation that marks mis-tagged commentary after inline notes are stripped. */
export const POLLUTION_PATTERN = /[，,：:；;？?！!""''「」『』《》]/;

/** Allowed punctuation in poem body lines (besides CJK characters). */
export const ALLOWED_PUNCT = new Set(["。", "、"]);

/**
 * @param {string} html
 */
export function removeKaitiSpans(html) {
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
 * @param {string} text
 */
export function cleanHeadingText(text) {
  let inner = text.split(/\u3000/)[0].split(/[。]/)[0];
  inner = inner.replace(/[\u3000\s]+/g, "");
  return inner.trim();
}

/**
 * @param {string} html
 */
export function extractTitleFromHeading(html) {
  const titleAttr = html.match(/\btitle="([^"]+)"/);
  if (titleAttr) {
    return cleanHeadingText(titleAttr[1]);
  }

  let inner = removeKaitiSpans(html);
  inner = inner.replace(/<[^>]+>/g, "").trim();
  return cleanHeadingText(inner);
}

/**
 * Strip inline notes and HTML, leaving plain poem text.
 * @param {string} html
 */
export function stripPoemHtml(html) {
  let text = removeKaitiSpans(html);
  text = text.replace(/<br[^>]*\/?>/gi, "");
  text = text.replace(/<img[^>]*\/?>/gi, "");
  text = text.replace(/<[^>]+>/g, "");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
  text = text.replace(/[\u3000\s]+/g, "");
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
 * @param {string} text
 */
export function firstLineTitle(text) {
  return text
    .split(/[。！？\n]/)[0]
    .trim()
    .replace(/[，,：:；;？?！!""''「」『』《》]/g, "");
}

import { execSync } from "child_process";

/**
 * @param {string} epubPath
 * @param {string[]} htmlPaths
 */
export function readEpubHtmlParts(epubPath, htmlPaths) {
  return htmlPaths
    .map((htmlPath) =>
      execSync(`unzip -p ${JSON.stringify(epubPath)} ${htmlPath}`, {
        encoding: "utf-8",
        maxBuffer: 20 * 1024 * 1024,
      }),
    )
    .join("\n");
}

/**
 * @param {string} text
 */
export function hasCjk(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

const CN_DIGIT = {
  零: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

/**
 * @param {string} text
 * @returns {number | null}
 */
export function parseChineseNumber(text) {
  if (/^\d+$/.test(text)) {
    return Number(text);
  }

  let result = 0;
  let current = 0;

  for (const char of text) {
    if (char === "十") {
      if (current === 0) {
        current = 1;
      }
      result += current * 10;
      current = 0;
      continue;
    }
    if (char === "百") {
      if (current === 0) {
        current = 1;
      }
      result += current * 100;
      current = 0;
      continue;
    }
    if (!(char in CN_DIGIT)) {
      return null;
    }
    current = CN_DIGIT[char];
  }

  return result + current;
}

/**
 * Parse sub-chapter count from group titles like 补亡诗六章 or 饮酒二十首.
 * @param {string} title
 * @returns {number | null}
 */
export function parseGroupChapterCount(title) {
  const match = title.match(/([零一二三四五六七八九十百\d]+)(章|首)$/);
  if (!match) {
    return null;
  }
  const count = parseChineseNumber(match[1]);
  return count !== null && count > 0 ? count : null;
}

/**
 * @param {string} sectionHtml
 * @returns {string[]}
 */
export function extractPoemRawBlocksFromSection(sectionHtml) {
  return [
    ...sectionHtml.matchAll(/<p class="kindle-cn-poem-left">([\s\S]*?)<\/p>/gi),
    ...sectionHtml.matchAll(/<p class="calibre5">([\s\S]*?)<\/p>/gi),
  ]
    .map((match) => match[1])
    .filter((block) => hasCjk(stripPoemHtml(block)));
}

/**
 * Walk h4 sections, merging empty group headers (e.g. 补亡诗六章) with following sub-chapters.
 * @param {string} section
 * @param {RegExpMatchArray[]} h4Matches
 * @returns {Array<{ title: string, rawBlocks: string[], mode: "single" | "multi-chapter" }>}
 */
export function iterateMergedH4Entries(section, h4Matches) {
  /** @type {Array<{ title: string, rawBlocks: string[], mode: "single" | "multi-chapter" }>} */
  const entries = [];

  for (let j = 0; j < h4Matches.length; j++) {
    const title = extractTitleFromHeading(h4Matches[j][0]);
    const h4Start = h4Matches[j].index + h4Matches[j][0].length;
    const h4End =
      j + 1 < h4Matches.length ? h4Matches[j + 1].index : section.length;
    const h4Section = section.slice(h4Start, h4End);
    let rawBlocks = extractPoemRawBlocksFromSection(h4Section);

    if (rawBlocks.length === 0) {
      const chapterCount = parseGroupChapterCount(title);
      if (chapterCount !== null && j + chapterCount < h4Matches.length) {
        const mergedBlocks = [];
        for (let k = 1; k <= chapterCount; k++) {
          const subStart = h4Matches[j + k].index + h4Matches[j + k][0].length;
          const subEnd =
            j + k + 1 < h4Matches.length
              ? h4Matches[j + k + 1].index
              : section.length;
          const subBlocks = extractPoemRawBlocksFromSection(
            section.slice(subStart, subEnd),
          );
          if (subBlocks.length !== 1) {
            const subTitle = extractTitleFromHeading(h4Matches[j + k][0]);
            throw new Error(
              `Group "${title}" sub-chapter ${k} (${subTitle}): expected 1 poem block, got ${subBlocks.length}`,
            );
          }
          mergedBlocks.push(subBlocks[0]);
        }
        entries.push({
          title,
          rawBlocks: mergedBlocks,
          mode: "multi-chapter",
        });
        j += chapterCount;
        continue;
      }
    }

    entries.push({
      title,
      rawBlocks,
      mode: rawBlocks.length > 1 ? "multi-chapter" : "single",
    });
  }

  return entries;
}

/**
 * Process raw poem HTML blocks into validated chapters.
 * @param {string[]} rawBlocks
 * @param {{ title: string, onReject?: (item: { title: string, text: string }) => void }} context
 * @returns {string[][]}
 */
export function processPoemBlocks(rawBlocks, context) {
  const chapters = [];

  for (const raw of rawBlocks) {
    const text = stripPoemHtml(raw);
    if (!text || !hasCjk(text)) {
      continue;
    }

    if (isPollutedParagraph(text)) {
      context.onReject?.({
        title: context.title,
        text: text.slice(0, 80) + (text.length > 80 ? "…" : ""),
      });
      continue;
    }

    const lines = splitIntoLines(text);
    for (const line of lines) {
      validateLinePunctuation(line);
    }
    chapters.push(lines);
  }

  return chapters;
}

/**
 * @param {{ title: string, author: string, authorSlug: string, dynasty: string, volume: string, body: string }} poem
 */
export function renderPoemMarkdown({ title, author, authorSlug, dynasty, volume, body }) {
  return `---
title: ${title}
author: ${author}
authorSlug: ${authorSlug}
dynasty: ${dynasty}
volume: ${volume}
---

${body}
`;
}
