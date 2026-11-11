import dayShortsData from "@/data/day-shorts.json";

/* Global Bible Month daily Shorts mapped to the chapter each one was
 * filmed from. Shape: book slug -> chapter index -> day Short. Add new
 * entries to data/day-shorts.json the night a day publishes; no code
 * changes needed.
 *
 * A day's Short lives on ITS OWN chapter — the chapter its moment
 * comes from — which is not always the chapter the homepage journey
 * walks that day: Days 1–10 were all filmed ahead (Nov 2, 2026) from
 * the next ten Mark moments in order, so Day 3's Short is Mark 3's,
 * Day 7's is Mark 7's, and so on. (The honesty days, Nov 8: Days 6–8
 * were released then; their labels here name the day and verse
 * exactly as published.)
 *
 * The Day 1 Introduction (8HU2j8BNS-Q) is NOT a chapter Short — it
 * belongs to no chapter page and is deliberately absent here; it
 * rides the homepage watch row and the Shorts shelf only. */

export interface DayShort {
  day: number; // Global Bible Month day (1–30)
  id: string; // YouTube video id (a Short)
  hook: string; // the day's published hook line, without the "Day N:" prefix
  verse: string; // the passage the Short is filmed from, as published
  title: string; // the video's full published title (the player names it so)
}

type DayShortsMap = Record<string, Record<string, DayShort>>;

export function getDayShortForChapter(
  slug: string,
  chapterIdx: number
): DayShort | null {
  const bySlug = (dayShortsData as DayShortsMap)[slug];
  if (!bySlug) return null;
  return bySlug[String(chapterIdx)] ?? null;
}

export function dayShortUrl(id: string): string {
  return `https://www.youtube.com/shorts/${id}`;
}
