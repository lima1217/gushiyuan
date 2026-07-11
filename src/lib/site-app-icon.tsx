import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const SITE_APP_ICON_PAPER = "#faf8f4";
export const SITE_APP_ICON_INK = "#2c2a26";

const ICON_FONT_PATH = path.join(
  process.cwd(),
  "scripts/.cache/wenkai-icon-title.ttf",
);

const TITLE_CHARS = ["古", "詩", "源"] as const;

async function loadWenkaiIconFont(): Promise<Buffer> {
  try {
    return await readFile(ICON_FONT_PATH);
  } catch {
    throw new Error(
      `Missing ${ICON_FONT_PATH}. Run \`npm run font:icon\` (or \`npm run build\`) first.`,
    );
  }
}

export async function createSiteAppIcon(size: number): Promise<ImageResponse> {
  const fontData = await loadWenkaiIconFont();
  const fontSize = Math.round(size * 0.26);
  const gap = Math.round(size * 0.02);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: SITE_APP_ICON_PAPER,
          fontFamily: "LXGW WenKai",
          fontSize,
          color: SITE_APP_ICON_INK,
          lineHeight: 1,
          gap,
        }}
      >
        {TITLE_CHARS.map((char) => (
          <span key={char}>{char}</span>
        ))}
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [
        {
          name: "LXGW WenKai",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
