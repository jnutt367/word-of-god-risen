"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import VerseText from "@/components/VerseText";
import CrossRefPanel from "@/components/CrossRefPanel";
import WatchCard from "@/components/WatchCard";
import FilmCard from "@/components/FilmCard";
import ListenButton from "@/components/ListenButton";
import ListenedMarkButton from "@/components/ListenedMarkButton";
import { useProgress } from "@/components/ProgressProvider";
import { beatRead, beatBookComplete } from "@/lib/heartbeat";
import { getBook } from "@/lib/bible-client";
import { VERSION_STORAGE_KEY } from "@/lib/versions";
import type { Verse } from "@/lib/verses";
import type { ChapterVideo } from "@/lib/videos";
import type { ChapterFilm } from "@/lib/films";

interface VersionInfo {
  id: string;
  label: string;
  name: string;
}

/* Word size — three steps, normal first. The reader's own browser
 * remembers the choice, the same way it remembers their translation.
 * Steps are rem sizes for the verse text in VerseText. */
const TEXT_SIZE_KEY = "wogr:text-size";
const TEXT_SIZES_REM = [1.18, 1.42, 1.68];

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
  film: ChapterFilm | null;
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
  film,
  prevIdx,
  nextIdx,
}: Props) {
  const [lamp, setLamp] = useState(false);
  const [version, setVersion] = useState(defaultVersion);
  const [textSizeIdx, setTextSizeIdx] = useState(0);
  // Set (read-only) by ListenButton when the narration finishes on its
  // own — keyed to the chapter so a new chapter never shows a leftover
  // line. Drives the one plain chapter-end line in the actions area.
  const [endedKey, setEndedKey] = useState<string | null>(null);
  const chapterKey = `${slug}:${chapterIdx}`;
  const narrationEnded = endedKey === chapterKey;
  const handleEndedChange = (ended: boolean) =>
    setEndedKey(ended ? chapterKey : null);
  const searchParams = useSearchParams();
  const autoplay = searchParams.get("autoplay") === "1";
  const [openRef, setOpenRef] = useState<{
    verseN: number;
    ref: string;
    targets: string[];
  } | null>(null);
  const { isRead, toggle, isListened, toggleListened, readOnPage } =
    useProgress();
  const read = isRead(slug, chapterIdx);
  const listened = isListened(slug, chapterIdx);
  const router = useRouter();

  // Bible Heartbeat: opening a chapter is one anonymous beat (deduped
  // per session inside lib/heartbeat).
  useEffect(() => {
    beatRead(slug, chapterIdx);
  }, [slug, chapterIdx]);

  const onToggleRead = () => {
    const readBefore = readOnPage(slug).length;
    const nowRead = toggle(slug, chapterIdx, chapterTitle);
    if (nowRead) {
      beatRead(slug, chapterIdx);
      // Finishing the last unread chapter of a book = one book beat.
      const total = getBook(slug)?.chapters ?? 0;
      if (total > 0 && readBefore + 1 >= total) beatBookComplete(slug);
    }
  };

  // ---- Reading progress bar ----
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = progressRef.current;
      if (!el) return;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      el.style.transform = `scaleX(${pct})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // ---- Swipe between chapters (mobile) ----
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Only horizontal swipes: horizontal distance must dominate vertical
    // and exceed the minimum threshold.
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && nextIdx !== null) {
      router.push(`/book/${slug}/${nextIdx}`);
    } else if (dx > 0 && prevIdx !== null) {
      router.push(`/book/${slug}/${prevIdx}`);
    }
  };

  // Restore the reader's preferred translation and word size.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VERSION_STORAGE_KEY);
      if (saved && versesByVersion[saved]) setVersion(saved);
      const savedSize = parseInt(localStorage.getItem(TEXT_SIZE_KEY) || "", 10);
      if (savedSize >= 0 && savedSize < TEXT_SIZES_REM.length)
        setTextSizeIdx(savedSize);
    } catch {
      /* storage unavailable — stay on defaults */
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

  const changeTextSize = (idx: number) => {
    const next = Math.min(TEXT_SIZES_REM.length - 1, Math.max(0, idx));
    setTextSizeIdx(next);
    try {
      localStorage.setItem(TEXT_SIZE_KEY, String(next));
    } catch {
      /* ignore */
    }
  };

  const verses = versesByVersion[version] ?? versesByVersion[defaultVersion];

  return (
    <div
      className={`reader-theme ${lamp ? "lamp" : ""} min-h-screen bg-[var(--reader-bg)] transition-colors`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Reading progress bar */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-50 h-1 w-full origin-left bg-[var(--reader-verse-num)]"
        style={{ transform: "scaleX(0)" }}
        ref={progressRef}
      />
      {/* Extra bottom room so the floating Listen bar never covers text */}
      <div className="mx-auto max-w-3xl px-4 pb-36 pt-8 sm:px-6 sm:pt-12">
        {/* Top bar — on phones the controls get their own full-width
            row of 48px targets (WCAG exam item A, Oct 19); from sm up
            the bar returns to its compact one-line self. */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/book/${slug}`}
            className="-my-2 inline-flex min-h-12 items-center py-2 text-sm font-medium text-[var(--reader-muted)] hover:text-[var(--reader-verse-num)] sm:min-h-0"
          >
            ← {bookTitle}
          </Link>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
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
                    className={`min-h-12 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors sm:min-h-0 sm:px-3 ${
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
              autoplay={autoplay}
              floating
              onEndedChange={handleEndedChange}
            />
            <button
              type="button"
              onClick={() => setLamp((v) => !v)}
              className="min-h-12 rounded-full border border-[var(--reader-line)] px-4 py-2 text-sm font-medium text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)] sm:min-h-0"
              aria-pressed={lamp}
            >
              {lamp ? "☾ Night" : "☀ Lamp"}
            </button>
            <div
              role="group"
              aria-label="Word size"
              className="flex rounded-full border border-[var(--reader-line)] p-0.5"
            >
              <button
                type="button"
                onClick={() => changeTextSize(textSizeIdx - 1)}
                disabled={textSizeIdx === 0}
                aria-label="Make the words smaller"
                title="Make the words smaller"
                className="min-h-12 rounded-full px-4 py-1.5 text-sm font-semibold text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)] disabled:opacity-40 disabled:hover:text-[var(--reader-muted)] sm:min-h-0 sm:px-3"
              >
                A−
              </button>
              <button
                type="button"
                onClick={() => changeTextSize(textSizeIdx + 1)}
                disabled={textSizeIdx === TEXT_SIZES_REM.length - 1}
                aria-label="Make the words bigger"
                title="Make the words bigger"
                className="min-h-12 rounded-full px-4 py-1.5 text-sm font-semibold text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)] disabled:opacity-40 disabled:hover:text-[var(--reader-muted)] sm:min-h-0 sm:px-3"
              >
                A+
              </button>
            </div>
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
              className="rounded-lg border border-[var(--reader-line)] px-4 py-3 text-sm font-medium text-[var(--reader-muted)] hover:text-[var(--reader-verse-num)]"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          {nextIdx !== null ? (
            <Link
              href={`/book/${slug}/${nextIdx}`}
              className="rounded-lg border border-[var(--reader-line)] px-4 py-3 text-sm font-medium text-[var(--reader-muted)] hover:text-[var(--reader-verse-num)]"
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
              alt={`${bookTitle} illustration`}
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

        {/* The chapter's animated film, beside the Listen controls */}
        <FilmCard film={film} />

        {/* Scripture */}
        <article>
          <VerseText
            verses={verses}
            bookTitle={bookTitle}
            chapterNum={chapterNum}
            fontSizeRem={TEXT_SIZES_REM[textSizeIdx]}
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
              onClick={onToggleRead}
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
          {/* The reader's own word, counted: for every listening the
              player cannot measure (device TTS above all). Its own
              beat, its own total — see ListenedMarkButton. */}
          <ListenedMarkButton bookSlug={slug} chapterIdx={chapterIdx} />
          <p className="text-center text-sm text-[var(--reader-muted)]">
            Your place is kept on this phone.
          </p>
          {narrationEnded && (
            <p
              role="status"
              className="text-center text-base font-medium text-[var(--reader-ink)]"
            >
              {nextIdx !== null
                ? `That's the end of ${bookTitle} ${chapterNum} — tap Next for ${bookTitle} ${chapterNum + 1} →`
                : `That's the end of ${bookTitle} ${chapterNum} — well done.`}
            </p>
          )}
          <nav
            className="flex w-full items-center justify-between gap-4"
            aria-label="Chapters"
          >
            {prevIdx !== null ? (
              <Link
                href={`/book/${slug}/${prevIdx}`}
                className="rounded-lg border border-[var(--reader-line)] px-4 py-3 text-sm font-medium text-[var(--reader-muted)] hover:text-[var(--reader-verse-num)]"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            {nextIdx !== null ? (
              <Link
                href={`/book/${slug}/${nextIdx}`}
                className="rounded-lg border border-[var(--reader-line)] px-4 py-3 text-sm font-medium text-[var(--reader-muted)] hover:text-[var(--reader-verse-num)]"
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
