"use client";

import Link from "next/link";
import { useProgress } from "@/components/ProgressProvider";

/**
 * The resume strip (Nov 6, 2026 — Jason's ask; reworked Nov 7 to his
 * refinement): on a book's own page, when the reader has read some of
 * this book but not all of it, offer the jump right at the top —
 * "Continue in Genesis 31 →" — to the FIRST chapter of this book they
 * have not read yet, instead of scrolling the whole chapter grid to
 * find their place. Works per book, from this book's own read marks
 * (the same marks behind the book's % finished). Renders nothing when
 * the book is untouched (nothing to resume) or fully read (nothing
 * left to point to).
 */
export default function BookResume({
  slug,
  bookTitle,
  total,
}: {
  slug: string;
  bookTitle: string;
  total: number;
}) {
  const { readOnPage } = useProgress();
  const read = new Set(readOnPage(slug));
  if (read.size === 0 || read.size >= total) return null;
  let next = 0;
  while (next < total && read.has(next)) next++;
  if (next >= total) return null;
  return (
    <Link
      href={`/book/${slug}/${next}`}
      className="mt-6 flex min-h-11 items-center justify-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-5 py-2.5 text-center text-sm font-semibold text-gold-300 transition-colors hover:border-gold-400/70 hover:text-gold-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
    >
      Continue in {bookTitle} {next + 1} →
    </Link>
  );
}
