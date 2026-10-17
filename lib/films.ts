import filmsData from "@/data/films.json";

/* Animated Gospel films mapped to chapters. Shape: book slug -> chapter
 * index -> film. Add new entries to data/films.json as films are
 * published; no code changes needed. */

export interface ChapterFilm {
  id: string; // YouTube video id
  title: string;
  note: string;
}

type FilmsMap = Record<string, Record<string, ChapterFilm>>;

export function getFilmForChapter(
  slug: string,
  chapterIdx: number
): ChapterFilm | null {
  const bySlug = (filmsData as FilmsMap)[slug];
  if (!bySlug) return null;
  return bySlug[String(chapterIdx)] ?? null;
}

export function filmUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
