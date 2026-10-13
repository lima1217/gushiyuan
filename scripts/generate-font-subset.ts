import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";
import { rankSiteFontGlyphs } from "../src/lib/font-glyphs";
import {
  computeInputFingerprint,
  isCacheHit,
  readCacheManifest,
  writeCacheManifest,
} from "./lib/generation-cache";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Regular(400) 为正文权威字重：Light(300) 在小字号下发虚，Regular 在桌面/移动一致。
// 子集源文件与 @font-face 声明字重对齐，消除字重不匹配造成的字形发虚。
const FONT_SOURCE = path.join(ROOT, "scripts/fonts/LXGWWenKai-Regular.ttf");
const FONT_SOURCE_URL =
  "https://github.com/lxgw/LxgwWenKai/releases/download/v1.521/LXGWWenKai-Regular.ttf";
const OUT_DIR = path.join(ROOT, "public/fonts/wenkai");
const CSS_OUT = path.join(ROOT, "src/fonts/wenkai.css");
const PATH_OUT = path.join(ROOT, "src/lib/wenkai-subset-path.generated.ts");
const MANIFEST_OUT = path.join(ROOT, "scripts/.cache/wenkai.manifest.json");
const VALIDATE_SCRIPT = path.join(ROOT, "scripts/validate-subset-cmap.py");
const GENERATOR_VERSION = "3";

// 简繁双变体会把繁体派生码点纳入子集；保留上限防止异常膨胀。
const MAX_FONT_BYTES = 1536 * 1024;
/** 每片目标码点数；按字频排序后顺序分桶，约 13 片覆盖全站字形。 */
const GLYPHS_PER_SLICE = 400;
/** 写入文件名的 inputsHash 前缀长度；变更即换 URL，避免 CDN 长缓存喂旧坏文件。 */
const HASH_TAG_LENGTH = 8;

type WenKaiManifestSlice = {
  index: number;
  glyphCount: number;
  fontFile: string;
  publicPath: string;
  unicodeRange: string;
  bytes: number;
};

function computeWenKaiInputsHash(): string {
  return computeInputFingerprint({
    root: ROOT,
    files: [
      "src/lib/font-glyphs.ts",
      "src/lib/font-ui-literals.ts",
      "src/lib/site-ui-text.ts",
      "src/lib/site-metadata.ts",
      "src/lib/script-conversion.ts",
      "content/script-conversion-overrides.json",
      "scripts/generate-font-subset.ts",
      "scripts/validate-subset-cmap.py",
      "package-lock.json",
      "scripts/fonts/LXGWWenKai-Regular.ttf",
    ],
    directories: ["content"],
    extensions: [".md", ".json"],
    version: GENERATOR_VERSION,
  });
}

function tryWenKaiCacheHit(inputsHash: string): boolean {
  const manifest = readCacheManifest(MANIFEST_OUT);
  if (
    manifest === null ||
    typeof manifest !== "object" ||
    Array.isArray(manifest)
  ) {
    return false;
  }

  const record = manifest as {
    inputsHash?: unknown;
    generatorVersion?: unknown;
    slices?: unknown;
  };
  if (
    !Array.isArray(record.slices) ||
    record.slices.length === 0 ||
    record.slices.some(
      (slice) =>
        typeof slice !== "object" ||
        slice === null ||
        typeof (slice as WenKaiManifestSlice).fontFile !== "string" ||
        typeof (slice as WenKaiManifestSlice).bytes !== "number",
    )
  ) {
    return false;
  }

  const slices = record.slices as WenKaiManifestSlice[];
  return isCacheHit({
    manifestPath: MANIFEST_OUT,
    inputsHash,
    generatorVersion: GENERATOR_VERSION,
    outputs: [
      ...slices.map((slice) => ({
        path: path.join(OUT_DIR, slice.fontFile),
        bytes: slice.bytes,
      })),
      { path: CSS_OUT },
      { path: PATH_OUT },
    ],
  });
}

async function ensureSourceFont(): Promise<void> {
  if (fs.existsSync(FONT_SOURCE)) {
    return;
  }

  fs.mkdirSync(path.dirname(FONT_SOURCE), { recursive: true });
  console.log(`Downloading LXGW WenKai Regular from ${FONT_SOURCE_URL}…`);
  const response = await fetch(FONT_SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to download source font (${response.status})`);
  }

  fs.writeFileSync(FONT_SOURCE, Buffer.from(await response.arrayBuffer()));
}

function hashTagFromInputs(inputsHash: string): string {
  if (inputsHash.length < HASH_TAG_LENGTH) {
    throw new Error(
      `inputsHash too short for filename tag (need ≥${HASH_TAG_LENGTH})`,
    );
  }
  return inputsHash.slice(0, HASH_TAG_LENGTH);
}

function subsetFileName(
  index: number,
  glyphCount: number,
  hashTag: string,
): string {
  return `wenkai-subset.${index}.${glyphCount}.${hashTag}.woff2`;
}

function subsetPublicPath(
  index: number,
  glyphCount: number,
  hashTag: string,
): string {
  return `/fonts/wenkai/${subsetFileName(index, glyphCount, hashTag)}`;
}

/** 将已按加载优先级排序的码点按目标大小顺序分桶。 */
export function sliceCodePoints(
  codePoints: number[],
  perSlice = GLYPHS_PER_SLICE,
): number[][] {
  if (codePoints.length === 0) {
    return [];
  }

  const slices: number[][] = [];
  for (let i = 0; i < codePoints.length; i += perSlice) {
    slices.push(codePoints.slice(i, i + perSlice));
  }
  return slices;
}

/** 连续码点合并为 U+xxxx-yyyy，离散码点用逗号列出。 */
export function formatUnicodeRange(codePoints: number[]): string {
  if (codePoints.length === 0) {
    return "";
  }

  const sorted = [...codePoints].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0]!;
  let end = sorted[0]!;

  for (let i = 1; i < sorted.length; i++) {
    const cp = sorted[i]!;
    if (cp === end + 1) {
      end = cp;
      continue;
    }
    ranges.push(formatOneRange(start, end));
    start = end = cp;
  }
  ranges.push(formatOneRange(start, end));
  return ranges.join(", ");
}

function formatOneRange(start: number, end: number): string {
  const fmt = (n: number) => n.toString(16).toUpperCase().padStart(4, "0");
  if (start === end) {
    return `U+${fmt(start)}`;
  }
  return `U+${fmt(start)}-${fmt(end)}`;
}

function buildFontFaceCss(
  slices: { publicPath: string; unicodeRange: string }[],
): string {
  // 不前置 local()：保证所有设备使用同一站点子集，避免本机霞鹜文楷
  // （可能为 Light/Regular/不同字重）劫持正文，导致桌面/移动字重不一致。
  // 全片用 swap：optional 会在首屏块超时后永久停在系统 fallback，不再换回文楷。
  return slices
    .map(
      ({ publicPath, unicodeRange }) => `@font-face {
  font-family: "LXGW WenKai";
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url(${publicPath}) format("woff2");
  unicode-range: ${unicodeRange};
}
`,
    )
    .join("\n");
}

/** Rewrite @font-face CSS from an existing cache manifest (no font rebuild). */
function writeCssFromManifest(): boolean {
  const manifest = readCacheManifest(MANIFEST_OUT);
  if (
    manifest === null ||
    typeof manifest !== "object" ||
    Array.isArray(manifest)
  ) {
    return false;
  }
  const slices = (manifest as { slices?: unknown }).slices;
  if (!Array.isArray(slices) || slices.length === 0) {
    return false;
  }
  const faces: { publicPath: string; unicodeRange: string }[] = [];
  for (const slice of slices) {
    if (
      typeof slice !== "object" ||
      slice === null ||
      typeof (slice as WenKaiManifestSlice).publicPath !== "string" ||
      typeof (slice as WenKaiManifestSlice).unicodeRange !== "string"
    ) {
      return false;
    }
    faces.push({
      publicPath: (slice as WenKaiManifestSlice).publicPath,
      unicodeRange: (slice as WenKaiManifestSlice).unicodeRange,
    });
  }
  fs.mkdirSync(path.dirname(CSS_OUT), { recursive: true });
  fs.writeFileSync(CSS_OUT, buildFontFaceCss(faces));
  return true;
}

function writeGeneratedPaths(publicPaths: string[]): void {
  const serialized = JSON.stringify(publicPaths, null, 2);
  const contents = `// Generated by scripts/generate-font-subset.ts — do not edit.
export const WENKAI_SUBSET_PATHS: string[] = ${serialized};
`;
  fs.writeFileSync(PATH_OUT, contents);
}

function resolvePythonWithFontTools(): string {
  const candidates = [
    path.join(ROOT, ".venv-font/bin/python3"),
    "python3",
  ];

  for (const python of candidates) {
    try {
      execFileSync(python, ["-c", "from fontTools.ttLib import TTFont"], {
        stdio: ["ignore", "ignore", "ignore"],
      });
      return python;
    } catch {
      // try next candidate
    }
  }

  console.log("Installing fonttools for subset validation…");
  execFileSync(
    "python3",
    ["-m", "pip", "install", "--user", "--quiet", "-r", path.join(ROOT, "requirements.txt")],
    { stdio: "inherit" },
  );
  return "python3";
}

function validateSubsetCmap(fontPath: string, glyphs: number[]): void {
  const python = resolvePythonWithFontTools();
  execFileSync(python, [VALIDATE_SCRIPT, fontPath], {
    input: JSON.stringify(glyphs),
    stdio: ["pipe", "inherit", "inherit"],
  });
}

async function main(): Promise<void> {
  await ensureSourceFont();

  const inputsHash = computeWenKaiInputsHash();
  if (tryWenKaiCacheHit(inputsHash)) {
    console.log("Skipping WenKai subset generation (cache hit)");
    if (writeCssFromManifest()) {
      console.log(`Rewrote ${path.relative(ROOT, CSS_OUT)} from cache manifest`);
    }
    return;
  }

  const glyphs = rankSiteFontGlyphs();
  const slices = sliceCodePoints(glyphs);

  console.log(
    `Collected ${glyphs.length} unique glyphs → ${slices.length} slices (~${GLYPHS_PER_SLICE}/slice, frequency-ranked).`,
  );

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(CSS_OUT), { recursive: true });
  fs.mkdirSync(path.dirname(MANIFEST_OUT), { recursive: true });

  const sourceFont = fs.readFileSync(FONT_SOURCE);
  const hashTag = hashTagFromInputs(inputsHash);
  const sliceMeta: WenKaiManifestSlice[] = [];

  let totalBytes = 0;

  for (let index = 0; index < slices.length; index++) {
    const sliceGlyphs = slices[index]!;
    const text = String.fromCodePoint(...sliceGlyphs);
    const fileName = subsetFileName(index, sliceGlyphs.length, hashTag);
    const publicPath = subsetPublicPath(index, sliceGlyphs.length, hashTag);
    const fontOut = path.join(OUT_DIR, fileName);

    const subset = await subsetFont(sourceFont, text, {
      targetFormat: "woff2",
    });

    totalBytes += subset.byteLength;
    fs.writeFileSync(fontOut, subset);
    validateSubsetCmap(fontOut, sliceGlyphs);

    const unicodeRange = formatUnicodeRange(sliceGlyphs);
    sliceMeta.push({
      index,
      glyphCount: sliceGlyphs.length,
      fontFile: fileName,
      publicPath,
      unicodeRange,
      bytes: subset.byteLength,
    });

    console.log(
      `  slice ${index}: ${fileName} — ${(subset.byteLength / 1024).toFixed(1)} KiB, ${sliceGlyphs.length} glyphs`,
    );
  }

  if (totalBytes > MAX_FONT_BYTES) {
    throw new Error(
      `Subset fonts total ${(totalBytes / 1024).toFixed(1)} KiB, exceeding ${MAX_FONT_BYTES / 1024} KiB limit`,
    );
  }

  const publicPaths = sliceMeta.map((s) => s.publicPath);
  fs.writeFileSync(
    CSS_OUT,
    buildFontFaceCss(
      sliceMeta.map(({ publicPath, unicodeRange }) => ({
        publicPath,
        unicodeRange,
      })),
    ),
  );
  writeGeneratedPaths(publicPaths);

  const manifest = {
    glyphCount: glyphs.length,
    sliceCount: slices.length,
    totalBytes,
    inputsHash,
    generatorVersion: GENERATOR_VERSION,
    slices: sliceMeta.map(
      ({ index, glyphCount, fontFile, publicPath, unicodeRange, bytes }) => ({
        index,
        glyphCount,
        fontFile,
        publicPath,
        unicodeRange,
        bytes,
      }),
    ),
  };
  writeCacheManifest(MANIFEST_OUT, manifest);

  console.log(
    `Generated ${slices.length} slices: ${(totalBytes / 1024).toFixed(1)} KiB total for ${glyphs.length} glyphs.`,
  );
}

const isDirectRun =
  process.argv[1] !== undefined &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
