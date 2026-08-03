import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

/** Minimal PNG IHDR reader (width, height, color type). */
function readPngIhdr(filePath: string): {
  width: number;
  height: number;
  colorType: number;
} {
  const buf = fs.readFileSync(filePath);
  expect(buf.subarray(0, 8).toString("binary")).toBe(
    "\x89PNG\r\n\x1a\n",
  );
  // IHDR is the first chunk
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const colorType = buf[25]!;
  return { width, height, colorType };
}

describe("app icons for home screen", () => {
  it("ships full-bleed opaque RGB icons (no alpha / pre-masked corners)", () => {
    const icons = [
      { rel: "src/app/icon.png", size: 192 },
      { rel: "src/app/apple-icon.png", size: 180 },
      { rel: "public/icon-512.png", size: 512 },
      { rel: "public/icon-maskable-512.png", size: 512 },
    ] as const;

    for (const { rel, size } of icons) {
      const filePath = path.join(ROOT, rel);
      expect(fs.existsSync(filePath), rel).toBe(true);
      const { width, height, colorType } = readPngIhdr(filePath);
      expect(width, rel).toBe(size);
      expect(height, rel).toBe(size);
      // 2 = RGB (opaque). 6 = RGBA would reintroduce transparent corners.
      expect(colorType, `${rel} should be opaque RGB`).toBe(2);
    }
  });
});
