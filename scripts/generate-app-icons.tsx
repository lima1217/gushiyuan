/**
 * 生成站点图标：纸色满底 + 朱砂方印，印内白文「源」（霞鹜文楷）。
 *
 * 图标须为不透明满底方图，交由 iOS / Android 自行加遮罩，避免白圈。
 * 非构建步骤；改设计后手动运行 `npx tsx scripts/generate-app-icons.tsx` 并提交产物。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import subsetFont from "subset-font";
import { SITE_THEME_COLOR } from "../src/lib/site-identity";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONT_SOURCE = path.join(ROOT, "scripts/fonts/LXGWWenKai-Regular.ttf");

const GLYPH = "源";
/** 朱砂印泥色。 */
const SEAL = "#b23a2a";

const OUTPUTS: { size: number; sealRatio: number; file: string }[] = [
  { size: 192, sealRatio: 0.82, file: "src/app/icon.png" },
  { size: 180, sealRatio: 0.82, file: "src/app/apple-icon.png" },
  { size: 512, sealRatio: 0.82, file: "public/icon-512.png" },
  // maskable 安全区约为中心 80% 圆，方印对角线须落在其内。
  { size: 512, sealRatio: 0.56, file: "public/icon-maskable-512.png" },
];

async function renderIcon(size: number, sealRatio: number, font: Buffer): Promise<Buffer> {
  const seal = Math.round(size * sealRatio);
  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: SITE_THEME_COLOR,
        }}
      >
        <div
          style={{
            width: seal,
            height: seal,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: SEAL,
            borderRadius: seal * 0.07,
            color: SITE_THEME_COLOR,
            fontFamily: "WenKai",
            fontSize: seal * 0.84,
            lineHeight: 1,
            // 文楷字面略偏上，下压使字形视觉居中。
            paddingTop: seal * 0.06,
          }}
        >
          {GLYPH}
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: "WenKai", data: font, weight: 400, style: "normal" }],
    },
  );
  // ImageResponse 输出 RGBA；拍平为 RGB，杜绝透明角。
  return sharp(Buffer.from(await response.arrayBuffer()))
    .flatten({ background: SITE_THEME_COLOR })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main(): Promise<void> {
  if (!fs.existsSync(FONT_SOURCE)) {
    throw new Error(`missing ${path.relative(ROOT, FONT_SOURCE)}; run npm run font:subset first`);
  }
  const font = await subsetFont(fs.readFileSync(FONT_SOURCE), GLYPH, {
    targetFormat: "truetype",
  });
  for (const { size, sealRatio, file } of OUTPUTS) {
    fs.writeFileSync(path.join(ROOT, file), await renderIcon(size, sealRatio, font));
    console.log(`wrote ${file} (${size}x${size})`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
