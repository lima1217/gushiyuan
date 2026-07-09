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
