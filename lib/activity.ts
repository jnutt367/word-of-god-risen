/* "Today" activity: persisted in localStorage, this device only.
 *
 * Kept separate from the lifetime read/listened stores
 * (wogr_progress_v2 in lib/progress.ts, wogr_listened_v1 in
 * lib/media-progress.ts) so those marks — and everything that
 * depends on them — stay exactly as they are. This store only
 * remembers WHEN a chapter was last read or heard, so the reader
 * can see what they opened TODAY, told apart from their lifetime
 * marks:
 *  - wogr_activity_v1: keyed "slug::chapterIndex" like the other
 *    chapter stores; each entry carries the last read-activity
 *    timestamp (`r`) and/or last listen-activity timestamp (`l`).
 */
export interface ActivityEntry {
  r?: number;
  l?: number;
}

export type ActivityMap = Record<string, ActivityEntry>;

const ACTIVITY_KEY = "wogr_activity_v1";

export const activityKey = (slug: string, idx: number) => `${slug}::${idx}`;

export function loadActivity(): ActivityMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(ACTIVITY_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveActivity(map: ActivityMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable — today marks just won't persist */
  }
}

/** True when `ts` falls on the same local calendar day as now. */
export function isToday(ts: number | undefined): boolean {
  if (!ts || !isFinite(ts)) return false;
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Chapter indexes in a book whose read or listen activity is today. */
export function todayOnPage(
  map: ActivityMap,
  slug: string
): { read: number[]; listened: number[] } {
  const prefix = `${slug}::`;
  const read: number[] = [];
  const listened: number[] = [];
  for (const k of Object.keys(map)) {
    if (!k.startsWith(prefix)) continue;
    const idx = parseInt(k.slice(prefix.length), 10);
    if (Number.isNaN(idx)) continue;
    if (isToday(map[k].r)) read.push(idx);
    if (isToday(map[k].l)) listened.push(idx);
  }
  read.sort((a, b) => a - b);
  listened.sort((a, b) => a - b);
  return { read, listened };
}
