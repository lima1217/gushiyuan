import type { Metadata } from "next";
import type { MetadataRoute } from "next";
import { getAllPoems, getAllVolumes, getAuthorsByVolume } from "@/lib/poems";
import {
  OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site-identity";

export {
  OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site-identity";

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

  for (const volume of getAllVolumes()) {
    for (const author of getAuthorsByVolume(volume.slug)) {
      entries.push({
        url: `${SITE_URL}/v/${volume.slug}/${author.slug}`,
      });
    }
  }

  return entries;
}
