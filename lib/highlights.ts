/* Verse highlights: the reader's own marks, persisted in
 * localStorage on their device only.
 *
 * A sibling of the chapter stores (lib/progress.ts,
 * lib/media-progress.ts), kept separate so highlight state can never
 * disturb read/listened state, which reading plans depend on.
 *
 * Keyed "slug::chapterIndex::verseNumber" — deliberately WITHOUT a
 * translation in the key: a mark belongs to the verse itself, so it
 * shows in WEB, KJV and Cebuano alike when the reader switches.
 *
 * No-custody, by design: highlights are never sent anywhere. No
 * account, no server write, no heartbeat beat — a reader's marks
 * are between them, their phone, and the Lord.
 */

export type HighlightColorId = "gold" | "green" | "blue" | "rose";

export interface HighlightEntry {
  /** Palette id — see HIGHLIGHT_COLORS. */
  color: HighlightColorId;
  /** When the verse was marked (ms epoch) — the gathering page's
   *  secondary sort and a plain record of the day it spoke. */
  at: number;
}

export type HighlightMap = Record<string, HighlightEntry>;

/* ---- Word-exact (phrase) marks — added Nov 8, 2026, Jason's
 * second ruling of the night: "build word-exact highlighting too."
 *
 * A whole-verse mark belongs to the verse in every translation, so
 * it needs no version in its key. A phrase mark cannot make that
 * promise: the words it paints sit at fixed character offsets in
 * ONE translation's wording of the verse. So a phrase mark lives
 * in its own list, stored with everything needed to re-anchor it
 * honestly:
 *   - the verse key (same shape as the whole-verse map),
 *   - the version it was made in ("web" | "kjv" | "ceb" …) —
 *     it paints ONLY in that version; in any other version the
 *     verse simply shows its whole-verse state, and nothing in
 *     the UI apologizes or guesses,
 *   - start/end character offsets into that version's verse text,
 *   - the exact text those offsets covered when the mark was made.
 * At render time the mark paints only when the verse text at
 * those offsets still IS the stored text; if they ever part ways
 * (the Bible text here is static, but the check is cheap), the
 * paint is dropped — a mark is never allowed to land on words it
 * wasn't made on.
 *
 * Both kinds live in the same store object (v1 key kept — a
 * reader's existing whole-verse marks migrate by simply existing:
 * the reader below accepts the old flat-map shape and wraps it). */
export interface PhraseHighlight {
  /** "slug::chapterIndex::verse" — same verse key as the map. */
  key: string;
  /** Palette id — see HIGHLIGHT_COLORS. */
  color: HighlightColorId;
  /** When the words were marked (ms epoch). */
  at: number;
  /** Translation id the selection was made in (lib/versions). */
  version: string;
  /** Inclusive character offset of the first selected char,
   *  into that version's text of the verse. */
  start: number;
  /** Exclusive character offset just past the last selected char. */
  end: number;
  /** The exact words the offsets covered when the mark was made —
   *  the re-anchor witness and the gathering page's fallback. */
  text: string;
}

export interface HighlightStore {
  verses: HighlightMap;
  phrases: PhraseHighlight[];
}

export const EMPTY_HIGHLIGHT_STORE: HighlightStore = {
  verses: {},
  phrases: [],
};

const STORE_KEY = "wogr_highlights_v1";

export const DEFAULT_HIGHLIGHT_COLOR: HighlightColorId = "gold";

/* The palette: four gentle washes from the app's own brand family —
 * gold (the house color, and the default), sage green, a soft sky
 * blue and a soft rose. `swatch` paints the little color dots in the
 * popover and on the gathering page (opaque, for the dot itself);
 * `wash` is what lies UNDER the verse text in the reader — always
 * translucent, so the ink keeps its contrast in both reader themes
 * (night vineyard and lamp parchment alike). */
export const HIGHLIGHT_COLORS: {
  id: HighlightColorId;
  label: string;
  swatch: string;
  wash: string;
}[] = [
  { id: "gold", label: "Gold", swatch: "#d9a441", wash: "rgba(217, 164, 65, 0.30)" },
  { id: "green", label: "Green", swatch: "#7fa088", wash: "rgba(127, 160, 136, 0.32)" },
  { id: "blue", label: "Blue", swatch: "#7ea6c9", wash: "rgba(126, 166, 201, 0.30)" },
  { id: "rose", label: "Rose", swatch: "#d29a9a", wash: "rgba(210, 154, 154, 0.32)" },
];

export function highlightWash(color: HighlightColorId): string {
  return (
    HIGHLIGHT_COLORS.find((c) => c.id === color) ?? HIGHLIGHT_COLORS[0]
  ).wash;
}

export const highlightKey = (slug: string, idx: number, verse: number) =>
  `${slug}::${idx}::${verse}`;

export function parseHighlightKey(key: string): {
  slug: string;
  idx: number;
  verse: number;
} | null {
  const parts = key.split("::");
  if (parts.length !== 3) return null;
  const idx = parseInt(parts[1], 10);
  const verse = parseInt(parts[2], 10);
  if (Number.isNaN(idx) || Number.isNaN(verse)) return null;
  return { slug: parts[0], idx, verse };
}

function cleanColor(v: unknown): HighlightColorId {
  return HIGHLIGHT_COLORS.some((c) => c.id === v)
    ? (v as HighlightColorId)
    : DEFAULT_HIGHLIGHT_COLOR;
}

function cleanVerseMap(raw: unknown): HighlightMap {
  const map: HighlightMap = {};
  if (!raw || typeof raw !== "object") return map;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const e = v as Partial<HighlightEntry>;
    map[k] = {
      color: cleanColor(e.color),
      at: typeof e.at === "number" ? e.at : 0,
    };
  }
  return map;
}

function cleanPhrases(raw: unknown): PhraseHighlight[] {
  if (!Array.isArray(raw)) return [];
  const out: PhraseHighlight[] = [];
  for (const v of raw) {
    if (!v || typeof v !== "object") continue;
    const p = v as Partial<PhraseHighlight>;
    if (
      typeof p.key !== "string" ||
      !parseHighlightKey(p.key) ||
      typeof p.version !== "string" ||
      typeof p.start !== "number" ||
      typeof p.end !== "number" ||
      !(p.end > p.start) ||
      typeof p.text !== "string" ||
      p.text.length === 0
    )
      continue;
    out.push({
      key: p.key,
      color: cleanColor(p.color),
      at: typeof p.at === "number" ? p.at : 0,
      version: p.version,
      start: p.start,
      end: p.end,
      text: p.text,
    });
  }
  return out;
}

export function loadHighlights(): HighlightStore {
  if (typeof window === "undefined") return EMPTY_HIGHLIGHT_STORE;
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORE_KEY) || "null");
    if (!raw || typeof raw !== "object") return EMPTY_HIGHLIGHT_STORE;
    // Two shapes have ever been written under this key: the first
    // night's flat verse map ({ "mark::5::42": {color, at} }) and
    // the wrapped store ({ verses, phrases }). An old flat map IS
    // the verses half — nothing a reader marked is ever lost in
    // the widening.
    if ("verses" in raw || "phrases" in raw) {
      const r = raw as { verses?: unknown; phrases?: unknown };
      return {
        verses: cleanVerseMap(r.verses),
        phrases: cleanPhrases(r.phrases),
      };
    }
    return { verses: cleanVerseMap(raw), phrases: [] };
  } catch {
    return EMPTY_HIGHLIGHT_STORE;
  }
}

export function saveHighlights(store: HighlightStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable — highlights just won't persist */
  }
}

/** A stable identity for one phrase mark — the gathering page's
 *  row key and its remove handle. Offsets + version are identity:
 *  the same words re-marked in the same version replace, never
 *  stack. */
export function phraseMarkId(p: {
  key: string;
  version: string;
  start: number;
  end: number;
}): string {
  return `${p.key}@@${p.version}@@${p.start}@@${p.end}`;
}

/** The marks that may paint on this verse, in this version, over
 *  this exact text — a phrase paints only when it was made in the
 *  version on screen AND the words at its offsets are still the
 *  words it was made on. Anything else is silently unpainted. */
export function phraseMarksFor(
  phrases: PhraseHighlight[],
  key: string,
  version: string,
  verseText: string
): PhraseHighlight[] {
  return phrases.filter(
    (p) =>
      p.key === key &&
      p.version === version &&
      verseText.slice(p.start, p.end) === p.text
  );
}

/** Add (or recolor) a phrase mark: an identical span re-marked
 *  updates its color in place rather than stacking a twin. */
export function upsertPhrase(
  phrases: PhraseHighlight[],
  mark: PhraseHighlight
): PhraseHighlight[] {
  const id = phraseMarkId(mark);
  const at = phrases.findIndex((p) => phraseMarkId(p) === id);
  if (at === -1) return [...phrases, mark];
  const next = phrases.slice();
  next[at] = { ...next[at], color: mark.color };
  return next;
}
