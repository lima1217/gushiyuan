import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  formatUnicodeRange,
  sliceCodePoints,
} from "../../scripts/generate-font-subset";
import { collectSiteFontGlyphs } from "@/lib/font-glyphs";
import { WENKAI_SUBSET_PATHS } from "@/lib/wenkai-subset-path.generated";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const VALIDATE_SCRIPT = path.join(ROOT, "scripts/validate-subset-cmap.py");
const MANIFEST_PATH = path.join(ROOT, "scripts/.cache/wenkai.manifest.json");

function resolvePython(): string {
  const venvPython = path.join(ROOT, ".venv-font/bin/python3");
  if (fs.existsSync(venvPython)) {
    return venvPython;
  }
  return "python3";
}

function pythonAvailable(): boolean {
  try {
    execFileSync(resolvePython(), ["-c", "import fontTools"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

describe("font subset slicing helpers", () => {
  it("sliceCodePoints buckets by size", () => {
    expect(sliceCodePoints([1, 2, 3, 4, 5], 2)).toEqual([
      [1, 2],
      [3, 4],
      [5],
    ]);
  });

  it("formatUnicodeRange merges consecutive code points", () => {
    expect(formatUnicodeRange([0x41, 0x42, 0x43, 0x45])).toBe(
      "U+0041-0043, U+0045",
    );
  });
});

describe("font subset", () => {
  it("exports multi-slice paths matching wenkai-subset.<index>.<count>.woff2", () => {
    expect(WENKAI_SUBSET_PATHS.length).toBeGreaterThan(1);
    for (const [index, publicPath] of WENKAI_SUBSET_PATHS.entries()) {
      expect(publicPath).toMatch(
        new RegExp(`^/fonts/wenkai/wenkai-subset\\.${index}\\.\\d+\\.woff2$`),
      );
    }
  });

  it.skipIf(!pythonAvailable())(
    "each woff2 slice cmap covers its glyph bucket",
    () => {
      const glyphs = collectSiteFontGlyphs();
      const slices = sliceCodePoints(glyphs);

      expect(WENKAI_SUBSET_PATHS.length).toBe(slices.length);

      for (const [index, publicPath] of WENKAI_SUBSET_PATHS.entries()) {
        const fontPath = path.join(ROOT, "public", publicPath);
        expect(fs.existsSync(fontPath), `missing subset font at ${fontPath}`).toBe(
          true,
        );

        execFileSync(resolvePython(), [VALIDATE_SCRIPT, fontPath], {
          input: JSON.stringify(slices[index]),
          stdio: ["pipe", "inherit", "inherit"],
        });
      }

      if (fs.existsSync(MANIFEST_PATH)) {
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as {
          totalBytes: number;
        };
        expect(manifest.totalBytes).toBeLessThanOrEqual(1536 * 1024);
      }
    },
  );
});
