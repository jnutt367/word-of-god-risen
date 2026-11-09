"use client";

import Link from "next/link";
import { useProgress } from "@/components/ProgressProvider";

/**
 * The My Highlights door on the home page — it rests in the widgets
 * column beside Verse of the Day, Continue Reading and the plan
 * card, and appears only once the reader has marked a verse (the
 * same honesty as ContinueReading, which waits for a first read).
 * Before that, the reader teaches the tap where it belongs: inside
 * the chapter, above the verses.
 */
export default function HighlightsCard() {
  const { totalHighlights } = useProgress();

  if (totalHighlights === 0) return null;

  return (
    <section
      aria-label="My highlights"
      className="flex flex-col items-center gap-3 rounded-2xl border border-gold-500/25 bg-gradient-to-br from-vineyard-800 to-vineyard-900 p-6 text-center sm:flex-row sm:justify-between sm:text-left"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-400">
          My highlights
        </p>
        <p className="mt-2 font-display text-xl text-cream-100">
          {totalHighlights} mark{totalHighlights === 1 ? "" : "s"} you&rsquo;ve
          made
        </p>
        <p className="mt-1 text-sm text-sage-400">
          Gathered in one place, kept on this phone.
        </p>
      </div>
      <Link
        href="/highlights"
        className="shrink-0 rounded-lg bg-gold-500 px-5 py-3 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400"
      >
        See my highlights →
      </Link>
    </section>
  );
}
