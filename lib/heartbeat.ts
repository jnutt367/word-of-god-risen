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

/**
 * The listener heard a chapter through: at least LISTENED_THROUGH of
 * it genuinely played (see notePlayedSpan), or playback reached the
 * natural end. Once per session per chapter, like every other beat.
 */
export function beatListenComplete(bookSlug: string, chapterNum: number): void {
  const key = `complete:${bookSlug}:${chapterNum}`;
  if (seen(key)) return;
  markSeen(key);
  try {
    track("chapter_listen_complete", { book: bookSlug, chapter: chapterNum });
  } catch {
    /* ignore */
  }
  beatLive("listen_complete");
}

/**
 * "Listened through" (Jason's ruling, Oct 20, 2026): a chapter counts
 * when the listener has genuinely PLAYED at least this share of it —
 * measured in played time, never playhead position, so seeking ahead
 * earns nothing. No looser than this: 80% of a chapter truly heard is
 * a listener who stayed; the old rule (only the track's very last
 * second counted) measured the file, not the listening.
 */
export const LISTENED_THROUGH = 0.8;

type Span = [number, number];

const playedKey = (bookSlug: string, chapterNum: number) =>
  `played:${bookSlug}:${chapterNum}`;

function readSpans(key: string): Span[] {
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + key);
    if (!raw) return [];
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (s): s is Span =>
        Array.isArray(s) &&
        s.length === 2 &&
        typeof s[0] === "number" &&
        typeof s[1] === "number" &&
        isFinite(s[0]) &&
        isFinite(s[1]) &&
        s[1] > s[0]
    );
  } catch {
    return [];
  }
}

function writeSpans(key: string, spans: Span[]): void {
  try {
    sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify(spans));
  } catch {
    /* private mode etc. — counting just becomes approximate */
  }
}

/** Merge [start, end] into the sorted span set; return total covered seconds. */
function mergeSpan(spans: Span[], start: number, end: number): { spans: Span[]; total: number } {
  const all = [...spans, [start, end] as Span].sort((a, b) => a[0] - b[0]);
  const merged: Span[] = [];
  for (const s of all) {
    const last = merged[merged.length - 1];
    if (last && s[0] <= last[1]) last[1] = Math.max(last[1], s[1]);
    else merged.push([s[0], s[1]]);
  }
  return { spans: merged, total: merged.reduce((sum, s) => sum + (s[1] - s[0]), 0) };
}

/**
 * Note a span of a chapter that was genuinely played — fed from the
 * audio element's own `played` ranges, the browser's record of what
 * actually sounded, so a passage scrubbed past never enters the sum.
 * Spans accumulate per browser session (across player remounts); when
 * the played total reaches LISTENED_THROUGH of the chapter's duration,
 * the chapter counts as listened through.
 */
export function notePlayedSpan(
  bookSlug: string,
  chapterNum: number,
  start: number,
  end: number,
  duration: number
): void {
  if (!isFinite(duration) || duration <= 0) return;
  if (!isFinite(start) || !isFinite(end)) return;
  if (seen(`complete:${bookSlug}:${chapterNum}`)) return;
  const s = Math.max(0, Math.min(start, duration));
  const e = Math.max(0, Math.min(end, duration));
  if (e - s < 0.25) return; // slivers are event noise at range edges
  const key = playedKey(bookSlug, chapterNum);
  const { spans, total } = mergeSpan(readSpans(key), s, e);
  writeSpans(key, spans);
  if (total >= LISTENED_THROUGH * duration) beatListenComplete(bookSlug, chapterNum);
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
