/* Listened + watched progress: persisted in localStorage.
 *
 * Two stores, kept separate from the chapter "read" store
 * (wogr_progress_v2 in lib/progress.ts) so read-state — which the
 * reading plans depend on — stays untouched:
 *  - wogr_listened_v1: chapters the user listened to (Teddy narration),
 *    keyed "slug::chapterIndex" like the read store.
 *  - wogr_watched_v1: overview videos the user watched, keyed by
 *    YouTube video id.
 */
export interface MediaEntry {
  title: string;
  at: number;
}

export type MediaMap = Record<string, MediaEntry>;

const LISTENED_KEY = "wogr_listened_v1";
const WATCHED_KEY = "wogr_watched_v1";

export const listenedKey = (slug: string, idx: number) => `${slug}::${idx}`;

function loadMap(storeKey: string): MediaMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(storeKey) || "{}");
  } catch {
    return {};
  }
}

function saveMap(storeKey: string, map: MediaMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storeKey, JSON.stringify(map));
  } catch {
    /* storage unavailable — progress just won't persist */
  }
}

export function loadListened(): MediaMap {
  return loadMap(LISTENED_KEY);
}

export function saveListened(map: MediaMap): void {
  saveMap(LISTENED_KEY, map);
}

export function loadWatched(): MediaMap {
  return loadMap(WATCHED_KEY);
}

export function saveWatched(map: MediaMap): void {
  saveMap(WATCHED_KEY, map);
}

export function listenedOnPage(map: MediaMap, slug: string): number[] {
  const prefix = `${slug}::`;
  return Object.keys(map)
    .filter((k) => k.startsWith(prefix))
    .map((k) => parseInt(k.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
}
