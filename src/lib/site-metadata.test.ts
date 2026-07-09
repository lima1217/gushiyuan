import { describe, expect, it } from "vitest";
import {
  buildSitemapEntries,
  SITE_DESCRIPTION,
  SITE_URL,
} from "./site-metadata";
import { getAllPoems, getAllVolumes, getAuthorsByVolume } from "./poems";

describe("SITE_DESCRIPTION", () => {
  it("uses simplified Chinese for site metadata", () => {
    expect(SITE_DESCRIPTION).not.toMatch(/[潛詩頭]/);
    expect(SITE_DESCRIPTION).toContain("沈德潜");
    expect(SITE_DESCRIPTION).toContain("古诗源");
  });
});

describe("buildSitemapEntries", () => {
  it("includes the home page", () => {
    const urls = buildSitemapEntries().map((entry) => entry.url);

    expect(urls).toContain(`${SITE_URL}/`);
  });

  it("includes every poem and volume page", () => {
    const urls = new Set(buildSitemapEntries().map((entry) => entry.url));

    for (const poem of getAllPoems()) {
      expect(urls.has(`${SITE_URL}/p/${poem.slug}`)).toBe(true);
    }

    for (const volume of getAllVolumes()) {
      expect(urls.has(`${SITE_URL}/v/${volume.slug}`)).toBe(true);
    }
  });

  it("includes author catalog pages under each volume", () => {
    const urls = new Set(buildSitemapEntries().map((entry) => entry.url));

    for (const volume of getAllVolumes()) {
      for (const author of getAuthorsByVolume(volume.slug)) {
        expect(urls.has(`${SITE_URL}/v/${volume.slug}/${author.slug}`)).toBe(
          true,
        );
      }
    }
  });
});
