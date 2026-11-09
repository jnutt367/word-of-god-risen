"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/components/ProgressProvider";
import {
  parseHighlightKey,
  phraseMarkId,
  HIGHLIGHT_COLORS,
  type HighlightColorId,
  type PhraseHighlight,
} from "@/lib/highlights";
import { shareText, verseShareText } from "@/lib/share-text";
import { VERSION_STORAGE_KEY } from "@/lib/versions";
import { BOOKS, bookBySlug } from "@/data/books";
import { fetchHighlightVerses } from "@/app/highlights/actions";
import type { ResolvedHighlight } from "@/app/highlights/verses";

const BOOK_ORDER = new Map(BOOKS.map((b, i) => [b.slug, i]));

function colorOf(id: HighlightColorId) {
  return HIGHLIGHT_COLORS.find((c) => c.id === id) ?? HIGHLIGHT_COLORS[0];
}

/** Bible-order position of a verse key — book, chapter, verse. */
function keyOrder(key: string): [number, number, number] {
  const parsed = parseHighlightKey(key);
  if (!parsed) return [999, 0, 0];
  return [BOOK_ORDER.get(parsed.slug) ?? 999, parsed.idx, parsed.verse];
}

/** One gathered row: a whole-verse mark, or one word-exact mark.
 *  Phrase rows carry their own words (the exact text selected, in
 *  the version it was selected in), so they never wait on the
 *  server and never show another translation's wording. */
type Row =
  | { kind: "verse"; key: string; colorId: HighlightColorId }
  | { kind: "phrase"; mark: PhraseHighlight; id: string };

/**
 * My Highlights — the gathering place for every verse a reader has
 * marked. The marks live on this device (ProgressProvider →
 * localStorage); this list asks the server only for the verses'
 * words, in the translation the reader last chose, and keeps
 * nothing. Rows sit in Bible order — book, chapter, verse — the
 * way a marked-up Bible falls open. Each row can jump back to its
 * chapter (the verse flashes into view), share the verse as text,
 * or take the mark off. Clearing everything lives behind a
 * two-step confirm at the bottom — never one-tap destructive.
 */
export default function HighlightsList() {
  const { highlights, phrases, removeHighlight, removePhrase, clearHighlights } =
    useProgress();
  const [resolved, setResolved] = useState<ResolvedHighlight[] | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const timer = useRef<number | null>(null);

  const sortedKeys = useMemo(() => {
    return Object.keys(highlights).sort((a, b) => {
      const [ab, ai, av] = keyOrder(a);
      const [bb, bi, bv] = keyOrder(b);
      if (ab !== bb) return ab - bb;
      if (ai !== bi) return ai - bi;
      return av - bv;
    });
  }, [highlights]);

  // Every mark of both kinds, in Bible order — a verse's own
  // phrase rows sit right under its whole-verse row, ordered by
  // where the words fall in the verse.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = sortedKeys.map((key) => ({
      kind: "verse" as const,
      key,
      colorId: highlights[key].color,
    }));
    for (const mark of phrases) {
      out.push({ kind: "phrase", mark, id: phraseMarkId(mark) });
    }
    const orderOf = (r: Row): [number, number, number] =>
      keyOrder(r.kind === "verse" ? r.key : r.mark.key);
    out.sort((a, b) => {
      const [ab, ai, av] = orderOf(a);
      const [bb, bi, bv] = orderOf(b);
      if (ab !== bb) return ab - bb;
      if (ai !== bi) return ai - bi;
      if (av !== bv) return av - bv;
      if (a.kind !== b.kind) return a.kind === "verse" ? -1 : 1;
      if (a.kind === "phrase" && b.kind === "phrase")
        return a.mark.start - b.mark.start;
      return 0;
    });
    return out;
  }, [sortedKeys, highlights, phrases]);

  const total = rows.length;
  const keysSignature = sortedKeys.join("|");

  // Resolve the whole-verse rows' words whenever the set of
  // whole-verse marks changes. (Phrase rows carry their own
  // words; an empty whole-verse set has nothing to resolve.)
  useEffect(() => {
    if (sortedKeys.length === 0) return;
    let cancelled = false;
    let version = "web";
    try {
      version = localStorage.getItem(VERSION_STORAGE_KEY) || "web";
    } catch {
      /* default translation */
    }
    fetchHighlightVerses(sortedKeys, version)
      .then((rows) => {
        if (!cancelled) setResolved(rows);
      })
      .catch(() => {
        if (!cancelled) setResolved([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysSignature]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  async function share(row: ResolvedHighlight) {
    if (!row.text) return;
    const result = await shareText({
      title: row.reference,
      text: verseShareText(row.text, row.reference),
    });
    if (result === "copied") {
      setCopiedKey(row.key);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopiedKey(null), 2500);
    }
  }

  async function sharePhrase(row: Row & { kind: "phrase" }, reference: string) {
    const result = await shareText({
      title: reference,
      text: verseShareText(row.mark.text, reference),
    });
    if (result === "copied") {
      setCopiedKey(row.id);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopiedKey(null), 2500);
    }
  }

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-gold-500/25 bg-vineyard-900 p-8 text-center">
        <p className="font-display text-xl text-cream-100">
          Verses you mark will gather here.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-sage-300">
          Open any chapter and tap a verse that speaks to you — it
          takes a soft gold highlight, kept right here on your phone.
          No account, nothing sent anywhere.
        </p>
        <Link
          href="/#books"
          className="mt-5 inline-block rounded-lg bg-gold-500 px-5 py-3 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400"
        >
          Open the books →
        </Link>
      </div>
    );
  }

  const byKey = new Map((resolved ?? []).map((r) => [r.key, r]));

  return (
    <div>
      <p className="text-sm text-sage-300" aria-live="polite">
        {total} mark{total === 1 ? "" : "s"} — kept on this phone
        only.
      </p>
      <ul className="mt-5 space-y-4">
        {rows.map((rowItem) => {
          if (rowItem.kind === "phrase") {
            const { mark } = rowItem;
            const parsed = parseHighlightKey(mark.key);
            if (!parsed) return null;
            const book = bookBySlug(parsed.slug);
            const reference = `${book?.title ?? parsed.slug} ${
              parsed.idx + 1
            }:${parsed.verse}`;
            const color = colorOf(mark.color);
            return (
              <li
                key={rowItem.id}
                className="rounded-2xl border border-gold-500/20 bg-vineyard-900 p-5"
                style={{ borderLeft: `6px solid ${color.swatch}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/book/${parsed.slug}/${parsed.idx}?v=${parsed.verse}`}
                    className="font-display text-lg text-gold-300 underline-offset-2 transition-colors hover:text-gold-200 hover:underline"
                  >
                    {reference}
                  </Link>
                  <span
                    className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color.swatch }}
                    aria-label={`${color.label} highlight`}
                    role="img"
                  />
                </div>
                <p className="mt-2 font-scripture text-base leading-relaxed text-cream-100">
                  &ldquo;{mark.text}&rdquo;
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/book/${parsed.slug}/${parsed.idx}?v=${parsed.verse}`}
                    className="inline-flex min-h-11 items-center rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400"
                  >
                    Read in chapter →
                  </Link>
                  <button
                    type="button"
                    onClick={() => sharePhrase(rowItem, reference)}
                    className="inline-flex min-h-11 items-center rounded-lg border border-cream-100/25 px-4 py-2 text-sm font-medium text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300"
                  >
                    {copiedKey === rowItem.id ? "✓ Words copied" : "⤴ Share"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhrase(rowItem.id)}
                    aria-label={`Remove the highlighted words in ${reference}`}
                    className="inline-flex min-h-11 items-center rounded-lg border border-cream-100/15 px-4 py-2 text-sm font-medium text-sage-300 transition-colors hover:border-gold-400/60 hover:text-cream-100"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          }
          const key = rowItem.key;
          const parsed = parseHighlightKey(key);
          const entry = highlights[key];
          const row = byKey.get(key);
          if (!parsed || !entry) return null;
          const book = bookBySlug(parsed.slug);
          const fallbackRef = `${book?.title ?? parsed.slug} ${
            parsed.idx + 1
          }:${parsed.verse}`;
          const color = colorOf(entry.color);
          return (
            <li
              key={key}
              className="rounded-2xl border border-gold-500/20 bg-vineyard-900 p-5"
              style={{ borderLeft: `6px solid ${color.swatch}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/book/${parsed.slug}/${parsed.idx}?v=${parsed.verse}`}
                  className="font-display text-lg text-gold-300 underline-offset-2 transition-colors hover:text-gold-200 hover:underline"
                >
                  {row?.reference ?? fallbackRef}
                </Link>
                <span
                  className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color.swatch }}
                  aria-label={`${color.label} highlight`}
                  role="img"
                />
              </div>
              {row === undefined ? (
                <p className="mt-2 font-scripture text-base leading-relaxed text-sage-300">
                  Gathering the words…
                </p>
              ) : row.text ? (
                <p className="mt-2 font-scripture text-base leading-relaxed text-cream-100">
                  {row.text}
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-sage-400">
                  These words couldn&rsquo;t be found in this
                  translation — the mark itself is still yours to keep
                  or remove.
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/book/${parsed.slug}/${parsed.idx}?v=${parsed.verse}`}
                  className="inline-flex min-h-11 items-center rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400"
                >
                  Read in chapter →
                </Link>
                {row?.text && (
                  <button
                    type="button"
                    onClick={() => share(row)}
                    className="inline-flex min-h-11 items-center rounded-lg border border-cream-100/25 px-4 py-2 text-sm font-medium text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300"
                  >
                    {copiedKey === key ? "✓ Words copied" : "⤴ Share"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    removeHighlight(parsed.slug, parsed.idx, parsed.verse)
                  }
                  aria-label={`Remove the highlight on ${
                    row?.reference ?? fallbackRef
                  }`}
                  className="inline-flex min-h-11 items-center rounded-lg border border-cream-100/15 px-4 py-2 text-sm font-medium text-sage-300 transition-colors hover:border-gold-400/60 hover:text-cream-100"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Clear all — two steps, always. The first tap asks; only
          the second, plainer one does it. */}
      <div className="mt-10 border-t border-gold-500/15 pt-6 text-center">
        {confirmingClear ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-cream-100">
              Take every highlight off? This can&rsquo;t be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  clearHighlights();
                  setConfirmingClear(false);
                }}
                className="min-h-11 rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400"
              >
                Yes, clear all {total}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClear(false)}
                className="min-h-11 rounded-lg border border-cream-100/25 px-5 py-2.5 text-sm font-medium text-cream-100 transition-colors hover:border-gold-400"
              >
                Keep them
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            className="min-h-11 rounded-lg border border-cream-100/15 px-5 py-2.5 text-sm font-medium text-sage-300 transition-colors hover:border-gold-400/60 hover:text-cream-100"
          >
            Clear all highlights
          </button>
        )}
      </div>
    </div>
  );
}
