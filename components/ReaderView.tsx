"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import VerseText from "@/components/VerseText";
import CrossRefPanel from "@/components/CrossRefPanel";
import WatchCard from "@/components/WatchCard";
import ListenButton from "@/components/ListenButton";
import { useProgress } from "@/components/ProgressProvider";
import { VERSION_STORAGE_KEY } from "@/lib/versions";
import type { Verse } from "@/lib/verses";
import type { ChapterVideo } from "@/lib/videos";

interface VersionInfo {
  id: string;
  label: string;
  name: string;
}

interface Props {
  slug: string;
  bookTitle: string;
  chapterIdx: number;
  chapterNum: number;
  chapterTitle: string;
  image: string;
  versesByVersion: Record<string, Verse[]>;
  versions: VersionInfo[];
  defaultVersion: string;
  crossRefs: Record<number, string[]>;
  videos: ChapterVideo[];
  prevIdx: number | null;
  nextIdx: number | null;
}

export default function ReaderView({
  slug,
  bookTitle,
  chapterIdx,
  chapterNum,
  chapterTitle,
  image,
  versesByVersion,
  versions,
  defaultVersion,
  crossRefs,
  videos,
  prevIdx,
  nextIdx,
}: Props) {
  const [lamp, setLamp] = useState(false);
  const [version, setVersion] = useState(defaultVersion);
  const [openRef, setOpenRef] = useState<{
    verseN: number;
    ref: string;
    targets: string[];
  } | null>(null);
  const { isRead, toggle, isListened, toggleListened } = useProgress();
  const read = isRead(slug, chapterIdx);
  const listened = isListened(slug, chapterIdx);

  // Restore the reader's preferred translation.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VERSION_STORAGE_KEY);
      if (saved && versesByVersion[saved]) setVersion(saved);
    } catch {
      /* storage unavailable — stay on default */
    }
  }, [versesByVersion]);

  const changeVersion = (id: string) => {
    setVersion(id);
    try {
      localStorage.setItem(VERSION_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const verses = versesByVersion[version] ?? versesByVersion[defaultVersion];

  return (
    <div className={`reader-theme ${lamp ? "lamp" : ""} min-h-screen bg-[var(--reader-bg)] transition-colors`}>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link
            href={`/book/${slug}`}
            className="text-sm font-medium text-[var(--reader-muted)] hover:text-[var(--reader-verse-num)]"
          >
            ← {bookTitle}
          </Link>
          <div className="flex items-center gap-2">
            {versions.length > 1 && (
              <div
                role="group"
                aria-label="Bible translation"
                className="flex rounded-full border border-[var(--reader-line)] p-0.5"
              >
                {versions.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => changeVersion(v.id)}
                    aria-pressed={version === v.id}
                    title={v.name}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      version === v.id
                        ? "bg-[var(--reader-verse-num)] text-[var(--reader-bg)]"
                        : "text-[var(--reader-muted)] hover:text-[var(--reader-verse-num)]"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}
            <ListenButton
              bookSlug={slug}
              bookTitle={bookTitle}
              chapterNum={chapterNum}
              verses={verses}
            />
            <button
              type="button"
              onClick={() => setLamp((v) => !v)}
              className="rounded-full border border-[var(--reader-line)] px-4 py-1.5 text-sm font-medium text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)]"
              aria-pressed={lamp}
            >
              {lamp ? "☾ Night" : "☀ Lamp"}
            </button>
          </div>
        </div>

        {/* Prev/Next at top */}
        <nav
          className="mb-6 flex w-full items-center justify-between gap-4"
          aria-label="Chapters"
        >
          {prevIdx !== null ? (
            <Link
              href={`/book/${slug}/${prevIdx}`}
              className="rounded-lg border border-[var(--reader-line)] px-4 py-2.5 text-sm font-medium text-[var(--reader-muted)] hover:text-[var(--reader-verse-num)]"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          {nextIdx !== null ? (
            <Link
              href={`/book/${slug}/${nextIdx}`}
              className="rounded-lg border border-[var(--reader-line)] px-4 py-2.5 text-sm font-medium text-[var(--reader-muted)] hover:text-[var(--reader-verse-num)]"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>

        {/* Chapter heading */}
        {image && (
          <div className="relative mb-8 aspect-[21/9] overflow-hidden rounded-2xl">
            <Image
              src={image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover object-top"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--reader-verse-num)]">
          {bookTitle}
        </p>
        <h1 className="mt-2 font-scripture text-3xl text-[var(--reader-ink)] sm:text-4xl">
          {chapterTitle || `Chapter ${chapterNum}`}
        </h1>
        <div className="vine-divider my-8" aria-hidden="true">
          <span>✦</span>
        </div>

        {/* Scripture */}
        <article>
          <VerseText
            verses={verses}
            bookTitle={bookTitle}
            chapterNum={chapterNum}
            crossRefs={crossRefs}
            onOpenRefs={(verseN, ref, targets) =>
              setOpenRef({ verseN, ref, targets })
            }
          />
        </article>

        {/* Actions */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => toggle(slug, chapterIdx, chapterTitle)}
              className={`rounded-lg px-6 py-3 text-sm font-semibold transition-colors ${
                read
                  ? "bg-[var(--reader-verse-num)]/15 text-[var(--reader-verse-num)] border border-[var(--reader-verse-num)]/40"
                  : "bg-[var(--reader-verse-num)] text-[var(--reader-bg)] hover:opacity-90"
              }`}
            >
              {read ? "✓ Read — tap to undo" : "✓ Mark as read"}
            </button>
            <button
              type="button"
              onClick={() => toggleListened(slug, chapterIdx, chapterTitle)}
              aria-pressed={listened}
              title="Mark this chapter as listened to (Grandpa Teddy's narration)"
              className={`rounded-lg px-6 py-3 text-sm font-semibold transition-colors border ${
                listened
                  ? "bg-[var(--reader-verse-num)]/15 text-[var(--reader-verse-num)] border-[var(--reader-verse-num)]/40"
                  : "border-[var(--reader-line)] text-[var(--reader-muted)] hover:text-[var(--reader-verse-num)] hover:border-[var(--reader-verse-num)]/40"
              }`}
            >
              {listened ? "🎧 Listened — tap to undo" : "🎧 Mark as listened"}
            </button>
          </div>
          <nav
            className="flex w-full items-center justify-between gap-4"
            aria-label="Chapters"
          >
            {prevIdx !== null ? (
              <Link
                href={`/book/${slug}/${prevIdx}`}
                className="rounded-lg border border-[var(--reader-line)] px-4 py-2.5 text-sm font-medium text-[var(--reader-muted)] hover:text-[var(--reader-verse-num)]"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            {nextIdx !== null ? (
              <Link
                href={`/book/${slug}/${nextIdx}`}
                className="rounded-lg border border-[var(--reader-line)] px-4 py-2.5 text-sm font-medium text-[var(--reader-muted)] hover:text-[var(--reader-verse-num)]"
              >
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>

        <WatchCard videos={videos} />
      </div>

      <CrossRefPanel openRef={openRef} onClose={() => setOpenRef(null)} />
    </div>
  );
}
