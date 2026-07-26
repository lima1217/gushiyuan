import { describe, expect, it } from "vitest";
import { languageToggleActionLabel } from "@/lib/language-toggle-label";

const labels = {
  languageSimplified: { simplified: "简体", traditional: "簡體" },
  languageTraditional: { simplified: "繁体", traditional: "繁體" },
};

describe("languageToggleActionLabel", () => {
  it("shows the traditional target glyph while in simplified mode", () => {
    expect(languageToggleActionLabel("simplified", labels)).toBe("繁體");
  });

  it("shows the simplified target glyph while in traditional mode", () => {
    expect(languageToggleActionLabel("traditional", labels)).toBe("简体");
  });
});
