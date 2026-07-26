import { describe, expect, it } from "vitest";
import { catalogNavAriaLabel } from "@/lib/catalog-nav-label";
import { formatSiteUiCount } from "@/lib/format-site-ui-count";
import { buildSiteUiText, makeTextVariant } from "@/lib/script-conversion";

describe("catalogNavAriaLabel", () => {
  it("composes volume author nav names in both script variants", () => {
    const uiText = buildSiteUiText();
    const volumeName = makeTextVariant("古逸");

    expect(
      catalogNavAriaLabel(volumeName, uiText.volumeAuthorsAria, "simplified"),
    ).toBe("古逸诗人");
    expect(
      catalogNavAriaLabel(volumeName, uiText.volumeAuthorsAria, "traditional"),
    ).toBe("古逸詩人");
  });

  it("composes author poem nav names in both script variants", () => {
    const uiText = buildSiteUiText();
    const authorName = makeTextVariant("陶渊明");

    expect(
      catalogNavAriaLabel(authorName, uiText.authorPoemsAria, "simplified"),
    ).toBe("陶渊明诗作");
    expect(
      catalogNavAriaLabel(authorName, uiText.authorPoemsAria, "traditional"),
    ).toBe("陶淵明詩作");
  });
});

describe("poemCountLabel", () => {
  it("formats poem counts with a script-aware unit", () => {
    const uiText = buildSiteUiText();

    expect(formatSiteUiCount(uiText.poemCountLabel.simplified, 3)).toBe(
      "3 首",
    );
    expect(formatSiteUiCount(uiText.poemCountLabel.traditional, 3)).toBe(
      "3 首",
    );
  });
});
