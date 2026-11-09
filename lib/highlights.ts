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

export function loadHighlights(): HighlightMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(
      window.localStorage.getItem(STORE_KEY) || "{}"
    ) as Record<string, Partial<HighlightEntry>>;
    // Keep only entries that still parse as a known color; a hand-
    // edited or older store should degrade to plain marks, never
    // break the reader.
    const map: HighlightMap = {};
    for (const [k, v] of Object.entries(raw)) {
      if (!v || typeof v !== "object") continue;
      const color = HIGHLIGHT_COLORS.some((c) => c.id === v.color)
        ? (v.color as HighlightColorId)
        : DEFAULT_HIGHLIGHT_COLOR;
      map[k] = { color, at: typeof v.at === "number" ? v.at : 0 };
    }
    return map;
  } catch {
    return {};
  }
}

export function saveHighlights(map: HighlightMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable — highlights just won't persist */
  }
}
