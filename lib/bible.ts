import { promises as fs } from "fs";
import path from "path";
import { BOOKS, bookBySlug, type BookMeta } from "@/data/books";
import {
  BIBLE_VERSIONS,
  DEFAULT_VERSION,
  type BibleVersion,
} from "@/lib/versions";

export type { BibleVersion };
export { BIBLE_VERSIONS, DEFAULT_VERSION };

export interface Chapter {
  title: string;
  image: string;
  text: string;
  /** Real chapter number in its book (usually idx+1; differs for odd entries). */
  ch?: number;
}

interface RawChapter {
  title?: string;
  image?: string;
  description?: string;
  ch?: number;
}

function normalizeImage(src: string | undefined): string {
  const s = (src || "").trim();
  if (!s) return "";
  if (s.startsWith("http") || s.startsWith("/")) return s;
  return "/" + s;
}

export function getAllBooks(): BookMeta[] {
  return BOOKS;
}

export function getBook(slug: string): BookMeta | undefined {
  return bookBySlug(slug);
}

/* ---- Bible versions ----
 *
 * The default chapter files (data/chapters/${slug}_data.json) hold the
 * World English Bible text (public domain). Alternate versions live in
 * ${slug}_${version}_data.json — e.g. matthew_kjv_data.json — with the
 * SAME entries in the SAME order (only the text differs), so chapter
 * indexes line up across versions. Entries that aren't real chapters
 * (publisher notes etc.) carry the default text in every version file.
 *
 * The search index script skips version files: any *_data.json whose name
 * contains an underscore is a version file (book slugs never do).
 *
 * Version metadata lives in lib/versions.ts (client-safe); this module
 * re-exports it for server components.
 */
function chapterFile(slug: string, version: string): string {
  const suffix = version === DEFAULT_VERSION ? "" : `_${version}`;
  return path.join(process.cwd(), "data", "chapters", `${slug}${suffix}_data.json`);
}

export async function getChapters(
  slug: string,
  version: string = DEFAULT_VERSION
): Promise<Chapter[]> {
  const file = chapterFile(slug, version);
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf-8");
  } catch (e) {
    // No text for this version — fall back to the default translation.
    if (version === DEFAULT_VERSION) throw e;
    return getChapters(slug, DEFAULT_VERSION);
  }
  const data = JSON.parse(raw) as { books?: RawChapter[] };
  return (data.books || [])
    .filter((b) => (b.description || "").trim().length > 0)
    .map((b) => ({
      title: (b.title || "").trim(),
      image: normalizeImage(b.image),
      text: (b.description || "").trim(),
      ch: typeof b.ch === "number" ? b.ch : undefined,
    }));
}

/** Versions that actually have text for this book (drives the switcher). */
export async function getAvailableVersions(
  slug: string
): Promise<BibleVersion[]> {
  const avail: BibleVersion[] = [];
  for (const v of BIBLE_VERSIONS) {
    try {
      await fs.access(chapterFile(slug, v.id));
      avail.push(v);
    } catch {
      /* version file missing — skip */
    }
  }
  return avail.length > 0 ? avail : [BIBLE_VERSIONS[0]];
}

/** Chapter number for display: derive from title ("Chapter V: ...") or index. */
export function chapterLabel(chapter: Chapter, idx: number): string {
  return chapter.title || `Chapter ${idx + 1}`;
}

/** All slugs, for generateStaticParams. */
export function getAllSlugs(): string[] {
  return BOOKS.map((b) => b.slug);
}
