/**
 * Audio status per book, read from the app's own manifest
 * (public/audio-manifest.json — the Grandpa Teddy chapter files the
 * reader actually serves). Counted at build time, never hand-typed
 * (plan §5A: audio status is read from the manifests, not written
 * into book records).
 */
import manifest from "@/public/audio-manifest.json";

const counts = new Map<string, number>();
for (const key of Object.keys(manifest as Record<string, string>)) {
  const slug = key.split(":")[0];
  counts.set(slug, (counts.get(slug) || 0) + 1);
}

/** Chapters of this book with a Grandpa Teddy reading in the manifest. */
export function teddyChapters(bookSlug: string): number {
  return counts.get(bookSlug) || 0;
}

/** One honest line for the book page's Audio field. */
export function audioStatusLine(bookSlug: string, chapters: number): string {
  const n = teddyChapters(bookSlug);
  if (n >= chapters && chapters > 0) {
    return `Read by Grandpa Teddy — all ${chapters} chapter${chapters === 1 ? "" : "s"}.`;
  }
  if (n > 0) {
    return `Grandpa Teddy has read ${n} of ${chapters} chapters so far — the rest are in the device voice for now.`;
  }
  return "In the device voice for now — Grandpa Teddy’s reading is on the way.";
}
