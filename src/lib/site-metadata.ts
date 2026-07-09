import type { Metadata } from "next";
import type { MetadataRoute } from "next";
import { getAllPoems, getAllVolumes } from "@/lib/poems";

export const SITE_URL = "https://gsy.aiwayfarer.net";
export const SITE_NAME = "古诗源";
export const SITE_DESCRIPTION = "清·沈德潜《古诗源》—— 唐前诗的源头";
export const OG_IMAGE_PATH = "/og.png";

const ogImage = {
  url: OG_IMAGE_PATH,
  width: 1200,
  height: 630,
  alt: SITE_NAME,
};

export function createPageMetadata(metadata: Metadata): Metadata {
  const title =
    typeof metadata.title === "string" ? metadata.title : SITE_NAME;
  const description =
    typeof metadata.description === "string"
      ? metadata.description
      : SITE_DESCRIPTION;

  return {
    ...metadata,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      locale: "zh_CN",
      type: "website",
      images: [ogImage],
      ...metadata.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE_PATH],
      ...metadata.twitter,
    },
  };
}

export function buildSitemapEntries(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [{ url: `${SITE_URL}/` }];

  for (const poem of getAllPoems()) {
    entries.push({ url: `${SITE_URL}/p/${poem.slug}` });
  }

  for (const volume of getAllVolumes()) {
    entries.push({ url: `${SITE_URL}/v/${volume.slug}` });
  }

  const authorKeys = new Set<string>();
  for (const poem of getAllPoems()) {
    const key = `${poem.volume}/${poem.authorSlug}`;
    if (authorKeys.has(key)) continue;
    authorKeys.add(key);
    entries.push({ url: `${SITE_URL}/v/${poem.volume}/${poem.authorSlug}` });
  }

  return entries;
}
