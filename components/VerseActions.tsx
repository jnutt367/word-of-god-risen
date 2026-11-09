"use client";

import { useEffect, useRef, useState } from "react";
import {
  HIGHLIGHT_COLORS,
  type HighlightColorId,
} from "@/lib/highlights";
import { shareText, verseShareText } from "@/lib/share-text";

interface Props {
  verseText: string;
  reference: string; // e.g. "John 3:16"
  /** The verse's current highlight color, if it is highlighted. */
  color: HighlightColorId | undefined;
  onSetColor: (color: HighlightColorId) => void;
  onRemove: () => void;
}

/**
 * The little marker chip at the end of a verse (🖍) and its popover:
 * the rest of the highlight ask — pick a color, share the verse as
 * text, or take the mark off. Deliberately a small anchored card in
 * the reader's own card colors, not a modal: the reader never loses
 * their place in the chapter. Tap behavior lives on the verse body
 * itself (VerseText): tap = gold on/off. This chip is for readers
 * whose fingers look for a button, and for everything beyond gold.
 *
 * Share here is TEXT only (share sheet / clipboard), following
 * ShareChapterButton's pattern — the ⤴ chip beside it remains the
 * picture-card share.
 */
export default function VerseActions({
  verseText,
  reference,
  color,
  onSetColor,
  onRemove,
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | null>(null);

  // Close on an outside tap or Escape — the popover is a guest in
  // the chapter, never a trap.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  async function share() {
    const result = await shareText({
      title: reference,
      text: verseShareText(verseText, reference),
    });
    if (result === "copied") {
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1600);
    } else {
      setOpen(false);
    }
  }

  return (
    <span ref={rootRef} className="relative inline-block align-middle">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          color
            ? `Highlight options for ${reference}`
            : `Highlight ${reference}`
        }
        title={
          color
            ? `Highlight options for ${reference}`
            : `Highlight ${reference}`
        }
        className="relative ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--reader-verse-num)]/50 align-middle font-body text-[0.7rem] text-[var(--reader-verse-num)] transition-colors after:absolute after:-inset-2 after:content-[''] hover:bg-[var(--reader-verse-num)] hover:text-[var(--reader-bg)]"
      >
        🖍
      </button>
      {open && (
        <span
          role="dialog"
          aria-label={`Options for ${reference}`}
          className="absolute bottom-full left-1/2 z-30 mb-2 block w-56 -translate-x-1/2 rounded-xl border border-[var(--reader-line)] bg-[var(--reader-card)] p-3 font-body shadow-xl"
        >
          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--reader-muted)]">
            {reference}
          </span>
          <span className="mt-2 flex items-center gap-2">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSetColor(c.id);
                  setOpen(false);
                }}
                aria-label={`Highlight ${reference} in ${c.label.toLowerCase()}`}
                aria-pressed={color === c.id}
                title={c.label}
                className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${
                  color === c.id
                    ? "border-[var(--reader-ink)]"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c.swatch }}
              />
            ))}
          </span>
          <span className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={share}
              className="min-h-11 flex-1 rounded-lg border border-[var(--reader-line)] px-3 py-2 text-sm font-medium text-[var(--reader-ink)] transition-colors hover:border-[var(--reader-verse-num)]/50"
            >
              {copied ? "✓ Words copied" : "⤴ Share verse"}
            </button>
            {color && (
              <button
                type="button"
                onClick={() => {
                  onRemove();
                  setOpen(false);
                }}
                className="min-h-11 flex-1 rounded-lg border border-[var(--reader-line)] px-3 py-2 text-sm font-medium text-[var(--reader-muted)] transition-colors hover:border-[var(--reader-verse-num)]/50 hover:text-[var(--reader-ink)]"
              >
                Remove mark
              </button>
            )}
          </span>
        </span>
      )}
    </span>
  );
}
