import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPoemBySlug } from "@/lib/poems";
import { getAllStreamIds, getStreamContext } from "@/lib/lineage";
import { createPageMetadata } from "@/lib/site-metadata";

type PageProps = {
  params: Promise<{ streamId: string }>;
};

export function generateStaticParams() {
  const streamIds = getAllStreamIds();
  if (streamIds.length === 0) {
    return [{ streamId: "__none__" }];
  }
  return streamIds.map((streamId) => ({ streamId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { streamId } = await params;
  const context = getStreamContext(streamId);
  if (!context) {
    return { title: "古诗源" };
  }

  const { stream } = context;
  return createPageMetadata({
    title: `${stream.text.slice(0, 24)} · ${stream.author} · 古诗源`,
    description: stream.note,
  });
}

export default async function StreamPage({ params }: PageProps) {
  const { streamId } = await params;
  if (streamId === "__none__") {
    notFound();
  }
  const context = getStreamContext(streamId);
  if (!context) {
    notFound();
  }

  const { stream, clue } = context;
  const sourcePoem = getPoemBySlug(clue.source.poemSlug);
  if (!sourcePoem) {
    notFound();
  }

  const sourceLines = sourcePoem.body.split("\n").filter(Boolean);
  const sourceLine = sourceLines[clue.source.lineIndex] ?? "";
  const sourceHref = `/p/${clue.source.poemSlug}#line-${clue.source.lineIndex}`;

  return (
    <main
      id="main-content"
      className="lineage-page mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-8 py-16 md:px-12 md:py-24"
    >
      <p className="lineage-page__label">后世名句</p>
      <blockquote className="lineage-page__quote">{stream.text}</blockquote>
      <p className="lineage-page__meta">
        {stream.author}
        {stream.work ? ` · ${stream.work}` : ""}
      </p>
      <p className="lineage-page__source-ref">{stream.source}</p>
      <p className="lineage-page__relation">
        <span className="lineage-page__relation-tag">{stream.relation}</span>
        {stream.note}
      </p>

      <section className="lineage-page__source">
        <p className="lineage-page__source-label">源头</p>
        <Link href={sourceHref} className="lineage-page__source-link">
          <span className="lineage-page__source-line">{sourceLine}</span>
          <span className="lineage-page__source-meta">
            {sourcePoem.dynasty} · {sourcePoem.author} · {sourcePoem.title}
          </span>
        </Link>
      </section>
    </main>
  );
}
