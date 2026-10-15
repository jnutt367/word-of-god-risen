/**
 * The Bible Heartbeat — anonymous, aggregate-only counting.
 *
 * Every call here fires a Vercel Analytics custom event (durable in the
 * channel's own analytics — totals only, no reader identity, no cookies
 * set by us). A nightly roll-up (scripts/heartbeat-rollup.mjs) gathers the
 * event totals into data/heartbeat.json, which is what the homepage's
 * "The Body, Reading" vine displays. See HEARTBEAT.md for the full story.
 *
 * Deduping is deliberately gentle: a chapter counts once per browser
 * session whether it was counted by opening it or by marking it read,
 * so the totals stay honest without tracking anyone.
 */
import { track } from "@vercel/analytics";

const SESSION_PREFIX = "hb:";
const BOOK_DONE_KEY = "hb:bookdone:";

function seen(key: string): boolean {
  try {
    return sessionStorage.getItem(SESSION_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

function markSeen(key: string): void {
  try {
    sessionStorage.setItem(SESSION_PREFIX + key, "1");
  } catch {
    /* private mode etc. — counting just becomes approximate */
  }
}

/** A chapter was opened in the reader, or marked as read. Counts once per session per chapter. */
export function beatRead(bookSlug: string, chapterIdx: number): void {
  const key = `read:${bookSlug}:${chapterIdx}`;
  if (seen(key)) return;
  markSeen(key);
  try {
    track("chapter_read", { book: bookSlug, chapter: chapterIdx + 1 });
  } catch {
    /* analytics unavailable — the reading still happened */
  }
}

/** Playback of a chapter began (Teddy MP3 or device TTS), from idle. Once per session per chapter. */
export function beatListenStart(bookSlug: string, chapterNum: number): void {
  const key = `listen:${bookSlug}:${chapterNum}`;
  if (seen(key)) return;
  markSeen(key);
  try {
    track("chapter_listen_start", { book: bookSlug, chapter: chapterNum });
  } catch {
    /* ignore */
  }
}

/** Playback reached the end of a chapter. */
export function beatListenComplete(bookSlug: string, chapterNum: number): void {
  try {
    track("chapter_listen_complete", { book: bookSlug, chapter: chapterNum });
  } catch {
    /* ignore */
  }
}

/** The reader's marked-read chapters now cover a whole book. Once per device per book. */
export function beatBookComplete(bookSlug: string): void {
  try {
    if (localStorage.getItem(BOOK_DONE_KEY + bookSlug) === "1") return;
    localStorage.setItem(BOOK_DONE_KEY + bookSlug, "1");
  } catch {
    /* if storage is unavailable, fall through and count it */
  }
  try {
    track("book_complete", { book: bookSlug });
  } catch {
    /* ignore */
  }
}
