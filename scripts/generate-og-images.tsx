import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ImageResponse } from "next/og";
import subsetFont from "subset-font";
import { getAllPoems, getPoemBySlug } from "../src/lib/poems";
import { shouldHidePoemAuthor } from "../src/lib/poem-display";
import {
  layoutPoemOgColumns,
  POEM_OG_IMAGE_HEIGHT,
  POEM_OG_IMAGE_WIDTH,
  poemOgImagePath,
} from "../src/lib/poem-og";
import { SITE_NAME, SITE_THEME_COLOR } from "../src/lib/site-identity";
import {
  computeInputFingerprint,
  isCacheHit,
  readCacheManifest,
  writeCacheManifest,
} from "./lib/generation-cache";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// 源字体由 font:subset 下载；build / predev 中本脚本排在其后。
const FONT_SOURCE = path.join(ROOT, "scripts/fonts/LXGWWenKai-Regular.ttf");
const PUBLIC_DIR = path.join(ROOT, "public");
const OUT_DIR = path.join(PUBLIC_DIR, "og/p");
const MANIFEST_OUT = path.join(ROOT, "scripts/.cache/og-images.manifest.json");
const GENERATOR_VERSION = "1";

/** 与 globals.css 的 --palette-ink / --palette-ink-muted 一致。 */
const INK = "#2c2a26";
const INK_MUTED = "#6b6560";

const TITLE_SIZE = 50;
const META_SIZE = 26;
const BODY_SIZE = 36;
const BRAND_SIZE = 24;
const COLUMN_LINE_HEIGHT = 1.2;
/** 上下两条细线之间、留白后的可用列高。 */
const COLUMN_HEIGHT = 400;
const FRAME_INSET_X = 160;

const LAYOUT = {
  titleCharsPerColumn: Math.floor(COLUMN_HEIGHT / (TITLE_SIZE * COLUMN_LINE_HEIGHT)),
  maxTitleColumns: 3,
  bodyCharsPerColumn: Math.floor(COLUMN_HEIGHT / (BODY_SIZE * COLUMN_LINE_HEIGHT)),
  maxBodyColumns: 8,
};

type OgCacheManifest = {
  inputsHash: string;
  generatorVersion: string;
  images: { path: string; bytes: number }[];
};

function computeOgInputsHash(): string {
  return computeInputFingerprint({
    root: ROOT,
    files: [
      "scripts/generate-og-images.tsx",
      "src/lib/poem-og.ts",
      "src/lib/poem-display.ts",
      "src/lib/poems.ts",
      "src/lib/site-identity.ts",
      "package-lock.json",
      "scripts/fonts/LXGWWenKai-Regular.ttf",
    ],
    directories: ["content/poems"],
    extensions: [".md"],
    version: GENERATOR_VERSION,
  });
}

function tryOgCacheHit(inputsHash: string): boolean {
  const manifest = readCacheManifest(MANIFEST_OUT) as Partial<OgCacheManifest> | null;
  if (!manifest || !Array.isArray(manifest.images) || manifest.images.length === 0) {
    return false;
  }
  return isCacheHit({
    manifestPath: MANIFEST_OUT,
    inputsHash,
    generatorVersion: GENERATOR_VERSION,
    outputs: manifest.images.map((image) => ({
      path: path.join(PUBLIC_DIR, image.path),
      bytes: image.bytes,
    })),
  });
}

function VerticalColumn({
  text,
  size,
  color,
}: {
  text: string;
  size: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontSize: size,
        lineHeight: COLUMN_LINE_HEIGHT,
        color,
      }}
    >
      {[...text].map((char, index) => (
        <span key={index}>{char}</span>
      ))}
    </div>
  );
}

function PoemCard({
  title,
  attribution,
  body,
}: {
  title: string[];
  attribution: string[];
  body: string[];
}) {
  const rule = {
    position: "absolute" as const,
    left: FRAME_INSET_X,
    right: FRAME_INSET_X,
    height: 1,
    background: INK,
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: SITE_THEME_COLOR,
        fontFamily: "WenKai",
      }}
    >
      <div style={{ ...rule, top: 70 }} />
      <div style={{ ...rule, bottom: 70 }} />
      <div
        style={{
          position: "absolute",
          top: 100,
          bottom: 100,
          left: FRAME_INSET_X,
          right: FRAME_INSET_X,
          display: "flex",
          flexDirection: "row-reverse",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row-reverse", gap: 16 }}>
          {title.map((column, index) => (
            <VerticalColumn key={index} text={column} size={TITLE_SIZE} color={INK} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: META_SIZE * 0.6,
            marginRight: 28,
            paddingTop: 8,
          }}
        >
          {attribution.map((part, index) => (
            <VerticalColumn key={index} text={part} size={META_SIZE} color={INK_MUTED} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row-reverse",
            gap: 24,
            marginRight: 56,
            paddingTop: 8,
          }}
        >
          {body.map((column, index) => (
            <VerticalColumn key={index} text={column} size={BODY_SIZE} color={INK} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            marginRight: "auto",
            alignSelf: "flex-end",
          }}
        >
          <VerticalColumn text={SITE_NAME} size={BRAND_SIZE} color={INK_MUTED} />
        </div>
      </div>
    </div>
  );
}

async function renderPoemCard(slug: string, sourceFont: Buffer): Promise<Buffer> {
  const poem = getPoemBySlug(slug);
  if (!poem) {
    throw new Error(`Unknown poem slug: ${slug}`);
  }

  const { title, body } = layoutPoemOgColumns(poem, LAYOUT);
  const attribution = shouldHidePoemAuthor(poem)
    ? [poem.dynasty]
    : [poem.dynasty, poem.author];
  const text = [...title, ...attribution, ...body, SITE_NAME].join("");
  const font = await subsetFont(sourceFont, text, { targetFormat: "truetype" });

  const response = new ImageResponse(
    <PoemCard title={title} attribution={attribution} body={body} />,
    {
      width: POEM_OG_IMAGE_WIDTH,
      height: POEM_OG_IMAGE_HEIGHT,
      fonts: [{ name: "WenKai", data: font, weight: 400, style: "normal" }],
    },
  );
  return Buffer.from(await response.arrayBuffer());
}

async function main(): Promise<void> {
  const inputsHash = computeOgInputsHash();
  if (tryOgCacheHit(inputsHash)) {
    console.log("Skipping OG image generation (cache hit)");
    return;
  }

  if (!fs.existsSync(FONT_SOURCE)) {
    throw new Error(`Missing ${FONT_SOURCE}; run npm run font:subset first`);
  }
  const sourceFont = fs.readFileSync(FONT_SOURCE);

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const started = Date.now();
  const images: OgCacheManifest["images"] = [];
  for (const { slug } of getAllPoems()) {
    const png = await renderPoemCard(slug, sourceFont);
    const publicPath = poemOgImagePath(slug);
    fs.writeFileSync(path.join(PUBLIC_DIR, publicPath), png);
    images.push({ path: publicPath, bytes: png.byteLength });
  }

  writeCacheManifest(MANIFEST_OUT, {
    inputsHash,
    generatorVersion: GENERATOR_VERSION,
    images,
  } satisfies OgCacheManifest);

  const totalKiB = images.reduce((sum, image) => sum + image.bytes, 0) / 1024;
  console.log(
    `Generated ${images.length} OG images: ${totalKiB.toFixed(0)} KiB in ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
