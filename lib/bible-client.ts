/**
 * Client-safe Bible helpers — no `fs`, no `path`, no `process`.
 * Safe to import from "use client" components.
 *
 * Server-only chapter loading (which reads data files from disk)
 * lives in ./bible; that module re-exports everything here so server
 * components can keep importing from "@/lib/bible".
 */
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

export function getAllBooks(): BookMeta[] {
  return BOOKS;
}

export function getBook(slug: string): BookMeta | undefined {
  return bookBySlug(slug);
}

/** Chapter number for display: derive from title ("Chapter V: ...") or index. */
export function chapterLabel(chapter: Chapter, idx: number): string {
  return chapter.title || `Chapter ${idx + 1}`;
}

/** All slugs, for generateStaticParams. */
export function getAllSlugs(): string[] {
  return BOOKS.map((b) => b.slug);
}
