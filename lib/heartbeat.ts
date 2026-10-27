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

type BeatKind = "read" | "listen" | "listen_complete" | "book" | "listened_marked" | "open";

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

/**
 * The app itself was opened (Jason, Oct 27, 2026: "any open lights
 * the map too"). Counted as its own beat kind, never folded into
 * the read/heard counts; on the map an opens-only place rests as a
 * faint ember — the full golden light stays the sign of the Word
 * read or heard. Once per browser session, like every beat here.
 * Fired from the root layout, so any entry page counts.
 */
export function beatOpen(): void {
  const key = "open";
  if (seen(key)) return;
  markSeen(key);
  try {
    track("app_open");
  } catch {
    /* ignore */
  }
  beatLive("open");
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

/** Session key for crossing #k of a chapter (crossing 1 keeps the
 *  original key, so a chapter counted under the first shipped rule is
 *  never counted twice by the corrected one in the same session). */
function crossingKey(bookSlug: string, chapterNum: number, k: number): string {
  return k <= 1
    ? `complete:${bookSlug}:${chapterNum}`
    : `complete:${bookSlug}:${chapterNum}:x${k}`;
}

/** Fire the listen_complete beat for crossing #k — guarded per
 *  crossing, so a crossing once fired never fires again. */
function fireListenCrossing(bookSlug: string, chapterNum: number, k: number): void {
  const key = crossingKey(bookSlug, chapterNum, k);
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
 * The listener heard a chapter through once: played time crossed one
 * multiple of LISTENED_THROUGH (see notePlayedSpan), playback reached
 * the natural end, or device TTS finished the chapter. This exported
 * beat fires crossing #1 only; further listen-throughs in the same
 * session fire as further crossings from the played-time tracker.
 */
export function beatListenComplete(bookSlug: string, chapterNum: number): void {
  fireListenCrossing(bookSlug, chapterNum, 1);
}

/**
 * "Listened through" (Jason's ruling, Oct 20, 2026): a chapter counts
 * when the listener has genuinely PLAYED at least this share of it —
 * measured in played time, never playhead position, so seeking ahead
 * earns nothing. No looser than this: 80% of a chapter truly heard is
 * a listener who stayed; the old rule (only the track's very last
 * second counted) measured the file, not the listening.
 *
 * Jason's correction, same day: the count measures LISTENING, not
 * coverage — "if someone rereads the passage it should count as a
 * listen again." So played seconds ADD, repeats included: hearing a
 * chapter's first half twice is 100% of a chapter heard. Every time
 * the accumulated total crosses a further multiple of this share
 * (0.8×, 1.6×, 2.4× … of the duration), the chapter counts again.
 */
export const LISTENED_THROUGH = 0.8;

type Span = [number, number];

/** Accumulated played seconds + crossings already fired, per chapter
 *  per browser session. */
interface PlayedState {
  total: number;
  fired: number;
}

const playedKey = (bookSlug: string, chapterNum: number) =>
  `played:${bookSlug}:${chapterNum}`;

/** Union length of a span list — used only to migrate the span sets
 *  the first shipped rule stored, so their played time carries over. */
function spansTotal(spans: Span[]): number {
  const sorted = [...spans].sort((a, b) => a[0] - b[0]);
  const merged: Span[] = [];
  for (const s of sorted) {
    const last = merged[merged.length - 1];
    if (last && s[0] <= last[1]) last[1] = Math.max(last[1], s[1]);
    else merged.push([s[0], s[1]]);
  }
  return merged.reduce((sum, s) => sum + (s[1] - s[0]), 0);
}

function readPlayedState(
  bookSlug: string,
  chapterNum: number,
  duration: number
): PlayedState {
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + playedKey(bookSlug, chapterNum));
    if (!raw) return { total: 0, fired: 0 };
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      isFinite((parsed as PlayedState).total)
    ) {
      const st = parsed as PlayedState;
      return {
        total: Math.max(0, st.total),
        fired: Math.max(0, Math.floor(st.fired || 0)),
      };
    }
    if (Array.isArray(parsed)) {
      // Stored by the first shipped rule as a union span set. Its
      // covered seconds carry over as played time; if that build
      // already counted the chapter, its crossing stands as fired.
      const spans = parsed.filter(
        (s): s is Span =>
          Array.isArray(s) &&
          s.length === 2 &&
          typeof s[0] === "number" &&
          typeof s[1] === "number" &&
          isFinite(s[0]) &&
          isFinite(s[1]) &&
          s[1] > s[0]
      );
      const total = spansTotal(spans);
      const fired = seen(crossingKey(bookSlug, chapterNum, 1))
        ? Math.max(1, Math.floor(total / (LISTENED_THROUGH * duration)))
        : 0;
      return { total, fired };
    }
  } catch {
    /* unreadable state — start fresh rather than break playback */
  }
  return { total: 0, fired: 0 };
}

function writePlayedState(bookSlug: string, chapterNum: number, st: PlayedState): void {
  try {
    sessionStorage.setItem(
      SESSION_PREFIX + playedKey(bookSlug, chapterNum),
      JSON.stringify(st)
    );
  } catch {
    /* private mode etc. — counting just becomes approximate */
  }
}

/** Fire every crossing the accumulated total has reached but not yet
 *  fired (each crossing is itself guarded, so none can fire twice). */
function fireReachedCrossings(
  bookSlug: string,
  chapterNum: number,
  st: PlayedState,
  duration: number
): void {
  const reached = Math.floor(st.total / (LISTENED_THROUGH * duration));
  while (st.fired < reached) {
    st.fired += 1;
    fireListenCrossing(bookSlug, chapterNum, st.fired);
  }
}

/**
 * Note a span of a chapter that was genuinely played — fed from the
 * player's own accounting of what actually sounded (see ListenButton),
 * so a passage scrubbed past never enters the sum. Every played
 * second adds to the chapter's session total, INCLUDING seconds that
 * repeat an earlier stretch: re-listening is listening. Each time the
 * total crosses a further multiple of LISTENED_THROUGH × duration,
 * the chapter counts as listened through once more.
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
  const s = Math.max(0, Math.min(start, duration));
  const e = Math.max(0, Math.min(end, duration));
  if (e - s < 0.25) return; // slivers are event noise at segment edges
  const st = readPlayedState(bookSlug, chapterNum, duration);
  st.total += e - s;
  fireReachedCrossings(bookSlug, chapterNum, st, duration);
  writePlayedState(bookSlug, chapterNum, st);
}

/**
 * Playback reached the chapter's natural end. Under the repeats rule
 * the end earns nothing by itself — it only releases a crossing the
 * accumulated played time has already reached but not yet fired, and
 * never one that already fired.
 */
export function beatListenEnded(
  bookSlug: string,
  chapterNum: number,
  duration: number
): void {
  if (!isFinite(duration) || duration <= 0) return;
  const st = readPlayedState(bookSlug, chapterNum, duration);
  fireReachedCrossings(bookSlug, chapterNum, st, duration);
  writePlayedState(bookSlug, chapterNum, st);
}

/**
 * The reader's own word: they tapped "I listened to this chapter"
 * (Jason's direction, Oct 20, 2026 — "give it a listened to if the
 * person selects that button saying they listened"). This is the
 * count for every listening the player cannot measure — above all
 * device TTS, where speechSynthesis reports no played time at all,
 * and any listening that happened off the playhead's watch. It is a
 * testimony, not a measurement: it fires its OWN beat kind and is
 * never folded into the measured listen_complete totals. Same
 * gentle dedupe as every beat: once per browser session per chapter.
 */
export function beatListenedMarked(bookSlug: string, chapterIdx: number): void {
  const key = `marked:${bookSlug}:${chapterIdx}`;
  if (seen(key)) return;
  markSeen(key);
  try {
    track("chapter_listened_marked", { book: bookSlug, chapter: chapterIdx + 1 });
  } catch {
    /* ignore */
  }
  beatLive("listened_marked");
}

/** Has this session already marked this chapter "I listened"?
 *  (The button's counted state for the rest of the visit.) */
export function isListenedMarked(bookSlug: string, chapterIdx: number): boolean {
  return seen(`marked:${bookSlug}:${chapterIdx}`);
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
