import { describe, expect, it } from "vitest";
import { buildSitemapEntries, SITE_URL } from "./site-metadata";
import { getAllPoems, getAllVolumes } from "./poems";

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
    const seen = new Set<string>();

    for (const poem of getAllPoems()) {
      const key = `${poem.volume}/${poem.authorSlug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      expect(urls.has(`${SITE_URL}/v/${poem.volume}/${poem.authorSlug}`)).toBe(
        true,
      );
    }
  });
});
