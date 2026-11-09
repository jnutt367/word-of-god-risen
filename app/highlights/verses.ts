/* Server-side resolver for the My Highlights page: turns a list of
 * "slug::chapterIndex::verse" keys into the verse's text in the
 * reader's chosen translation. Runs only on the server (chapter
 * text lives in data files); the keys come from the reader's own
 * device and nothing about them is stored or logged here. */

import { getChapters } from "@/lib/bible";
import { parseVerses } from "@/lib/verses";
import {
  parseHighlightKey,
  phraseMarkId,
  type PhraseHighlight,
} from "@/lib/highlights";
import { bookBySlug } from "@/data/books";

export interface ResolvedHighlight {
  key: string;
  slug: string;
  idx: number;
  verse: number;
  bookTitle: string;
  chapterNum: number;
  reference: string;
  /** Verse text in the requested version, or null when the chapter
   *  or verse can't be found anymore (the row then offers removal
   *  instead of dead air). */
  text: string | null;
}

/** One word-exact mark, resolved for the gathering page. The words
 *  shown are the mark's OWN stored text — the words the reader
 *  actually selected, in the version they selected them in — so
 *  the row never needs the reader's current translation to agree
 *  with the mark's, and never shows words the reader didn't mark. */
export interface ResolvedPhrase {
  /** phraseMarkId of the stored mark — its remove handle. */
  id: string;
  key: string;
  slug: string;
  idx: number;
  verse: number;
  reference: string;
  phrase: string;
}

export async function resolveHighlights(
  keys: string[],
  version: string
): Promise<ResolvedHighlight[]> {
  // One chapter file read per marked chapter, not per verse.
  const cache = new Map<string, { text: string; ch?: number }[]>();
  const out: ResolvedHighlight[] = [];

  for (const key of keys) {
    const parsed = parseHighlightKey(key);
    if (!parsed) continue;
    const book = bookBySlug(parsed.slug);
    if (!book) continue;

    const cacheKey = `${parsed.slug}::${parsed.idx}`;
    let chapters = cache.get(cacheKey);
    if (!chapters) {
      try {
        chapters = await getChapters(parsed.slug, version);
      } catch {
        chapters = [];
      }
      cache.set(cacheKey, chapters);
    }
    const chapter = chapters[parsed.idx];
    const chapterNum = chapter?.ch ?? parsed.idx + 1;
    const verse = chapter
      ? parseVerses(chapter.text).find((v) => v.n === parsed.verse)
      : undefined;

    out.push({
      key,
      slug: parsed.slug,
      idx: parsed.idx,
      verse: parsed.verse,
      bookTitle: book.title,
      chapterNum,
      reference: `${book.title} ${chapterNum}:${parsed.verse}`,
      text: verse ? verse.text : null,
    });
  }
  return out;
}

/** Phrase rows need no fetching at all for their words (the mark
 *  carries them) — only the book's title to shape the reference,
 *  which the client could equally derive; resolved here so both
 *  row kinds come from one place. */
export function resolvePhrases(marks: PhraseHighlight[]): ResolvedPhrase[] {
  const out: ResolvedPhrase[] = [];
  for (const mark of marks.slice(0, 2000)) {
    const parsed = parseHighlightKey(mark.key);
    if (!parsed) continue;
    const book = bookBySlug(parsed.slug);
    if (!book) continue;
    out.push({
      id: phraseMarkId(mark),
      key: mark.key,
      slug: parsed.slug,
      idx: parsed.idx,
      verse: parsed.verse,
      reference: `${book.title} ${parsed.idx + 1}:${parsed.verse}`,
      phrase: mark.text,
    });
  }
  return out;
}
