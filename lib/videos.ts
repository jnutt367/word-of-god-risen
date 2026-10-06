import videosData from "@/data/videos.json";

/* TruVINE Shorts mapped to chapters. Shape: book slug -> chapter index ->
 * videos. Add new entries to data/videos.json as shorts are published;
 * no code changes needed. */

export interface ChapterVideo {
  id: string; // YouTube video id
  title: string;
  verse: string;
}

type VideosMap = Record<string, Record<string, ChapterVideo[]>>;

export function getVideosForChapter(
  slug: string,
  chapterIdx: number
): ChapterVideo[] {
  const bySlug = (videosData as VideosMap)[slug];
  if (!bySlug) return [];
  return bySlug[String(chapterIdx)] ?? [];
}

export function shortsUrl(id: string): string {
  return `https://www.youtube.com/shorts/${id}`;
}

export function thumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
