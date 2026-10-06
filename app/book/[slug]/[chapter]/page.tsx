import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllSlugs,
  getBook,
  getChapters,
  getAvailableVersions,
  DEFAULT_VERSION,
  type BibleVersion,
} from "@/lib/bible";
import { parseVerses, type Verse } from "@/lib/verses";
import { getCrossRefs, refsForChapter } from "@/lib/crossrefs";
import { getVideosForChapter } from "@/lib/videos";
import ReaderView from "@/components/ReaderView";

export function generateStaticParams() {
  const params: { slug: string; chapter: string }[] = [];
  for (const slug of getAllSlugs()) {
    // chapter count is data-driven; generate lazily at request time instead.
    // (Static export would enumerate here — see note below.)
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}): Promise<Metadata> {
  const { slug, chapter } = await params;
  const book = getBook(slug);
  const chapters = book ? await getChapters(slug) : [];
  const idx = parseInt(chapter, 10);
  const ch = chapters[idx];
  const chapterNum = ch ? ch.ch ?? idx + 1 : idx + 1;
  return {
    title: book && ch ? `${book.title} ${chapterNum}` : "Reading",
  };
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}) {
  const { slug, chapter } = await params;
  const book = getBook(slug);
  if (!book) notFound();

  const chapters = await getChapters(slug);
  const idx = parseInt(chapter, 10);
  if (Number.isNaN(idx) || idx < 0 || idx >= chapters.length) notFound();
  const ch = chapters[idx];
  // Real chapter number (usually idx+1; data files may carry explicit `ch`).
  const chapterNum = ch.ch ?? idx + 1;

  // All available translations, parsed up front — switching versions is
  // instant and client-side, no refetch.
  const versions: BibleVersion[] = await getAvailableVersions(slug);
  const versesByVersion: Record<string, Verse[]> = {};
  for (const v of versions) {
    const vChapters =
      v.id === DEFAULT_VERSION ? chapters : await getChapters(slug, v.id);
    const vCh = vChapters[idx];
    versesByVersion[v.id] = parseVerses(vCh ? vCh.text : ch.text);
  }

  const allRefs = await getCrossRefs();
  const crossRefs = refsForChapter(allRefs, book.title, chapterNum);
  const videos = getVideosForChapter(slug, idx);

  return (
    <ReaderView
      slug={slug}
      bookTitle={book.title}
      chapterIdx={idx}
      chapterNum={chapterNum}
      chapterTitle={ch.title}
      image={ch.image}
      versesByVersion={versesByVersion}
      versions={versions}
      defaultVersion={DEFAULT_VERSION}
      crossRefs={crossRefs}
      videos={videos}
      prevIdx={idx > 0 ? idx - 1 : null}
      nextIdx={idx < chapters.length - 1 ? idx + 1 : null}
    />
  );
}
