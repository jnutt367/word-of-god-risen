"use client";

import Link from "next/link";
import { useProgress } from "@/components/ProgressProvider";
import { BOOKS, bookBySlug } from "@/data/books";

/**
 * The pick-up band (Jason, Nov 11, 2026): "It's really difficult to
 * find pick up where you left off on the app." The remembering was
 * never the problem — the app always knew — the door to it was: the
 * old ContinueReading card rested deep in the widgets column, far
 * under the hero, named only the single last book, and offered a
 * read door but no listen door. This band carries that same place
 * to the very top of the homepage, the first thing a returning
 * reader meets under the hero, with two big doors — Read and
 * Listen — and room for the other books the reader has open.
 *
 * Data is the reader's own saved progress and nothing else: the
 * same on-device progress map behind the book pages' resume
 * strips. No accounts, no new storage, nothing counted anywhere.
 * With no saved progress it renders nothing at all — a first
 * visit belongs to the hero and the arrow tour.
 *
 * A "place" points at the chapter the reader last left that book
 * on (the old card's behavior, kept). The roll-forward kindness is
 * kept too: if that chapter was the book's last, the place becomes
 * the next book's chapter 1 instead of a finished chapter — except
 * at the very end of the visible books, where the place stays.
 *
 * Places after the first: every other book the reader has started
 * but not finished (hidden books never list here — they are hidden
 * from every listing surface). Their order is each book's own most
 * recent saved read — the progress map stamps every chapter read
 * with its time, so this is the record's own recency, nothing
 * inferred. At most two ride along under the main place.
 */

interface Place {
  /** Target book slug (after any roll-forward). */
  slug: string;
  /** Target book title for the name line. */
  name: string;
  /** Target chapter index (0-based). */
  idx: number;
  /** The saved title of the chapter left off at; "" when rolled
   *  forward into a book not yet opened. */
  chapterTitle: string;
}

export default function PickupBand() {
  const { map, last, totalRead } = useProgress();

  if (!last) return null;

  const visibleBooks = BOOKS.filter((b) => !b.hidden);

  // The main place — the old card's exact logic, carried to the top:
  // the most recent chapter read anywhere, rolled forward to the
  // next book's first chapter when it was its book's last chapter.
  const lastBook = bookBySlug(last.slug);
  const nextBook =
    lastBook && last.idx >= lastBook.chapters - 1
      ? visibleBooks[visibleBooks.indexOf(lastBook) + 1]
      : undefined;
  const primary: Place = nextBook
    ? { slug: nextBook.slug, name: nextBook.title, idx: 0, chapterTitle: "" }
    : {
        slug: last.slug,
        name: lastBook ? lastBook.title : last.slug,
        idx: last.idx,
        chapterTitle: last.title,
      };

  // The other open books, from the same map: group each book's
  // saved chapters, keep its most recent one as the place, and
  // order the books by that most recent read.
  const bySlug = new Map<
    string,
    { idx: number; title: string; at: number; count: number }
  >();
  for (const [key, entry] of Object.entries(map)) {
    const sep = key.lastIndexOf("::");
    if (sep < 0) continue;
    const slug = key.slice(0, sep);
    const idx = parseInt(key.slice(sep + 2), 10);
    if (Number.isNaN(idx)) continue;
    const at = entry.at || 0;
    const cur = bySlug.get(slug);
    if (!cur) {
      bySlug.set(slug, { idx, title: entry.title || "", at, count: 1 });
    } else {
      cur.count += 1;
      if (at >= cur.at) {
        cur.idx = idx;
        cur.title = entry.title || "";
        cur.at = at;
      }
    }
  }

  const taken = new Set([primary.slug]);
  const others: Place[] = [];
  const candidates = [...bySlug.entries()]
    .filter(([slug]) => slug !== last.slug)
    .sort((a, b) => b[1].at - a[1].at);
  for (const [slug, info] of candidates) {
    if (others.length >= 2) break;
    const book = bookBySlug(slug);
    if (!book || book.hidden) continue;
    if (info.count >= book.chapters) continue; // finished — no place to keep
    let place: Place = {
      slug,
      name: book.title,
      idx: info.idx,
      chapterTitle: info.title,
    };
    if (info.idx >= book.chapters - 1) {
      const nb = visibleBooks[visibleBooks.indexOf(book) + 1];
      if (nb) {
        place = { slug: nb.slug, name: nb.title, idx: 0, chapterTitle: "" };
      }
    }
    if (taken.has(place.slug)) continue;
    taken.add(place.slug);
    others.push(place);
  }

  const doors = (place: Place, big: boolean) => (
    <div className={`flex gap-2.5 ${big ? "w-full sm:w-auto" : "shrink-0"}`}>
      <Link
        href={`/book/${place.slug}/${place.idx}`}
        aria-label={`Read ${place.name} chapter ${place.idx + 1}`}
        className={`flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gold-500 font-semibold text-vineyard-950 transition-colors hover:bg-gold-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 ${
          big ? "flex-1 px-6 text-base sm:flex-none" : "px-4 text-sm"
        }`}
      >
        <span aria-hidden="true">📖</span> Read
      </Link>
      <Link
        href={`/book/${place.slug}/${place.idx}?autoplay=1`}
        aria-label={`Listen to ${place.name} chapter ${place.idx + 1} — Grandpa Teddy reads it aloud`}
        className={`flex min-h-12 items-center justify-center gap-2 rounded-lg border border-gold-400/60 font-semibold text-gold-300 transition-colors hover:border-gold-300 hover:text-gold-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 ${
          big ? "flex-1 px-6 text-base sm:flex-none" : "px-4 text-sm"
        }`}
      >
        <span aria-hidden="true">🔊</span> Listen
      </Link>
    </div>
  );

  const placeName = (place: Place) => (
    <>
      {place.name} <span className="text-sage-300">— chapter {place.idx + 1}</span>
      {place.chapterTitle ? (
        <span className="block text-sm font-normal text-sage-400">
          {place.chapterTitle}
        </span>
      ) : null}
    </>
  );

  return (
    <section
      aria-label="Pick up where you left off"
      className="mx-auto max-w-4xl px-4 pt-6 sm:px-6"
    >
      <div className="rounded-2xl border border-gold-500/25 bg-gradient-to-br from-vineyard-800 to-vineyard-900 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-400">
          Pick up where you left off
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-xl leading-snug text-cream-100">
            {placeName(primary)}
          </p>
          {doors(primary, true)}
        </div>
        <p className="mt-3 text-sm text-sage-400">
          You&rsquo;ve read {totalRead} chapter{totalRead === 1 ? "" : "s"} so
          far. Keep going.
        </p>
        {others.length > 0 && (
          <ul className="mt-4 space-y-3 border-t border-cream-100/10 pt-4">
            {others.map((place) => (
              <li
                key={place.slug}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
              >
                <p className="font-display text-base leading-snug text-cream-100">
                  {placeName(place)}
                </p>
                {doors(place, false)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
