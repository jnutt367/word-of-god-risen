/**
 * The Bible Heartbeat — anonymous, aggregate-only counting.
 *
 * Every call here counts through BOTH doors at once:
 *  - a Vercel Analytics custom event (durable in the site's own
 *    analytics — the permanent record, gathered into
 *    data/heartbeat.json by the daily roll-up), and
 *  - a beat to /api/heartbeat, which increments the live Blob counters
 *    the homepage vine reads about once a minute (v3).
 * Both carry totals only — no reader identity, no cookies set by us —
 * and the same gentle dedupe gates both, so the two records count the
 * same beats and the roll-up can reconcile them (see HEARTBEAT.md).
 *
 * Deduping is deliberately gentle: a chapter counts once per browser
 * session whether it was counted by opening it or by marking it read,
 * so the totals stay honest without tracking anyone.
 */
import { track } from "@vercel/analytics";

const SESSION_PREFIX = "hb:";
const BOOK_DONE_KEY = "hb:bookdone:";

type BeatKind = "read" | "listen" | "listen_complete" | "book";

/** Fire-and-forget beat to the live counter. The body is the beat kind
 *  and nothing else — no book, no chapter, no identity. */
function beatLive(type: BeatKind): void {
  try {
    void fetch("/api/heartbeat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type }),
      keepalive: true,
    }).catch(() => {
      /* the analytics event still counted the beat */
    });
  } catch {
    /* ignore */
  }
}

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
  beatLive("read");
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
  beatLive("listen");
}

/** Playback reached the end of a chapter. */
export function beatListenComplete(bookSlug: string, chapterNum: number): void {
  try {
    track("chapter_listen_complete", { book: bookSlug, chapter: chapterNum });
  } catch {
    /* ignore */
  }
  beatLive("listen_complete");
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
  beatLive("book");
}
