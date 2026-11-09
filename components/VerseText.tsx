"use client";

import { useEffect } from "react";
import { verseRef, type Verse } from "@/lib/verses";
import { highlightWash } from "@/lib/highlights";
import { useProgress } from "@/components/ProgressProvider";
import ShareVerseButton from "./ShareVerseButton";
import VerseActions from "./VerseActions";

interface Props {
  verses: Verse[];
  bookTitle: string;
  chapterNum: number;
  /** Verse text size in rem — the reader's "Bigger words" choice. */
  fontSizeRem?: number;
  /** verse number -> list of "Book C:V" strings */
  crossRefs: Record<number, string[]>;
  onOpenRefs: (verseN: number, ref: string, targets: string[]) => void;
  /** Book slug + chapter index — the highlight store's key parts.
   *  Absent (any other surface), verses render plain, as before. */
  slug?: string;
  chapterIdx?: number;
  /** Verse to scroll to and briefly flash — set by a deep link from
   *  the My Highlights page (?v=N). */
  focusVerse?: number | null;
}

/**
 * Renders a chapter as individual verses with gold verse numbers.
 * Verses that have cross-references get a ✦ marker that opens the
 * reference panel.
 *
 * Highlights (Nov 8, 2026 — a reader asked, Jason ruled): with slug
 * + chapterIdx present, tapping a verse's words marks it in soft
 * gold; tapping again takes the mark off. The tap lives on the
 * verse TEXT span only — the ✦ cross-reference chip, the ⤴ share
 * chip and the 🖍 marker chip stay their own buttons and never
 * toggle anything. The 🖍 chip opens the fuller ask: color choice,
 * text share, remove. Marks live in localStorage on the reader's
 * device (lib/highlights.ts), keyed by verse — never by
 * translation, so they follow the reader across WEB/KJV/Cebuano.
 * A wash is translucent background only: no padding, no layout
 * shift, the ink keeps its contrast in both reader themes.
 */
export default function VerseText({
  verses,
  bookTitle,
  chapterNum,
  fontSizeRem = 1.18,
  crossRefs,
  onOpenRefs,
  slug,
  chapterIdx,
  focusVerse,
}: Props) {
  const {
    getHighlight,
    toggleHighlight,
    setHighlightColor,
    removeHighlight,
  } = useProgress();
  const canHighlight = slug !== undefined && chapterIdx !== undefined;

  // Arriving from My Highlights (?v=N): bring the verse into view
  // and wash it a little brighter for a few seconds so the eye
  // lands. The scroll is instant for readers who prefer reduced
  // motion; the flash class itself rests under reduced motion
  // (globals.css), leaving the verse simply in view. The class is
  // applied straight to the verse's span — a one-shot DOM gesture
  // tied to the URL we arrived with, not render state.
  useEffect(() => {
    if (!focusVerse) return;
    const el = document.getElementById(`verse-${focusVerse}`);
    const span = el?.querySelector<HTMLElement>("[data-verse-text]");
    if (!el || !span) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    el.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "center",
    });
    span.classList.add("verse-flash");
    const prev = span.style.backgroundColor;
    span.style.backgroundColor = "rgba(217, 164, 65, 0.45)";
    const t = window.setTimeout(() => {
      span.classList.remove("verse-flash");
      span.style.backgroundColor = prev;
    }, 3400);
    return () => {
      window.clearTimeout(t);
      span.classList.remove("verse-flash");
      span.style.backgroundColor = prev;
    };
  }, [focusVerse]);

  return (
    <div
      className="font-scripture leading-[1.9] text-[var(--reader-ink)]"
      style={{ fontSize: `${fontSizeRem}rem` }}
    >
      {verses.map((v) => {
        const ref = v.n > 0 ? verseRef(bookTitle, chapterNum, v.n) : null;
        const targets = v.n > 0 ? crossRefs[v.n] : undefined;
        const mark =
          canHighlight && v.n > 0
            ? getHighlight(slug, chapterIdx, v.n)
            : undefined;
        return (
          <p key={v.n} id={v.n > 0 ? `verse-${v.n}` : undefined} className="mb-5 scroll-mt-24">
            {v.n > 0 && (
              <sup className="mr-2 font-body text-[0.72em] font-semibold text-[var(--reader-verse-num)]">
                {v.n}
              </sup>
            )}
            <span
              data-verse-text={v.n > 0 ? "" : undefined}
              onClick={
                canHighlight && ref
                  ? () => toggleHighlight(slug, chapterIdx, v.n)
                  : undefined
              }
              role={canHighlight && ref ? "button" : undefined}
              tabIndex={canHighlight && ref ? 0 : undefined}
              onKeyDown={
                canHighlight && ref
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleHighlight(slug, chapterIdx, v.n);
                      }
                    }
                  : undefined
              }
              aria-pressed={canHighlight && ref ? Boolean(mark) : undefined}
              title={
                canHighlight && ref
                  ? mark
                    ? `Tap to take the highlight off ${ref}`
                    : `Tap to highlight ${ref}`
                  : undefined
              }
              className={`rounded-[0.2em] transition-colors ${
                canHighlight && ref ? "cursor-pointer" : ""
              }`}
              style={{
                backgroundColor: mark
                  ? highlightWash(mark.color)
                  : "transparent",
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }}
            >
              {v.text}
            </span>
            {ref && (
              <ShareVerseButton verseText={v.text} reference={ref} />
            )}
            {ref && canHighlight && (
              <VerseActions
                verseText={v.text}
                reference={ref}
                color={mark?.color}
                onSetColor={(c) =>
                  setHighlightColor(slug, chapterIdx, v.n, c)
                }
                onRemove={() => removeHighlight(slug, chapterIdx, v.n)}
              />
            )}
            {ref && targets && targets.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenRefs(v.n, ref, targets)}
                className="relative ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--reader-verse-num)]/50 align-middle font-body text-[0.7rem] text-[var(--reader-verse-num)] transition-colors after:absolute after:-inset-2 after:content-[''] hover:bg-[var(--reader-verse-num)] hover:text-[var(--reader-bg)]"
                aria-label={`Cross-references for ${ref}`}
                title={`See other passages connected to ${ref}`}
              >
                ✦
              </button>
            )}
          </p>
        );
      })}
    </div>
  );
}
