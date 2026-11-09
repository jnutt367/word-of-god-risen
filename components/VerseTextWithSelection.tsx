"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  HIGHLIGHT_COLORS,
  highlightKey,
  phraseMarkId,
  phraseMarksFor,
  type HighlightColorId,
  type PhraseHighlight,
} from "@/lib/highlights";
import { useProgress } from "@/components/ProgressProvider";

export interface SelectionState {
  verseN: number;
  start: number;
  end: number;
  text: string;
  /** Top-left of the chip in viewport coordinates, clamped with
   *  an 8px safe margin so it never opens clipped (Job A law). */
  x: number;
  y: number;
  /** True when the selection overlapped an existing phrase mark —
   *  the chip then also offers taking that mark off. */
  existing?: PhraseHighlight;
}

/**
 * Word-exact highlighting (Nov 8, 2026 — Jason's second ruling of
 * the night): a reader selects exact wording inside a verse with
 * the platform's own selection — long-press and drag on a phone,
 * click-drag on a desktop — and a small 🖍 chip appears by the
 * selection offering the same four colors as the whole-verse
 * popover. Tapping a color marks JUST those words.
 *
 * The selection is read off the DOM Selection, never handled while
 * it forms, so selecting never fights the page's scroll: we listen
 * for `selectionchange` and only act when a settled, non-collapsed
 * selection lies fully inside one verse's text span. Offsets are
 * character positions in that verse's rendered text (which is the
 * version's verse text, verbatim), and the mark stores them with
 * the words themselves and the version id — see lib/highlights.ts
 * for the re-anchor law (paint only where the words still match).
 *
 * Choosing a color also clears the native selection, which is
 * what collapses the browser's own selection menu away.
 */
export default function VerseTextWithSelection({
  slug,
  chapterIdx,
  version,
  children,
}: {
  slug: string;
  chapterIdx: number;
  version: string;
  children: ReactNode;
}) {
  const { phrases, addPhrase, removePhrase } = useProgress();
  const rootRef = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<SelectionState | null>(null);

  const readSelection = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setSel(null);
      return;
    }
    const range = selection.getRangeAt(0);
    // The whole selection must live inside ONE verse's text span.
    const spanOf = (node: Node | null): HTMLElement | null => {
      let el: Node | null = node;
      while (el && el !== root) {
        if (el instanceof HTMLElement && el.dataset.verseText !== undefined)
          return el;
        el = el.parentNode;
      }
      return null;
    };
    const startSpan = spanOf(range.startContainer);
    const endSpan = spanOf(range.endContainer);
    if (!startSpan || startSpan !== endSpan) {
      setSel(null);
      return;
    }
    const p = startSpan.closest("p[id^='verse-']");
    const verseN = p ? parseInt(p.id.replace("verse-", ""), 10) : NaN;
    const verseText = startSpan.textContent ?? "";
    if (Number.isNaN(verseN) || !verseText) {
      setSel(null);
      return;
    }
    // Offsets within the verse text: measure the text before the
    // selection's start/end inside this span.
    const pre = document.createRange();
    pre.selectNodeContents(startSpan);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const through = document.createRange();
    through.selectNodeContents(startSpan);
    through.setEnd(range.endContainer, range.endOffset);
    const end = through.toString().length;
    const text = verseText.slice(start, end);
    if (!text.trim() || end <= start) {
      setSel(null);
      return;
    }
    // If the selection covers a phrase already marked in this
    // version, the chip can take that mark back off.
    const key = highlightKey(slug, chapterIdx, verseN);
    const existing = phraseMarksFor(phrases, key, version, verseText).find(
      (m) => start < m.end && m.start < end
    );
    const rect = range.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const MARGIN = 8;
    const CHIP_W = 224; // w-56, the popover family's width
    const x = Math.min(
      Math.max(rect.left, MARGIN),
      Math.max(MARGIN, vw - MARGIN - CHIP_W)
    );
    const y = Math.max(MARGIN, rect.top - 64);
    setSel({ verseN, start, end, text, x, y, existing });
  }, [slug, chapterIdx, version, phrases]);

  useEffect(() => {
    let t: number | null = null;
    const onChange = () => {
      // Let the selection settle — a drag mid-flight would paint
      // the chip in the wrong place and steal the gesture.
      if (t) window.clearTimeout(t);
      t = window.setTimeout(readSelection, 120);
    };
    document.addEventListener("selectionchange", onChange);
    return () => {
      document.removeEventListener("selectionchange", onChange);
      if (t) window.clearTimeout(t);
    };
  }, [readSelection]);

  // A scroll moves the selection's screen position — the chip goes
  // away rather than pointing at words it no longer sits beside.
  useEffect(() => {
    if (!sel) return;
    const dismiss = () => setSel(null);
    window.addEventListener("scroll", dismiss, { passive: true });
    return () => window.removeEventListener("scroll", dismiss);
  }, [sel]);

  const apply = (color: HighlightColorId, at: number) => {
    if (!sel) return;
    addPhrase({
      key: highlightKey(slug, chapterIdx, sel.verseN),
      color,
      at,
      version,
      start: sel.start,
      end: sel.end,
      text: sel.text,
    });
    window.getSelection()?.removeAllRanges();
    setSel(null);
  };

  const removeExisting = () => {
    if (!sel?.existing) return;
    removePhrase(phraseMarkId(sel.existing));
    window.getSelection()?.removeAllRanges();
    setSel(null);
  };

  return (
    <div ref={rootRef} className="relative">
      {children}
      {sel && (
        <div
          role="dialog"
          aria-label="Highlight the selected words"
          className="fixed z-40 w-56 rounded-xl border border-[var(--reader-line)] bg-[var(--reader-card)] p-3 font-body shadow-xl"
          style={{ left: sel.x, top: sel.y }}
        >
          <span className="block truncate text-xs font-semibold uppercase tracking-[0.14em] text-[var(--reader-muted)]">
            &ldquo;{sel.text}&rdquo;
          </span>
          <span className="mt-2 flex items-center gap-2">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => apply(c.id, Date.now())}
                aria-label={`Highlight the selected words in ${c.label.toLowerCase()}`}
                title={c.label}
                className="h-9 w-9 rounded-full border-2 border-transparent transition-transform hover:scale-110"
                style={{ backgroundColor: c.swatch }}
              />
            ))}
            <span className="ml-1 text-xs text-[var(--reader-muted)]">
              🖍 mark these words
            </span>
          </span>
          {sel.existing && (
            <button
              type="button"
              onClick={removeExisting}
              className="mt-3 min-h-11 w-full rounded-lg border border-[var(--reader-line)] px-3 py-2 text-sm font-medium text-[var(--reader-muted)] transition-colors hover:border-[var(--reader-verse-num)]/50 hover:text-[var(--reader-ink)]"
            >
              Remove mark
            </button>
          )}
        </div>
      )}
    </div>
  );
}
