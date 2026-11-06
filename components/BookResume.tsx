"use client";

import Link from "next/link";
import { useProgress } from "@/components/ProgressProvider";

/**
 * The resume strip (Nov 6, 2026 — Jason's ask): on a book's own page,
 * when this book holds the reader's most recent chapter, offer the
 * jump right at the top — "Continue in Genesis 30 →" — instead of
 * scrolling the whole chapter grid to find your place. Renders
 * nothing when this book is not the last-read book, or when the
 * recorded chapter no longer exists in this book's chapter list.
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
  const { last } = useProgress();
  if (!last || last.slug !== slug) return null;
  if (last.idx < 0 || last.idx >= total) return null;
  return (
    <Link
      href={`/book/${slug}/${last.idx}`}
      className="mt-6 flex min-h-11 items-center justify-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-5 py-2.5 text-center text-sm font-semibold text-gold-300 transition-colors hover:border-gold-400/70 hover:text-gold-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
    >
      Continue in {bookTitle} {last.idx + 1} →
    </Link>
  );
}
