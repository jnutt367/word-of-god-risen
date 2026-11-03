"use client";

import Link from "next/link";
import { useProgress } from "@/components/ProgressProvider";
import { BOOKS, bookBySlug } from "@/data/books";

export default function ContinueReading() {
  const { last, totalRead } = useProgress();

  if (!last) return null;
  const book = bookBySlug(last.slug);

  // If the last-read chapter is the book's final chapter, roll forward:
  // the card names the next book in canonical order and links to its
  // first chapter, instead of landing back in the finished chapter.
  // Revelation is the last entry in BOOKS, so it has no next book and
  // keeps the plain link to the chapter itself.
  const nextBook =
    book && last.idx >= book.chapters - 1
      ? BOOKS[BOOKS.indexOf(book) + 1]
      : undefined;

  const label = nextBook ? nextBook.title : book ? book.title : last.slug;
  const href = nextBook
    ? `/book/${nextBook.slug}/0`
    : `/book/${last.slug}/${last.idx}`;

  return (
    <section
      aria-label="Continue reading"
      className="flex flex-col items-center gap-3 rounded-2xl border border-gold-500/25 bg-gradient-to-br from-vineyard-800 to-vineyard-900 p-6 text-center sm:flex-row sm:justify-between sm:text-left"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-400">
          Continue reading
        </p>
        <p className="mt-2 font-display text-xl text-cream-100">
          {label}
          {!nextBook && last.title ? (
            <span className="text-sage-300"> — {last.title}</span>
          ) : null}
        </p>
        <p className="mt-1 text-sm text-sage-400">
          You&rsquo;ve read {totalRead} chapter{totalRead === 1 ? "" : "s"} so
          far. Keep going.
        </p>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-lg bg-gold-500 px-5 py-3 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400"
      >
        Pick up where you left off →
      </Link>
    </section>
  );
}
