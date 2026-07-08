import type { Metadata } from "next";
import { SiteChrome } from "@/components/SiteChrome";
import { buildSearchIndex } from "@/lib/search-index";
import {
  createPageMetadata,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site-metadata";
import { preloadWenkaiSubset } from "@/lib/wenkai-font";
import "./globals.css";

export const metadata: Metadata = createPageMetadata({
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  preloadWenkaiSubset();
  const searchIndex = buildSearchIndex();

  return (
    <html lang="zh-CN">
      <body>
        <SiteChrome searchIndex={searchIndex} />
        {children}
      </body>
    </html>
  );
}
