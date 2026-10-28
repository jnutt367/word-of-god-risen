/**
 * The Bible Heartbeat — live counters (v4), server-side only.
 *
 * THE COUNT-KEEPER MOVED HOUSE (Oct 23, 2026). The counters' first
 * home was one JSON document in a private Vercel Blob store; that
 * store hit the Hobby plan's advanced-operations ceiling
 * (2,000/2,000) eight days after go-live and locked until Nov 22 —
 * beats stopped landing while reads served the fallback. Jason's
 * ruling: move the count-keeper to a free home. It now lives in an
 * Upstash Redis database (free tier), reached over its REST API via
 * lib/redis-rest.ts — see HEARTBEAT.md, "v4 — the count-keeper
 * moves house." The Blob document's last verified state (Oct 23,
 * 19:51 EDT: 163 read · 91 heard · 47 completed · 48 marked · 2
 * books, with the full day-by-day record) is checked in as
 * data/heartbeat-seed.json and seeds an empty store, so the live
 * counters resume from the truth and never below it.
 *
 * The Redis layout (all keys under "hb:"):
 *   hb:meta       hash — since, updatedAt, seeded marker
 *   hb:totals     hash — the lifetime counters (HINCRBY)
 *   hb:subtotals  hash — lifetime subdivision counts, "US-FL:read"
 *   hb:days       hash — CLOSED day buckets, field = date, value =
 *                 the day's JSON record (the same HbDay shape the
 *                 Blob document kept)
 *   hb:opendays   set  — dates whose day is still open
 *   hb:day:<date> hash — the open day's counts (HINCRBY)
 *   hb:day:<date>:geo hash — the open day's country ("c:US:read")
 *                 and subdivision ("s:US-FL:read") counts; the
 *                 third field is read, heard, or — since Oct 27,
 *                 2026 — opens (the app-open beat counts beside
 *                 read/heard for its place, never inside them).
 *                 Since Oct 28, 2026 a fourth field, books, counts
 *                 whole books FINISHED in the place that day —
 *                 the book beat's geography, which it never carried
 *                 before: a finish used to move only the lifetime
 *                 total, leaving no record of where it happened.
 *                 It counts beside the chapters exactly like opens
 *                 does, never inside them (a row's `total` stays
 *                 chapters only).
 * A day is assembled into hb:days when it closes (the first beat of
 * a later day rolls it over), so a read assembles the public view
 * from a flat handful of commands however long the history grows —
 * and every write is an atomic increment, never a whole-document
 * read-modify-write. The frozen-store failure class of the Blob
 * days (a write precondition that can never match again) does not
 * exist here: increments cannot deadlock.
 *
 * Privacy, unchanged since v1: totals only. A beat carries no
 * identity — the only geography stored is the reader session's
 * COUNTRY, derived by the route from Vercel's edge header
 * (x-vercel-ip-country). No IP is ever read or stored. Since v3.1,
 * a beat may also record its SUBDIVISION — the full ISO 3166-2
 * code ("US-FL") of the connection's first-level region
 * (x-vercel-ip-country-region, sanitized per country by
 * lib/subdivisions.ts) — a subdivision-level aggregate only, stored
 * as a count beside a subdivision code exactly like the count
 * beside a country code; nothing about any person is gathered or
 * kept. The schema is keyed generically (ISO 3166-2), never
 * US-specific in shape.
 */
import { heartbeatToday } from "@/lib/heartbeat-date";
import { splitSubdivision, subdivisionName } from "@/lib/subdivisions";
import {
  hashToRecord,
  redisCommand,
  redisConfig,
  redisPipeline,
  toInt,
  type RedisCommand,
  type RedisConfig,
} from "@/lib/redis-rest";
import seedSnapshot from "@/data/heartbeat-seed.json";

/** The counters' home key in the Redis store (in the Blob days this
 *  named the document path, "heartbeat/counters.json"). */
export const COUNTERS_PATH = "hb:meta";

const META = "hb:meta";
const TOTALS = "hb:totals";
const SUBTOTALS = "hb:subtotals";
const DAYS = "hb:days";
const OPEN = "hb:opendays";
const dayKey = (date: string) => `hb:day:${date}`;
const geoKey = (date: string) => `hb:day:${date}:geo`;

export type BeatKind =
  | "read"
  | "listen"
  | "listen_complete"
  | "book"
  | "listened_marked"
  | "open";

export interface HbTotals {
  chaptersRead: number;
  chaptersHeard: number;
  listensCompleted: number;
  booksFinished: number;
  /** The reader's own word: chapters a listener marked "I listened"
   *  by tapping the button (Oct 20, 2026). A SEPARATE count from the
   *  measured listensCompleted — a tap is a testimony, not a
   *  measurement, and the two are never folded together. See
   *  HEARTBEAT.md, "The reader's own word". */
  listensMarked: number;
  /** App opens (Oct 27, 2026): the app itself was opened from a
   *  place. Its own count, never folded into the read/heard
   *  counts — on the map an opens-only place rests as an ember;
   *  the full light stays the sign of the Word read or heard. */
  opens: number;
}

export interface HbCountryCounts {
  read: number;
  heard: number;
  /** Opens recorded for this place (Oct 27, 2026) — counted
   *  beside read/heard, never inside them. */
  opens: number;
  /** Whole books finished in this place that day (Oct 28,
   *  2026) — the book beat's geography, counted beside the
   *  chapters exactly like opens, never inside them. From these
   *  day counts the public view derives the place's last
   *  book-finish date, which the map wears as a gold ring for
   *  that day. Records written before this field existed
   *  normalize it to 0 (see normalizePlaceCounts). */
  books: number;
}

export interface HbDay {
  date: string; // YYYY-MM-DD (America/New_York calendar day)
  chaptersRead: number;
  chaptersHeard: number;
  /** Chapters marked "I listened" by their own listeners that day.
   *  Carries no country/subdivision attribution — like
   *  listen_complete, a marked beat records the count only. */
  listensMarked: number;
  /** App opens that day (Oct 27, 2026) — a day count like the
   *  others, and per-place attribution in countries/subdivisions,
   *  so a place whose only activity is opens still stands in the
   *  day's rows and rests on the map as an ember. */
  opens: number;
  countries: Record<string, HbCountryCounts>;
  /** Subdivision counts for the day (v3.1), keyed by full ISO 3166-2
   *  code ("US-FL"). Only beats whose country has subdivision
   *  counting AND whose region signal survives sanitization land
   *  here (v3.1: US beats with a valid state signal). */
  subdivisions: Record<string, HbCountryCounts>;
}

export interface HbCounters {
  since: string;
  totals: HbTotals;
  /** Lifetime subdivision counts (v3.1), keyed by ISO 3166-2 code. */
  subdivisionTotals: Record<string, HbCountryCounts>;
  /** Day buckets, ascending by date. Retention is 400 days (raised
   *  Oct 21, 2026) so the public growth record ("The Vine Is
   *  Growing" on the homepage map) can show last week, last month,
   *  and beyond — the day-by-day story is the family's, and it is
   *  kept. */
  days: HbDay[];
  updatedAt: string; // ISO timestamp of the last counted beat
}

export function storeConfigured(): boolean {
  return redisConfig() !== null;
}

function emptyDay(date: string): HbDay {
  return {
    date,
    chaptersRead: 0,
    chaptersHeard: 0,
    listensMarked: 0,
    opens: 0,
    countries: {},
    subdivisions: {},
  };
}

/**
 * The seed: the counters' last verified record from the Blob store
 * (data/heartbeat-seed.json — totals AND the full day-by-day
 * history through Oct 23, 2026, 19:51 EDT), so an empty store
 * starts from the truth and never below it. The checked-in snapshot
 * (data/heartbeat.json) remains the unconfigured-store fallback and
 * is untouched by this.
 */
export function seedCounters(): HbCounters {
  return normalizeCounters(
    JSON.parse(JSON.stringify(seedSnapshot)) as HbCounters
  );
}

/**
 * Fill fields a counters document written by an older version lacks
 * (v3 documents predate `subdivisionTotals` and the day-level
 * `subdivisions`; documents before Oct 20, 2026 predate
 * `listensMarked`), so an upgrade never has to migrate the stored
 * data by hand.
 */
/** Place records written before Oct 27, 2026 carry no `opens`
 *  field, and those before Oct 28, 2026 carry no `books` field —
 *  default both wherever a stored record is read back. */
function normalizePlaceCounts(rec: Record<string, HbCountryCounts>): void {
  for (const v of Object.values(rec)) {
    v.opens ??= 0;
    v.books ??= 0;
  }
}

function normalizeCounters(c: HbCounters): HbCounters {
  c.subdivisionTotals ??= {};
  normalizePlaceCounts(c.subdivisionTotals);
  c.totals.listensMarked ??= 0;
  c.totals.opens ??= 0;
  for (const day of c.days) {
    day.countries ??= {};
    day.subdivisions ??= {};
    day.listensMarked ??= 0;
    day.opens ??= 0;
    normalizePlaceCounts(day.countries);
    normalizePlaceCounts(day.subdivisions);
  }
  return c;
}

function parseDay(json: string, date: string): HbDay {
  try {
    const day = JSON.parse(json) as HbDay;
    day.date = date;
    day.countries ??= {};
    day.subdivisions ??= {};
    day.listensMarked ??= 0;
    day.opens ??= 0;
    normalizePlaceCounts(day.countries);
    normalizePlaceCounts(day.subdivisions);
    return day;
  } catch {
    return emptyDay(date);
  }
}

/** An open day's two hashes → its HbDay record. */
function dayFromHashes(
  date: string,
  scalars: Record<string, string>,
  geo: Record<string, string>
): HbDay {
  const day = emptyDay(date);
  day.chaptersRead = toInt(scalars.chaptersRead);
  day.chaptersHeard = toInt(scalars.chaptersHeard);
  day.listensMarked = toInt(scalars.listensMarked);
  day.opens = toInt(scalars.opens);
  for (const [field, value] of Object.entries(geo)) {
    const parts = field.split(":");
    if (parts.length !== 3) continue;
    const [scope, code, which] = parts;
    if (
      which !== "read" &&
      which !== "heard" &&
      which !== "opens" &&
      which !== "books"
    )
      continue;
    const rec =
      scope === "c"
        ? (day.countries[code] ??= { read: 0, heard: 0, opens: 0, books: 0 })
        : scope === "s"
          ? (day.subdivisions[code] ??= { read: 0, heard: 0, opens: 0, books: 0 })
          : null;
    if (rec) rec[which] = toInt(value);
  }
  return day;
}

function addDayInto(target: HbDay, add: HbDay): void {
  target.chaptersRead += add.chaptersRead;
  target.chaptersHeard += add.chaptersHeard;
  target.listensMarked += add.listensMarked;
  target.opens += add.opens ?? 0;
  for (const [code, v] of Object.entries(add.countries)) {
    const t = (target.countries[code] ??= { read: 0, heard: 0, opens: 0, books: 0 });
    t.read += v.read;
    t.heard += v.heard;
    t.opens += v.opens ?? 0;
    t.books += v.books ?? 0;
  }
  for (const [code, v] of Object.entries(add.subdivisions)) {
    const t = (target.subdivisions[code] ??= { read: 0, heard: 0, opens: 0, books: 0 });
    t.read += v.read;
    t.heard += v.heard;
    t.opens += v.opens ?? 0;
    t.books += v.books ?? 0;
  }
}

function flattenCounts(
  rec: Record<string, HbCountryCounts>
): (string | number)[] {
  const out: (string | number)[] = [];
  for (const [code, v] of Object.entries(rec)) {
    out.push(
      `${code}:read`, v.read,
      `${code}:heard`, v.heard,
      `${code}:opens`, v.opens ?? 0,
      `${code}:books`, v.books ?? 0
    );
  }
  return out;
}

/** The commands that write a whole counters document (the seed)
 *  into an empty store. Idempotent values — re-running writes the
 *  same truth. */
function seedCommands(c: HbCounters): RedisCommand[] {
  const commands: RedisCommand[] = [
    [
      "HSET",
      META,
      "since",
      c.since,
      "updatedAt",
      c.updatedAt,
      "seeded",
      "1",
    ],
    [
      "HSET",
      TOTALS,
      "chaptersRead",
      c.totals.chaptersRead,
      "chaptersHeard",
      c.totals.chaptersHeard,
      "listensCompleted",
      c.totals.listensCompleted,
      "booksFinished",
      c.totals.booksFinished,
      "listensMarked",
      c.totals.listensMarked,
      "opens",
      c.totals.opens ?? 0,
    ],
  ];
  const subs = flattenCounts(c.subdivisionTotals);
  if (subs.length > 0) commands.push(["HSET", SUBTOTALS, ...subs]);
  if (c.days.length > 0) {
    const dayArgs: (string | number)[] = [];
    for (const day of c.days) dayArgs.push(day.date, JSON.stringify(day));
    commands.push(["HSET", DAYS, ...dayArgs]);
  }
  return commands;
}

/** Seed an untouched store from the verified record. The HSETNX
 *  marker makes this a no-op on every later call (one cheap command
 *  per request) — and if the store is ever wiped, the record heals
 *  back to the seed rather than to zero. */
async function ensureSeeded(cfg: RedisConfig): Promise<void> {
  const won = await redisCommand(cfg, ["HSETNX", META, "seeded", "1"]);
  if (won === 1) {
    await redisPipeline(cfg, seedCommands(seedCounters()));
  }
}

/** Assemble the full counters document from the store's keys. */
async function loadCounters(cfg: RedisConfig): Promise<HbCounters> {
  const [metaFlat, totalsFlat, subFlat, daysFlat, openRaw] =
    await redisPipeline(cfg, [
      ["HGETALL", META],
      ["HGETALL", TOTALS],
      ["HGETALL", SUBTOTALS],
      ["HGETALL", DAYS],
      ["SMEMBERS", OPEN],
    ]);
  const meta = hashToRecord(metaFlat);
  const totalsRec = hashToRecord(totalsFlat);
  const daysByDate = new Map<string, HbDay>();
  for (const [date, json] of Object.entries(hashToRecord(daysFlat))) {
    daysByDate.set(date, parseDay(json, date));
  }
  const openDates = Array.isArray(openRaw) ? openRaw.map(String) : [];
  if (openDates.length > 0) {
    const commands: RedisCommand[] = [];
    for (const date of openDates) {
      commands.push(["HGETALL", dayKey(date)], ["HGETALL", geoKey(date)]);
    }
    const results = await redisPipeline(cfg, commands);
    openDates.forEach((date, i) => {
      const open = dayFromHashes(
        date,
        hashToRecord(results[i * 2]),
        hashToRecord(results[i * 2 + 1])
      );
      const existing = daysByDate.get(date);
      if (existing) addDayInto(existing, open);
      else daysByDate.set(date, open);
    });
  }
  const subdivisionTotals: Record<string, HbCountryCounts> = {};
  for (const [field, value] of Object.entries(hashToRecord(subFlat))) {
    const cut = field.lastIndexOf(":");
    if (cut <= 0) continue;
    const code = field.slice(0, cut);
    const which = field.slice(cut + 1);
    if (
      which !== "read" &&
      which !== "heard" &&
      which !== "opens" &&
      which !== "books"
    )
      continue;
    (subdivisionTotals[code] ??= { read: 0, heard: 0, opens: 0, books: 0 })[
      which
    ] = toInt(value);
  }
  const seed = seedCounters();
  return normalizeCounters({
    since: meta.since || seed.since,
    totals: {
      chaptersRead: toInt(totalsRec.chaptersRead),
      chaptersHeard: toInt(totalsRec.chaptersHeard),
      listensCompleted: toInt(totalsRec.listensCompleted),
      booksFinished: toInt(totalsRec.booksFinished),
      listensMarked: toInt(totalsRec.listensMarked),
      opens: toInt(totalsRec.opens),
    },
    subdivisionTotals,
    days: [...daysByDate.values()]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-400),
    updatedAt: meta.updatedAt || seed.updatedAt,
  });
}

/** Close any open day older than today: assemble it into hb:days
 *  (merging with a closed record for the same date if one stands),
 *  then prune the closed history to its 400-day retention. Runs on
 *  the beat path, after the beat has landed; in practice it fires
 *  once a day. */
async function rollover(cfg: RedisConfig): Promise<void> {
  const today = heartbeatToday();
  const openRaw = await redisCommand(cfg, ["SMEMBERS", OPEN]);
  const openDates = Array.isArray(openRaw) ? openRaw.map(String) : [];
  const old = openDates.filter((d) => d < today).sort();
  for (const date of old) {
    const [scalarsFlat, geoFlat, closedRaw] = await redisPipeline(cfg, [
      ["HGETALL", dayKey(date)],
      ["HGETALL", geoKey(date)],
      ["HGET", DAYS, date],
    ]);
    const merged =
      typeof closedRaw === "string" && closedRaw
        ? parseDay(closedRaw, date)
        : emptyDay(date);
    addDayInto(
      merged,
      dayFromHashes(date, hashToRecord(scalarsFlat), hashToRecord(geoFlat))
    );
    await redisPipeline(cfg, [
      ["HSET", DAYS, date, JSON.stringify(merged)],
      ["SREM", OPEN, date],
      ["DEL", dayKey(date)],
      ["DEL", geoKey(date)],
    ]);
  }
  if (old.length > 0) {
    const keysRaw = await redisCommand(cfg, ["HKEYS", DAYS]);
    const keys = (Array.isArray(keysRaw) ? keysRaw.map(String) : []).sort();
    if (keys.length > 400) {
      await redisCommand(cfg, ["HDEL", DAYS, ...keys.slice(0, keys.length - 400)]);
    }
  }
}

interface LoadedCounters {
  counters: HbCounters;
  /** Kept for shape with the Blob days (an ETag); Redis increments
   *  are atomic, so there is nothing to condition on — always null. */
  etag: string | null;
}

/** Read the live counters (an untouched store seeds itself from
 *  the verified record first). */
export async function readCounters(): Promise<LoadedCounters | null> {
  const cfg = redisConfig();
  if (!cfg) return null;
  await ensureSeeded(cfg);
  return { counters: await loadCounters(cfg), etag: null };
}

/**
 * Increment one beat — a small pipeline of atomic increments, no
 * read-modify-write anywhere:
 * the lifetime total, the open day's count (read/listen/marked/
 * open beats only — listen_complete and book beats carry no day
 * count, exactly as before), the day's country/subdivision counts
 * (read/listen/open beats, and book beats as a finish count —
 * the finish's place, recorded since Oct 28, 2026), the lifetime
 * subdivision total, and
 * the updatedAt stamp. Then yesterday (if it just closed) is
 * assembled into the history. Returns the updated counters, or
 * null only when no store is configured.
 * A store error propagates — the route logs it and answers 503,
 * so a dropped beat is dropped loudly, never faked.
 */
export async function incrementCounters(
  kind: BeatKind,
  country: string | null,
  subdivision: string | null = null
): Promise<HbCounters | null> {
  const cfg = redisConfig();
  if (!cfg) return null;
  await ensureSeeded(cfg);
  const today = heartbeatToday();
  const commands: RedisCommand[] = [];
  const totalsField: Record<BeatKind, string> = {
    read: "chaptersRead",
    listen: "chaptersHeard",
    listen_complete: "listensCompleted",
    book: "booksFinished",
    listened_marked: "listensMarked",
    open: "opens",
  };
  commands.push(["HINCRBY", TOTALS, totalsField[kind], 1]);
  const dayField =
    kind === "read"
      ? "chaptersRead"
      : kind === "listen"
        ? "chaptersHeard"
        : kind === "listened_marked"
          ? "listensMarked"
          : kind === "open"
            ? "opens"
            : null;
  if (dayField) {
    commands.push(["HINCRBY", dayKey(today), dayField, 1]);
  }
  if (
    kind === "read" ||
    kind === "listen" ||
    kind === "open" ||
    kind === "book"
  ) {
    const field =
      kind === "read"
        ? "read"
        : kind === "listen"
          ? "heard"
          : kind === "open"
            ? "opens"
            : "books";
    if (country) {
      commands.push(["HINCRBY", geoKey(today), `c:${country}:${field}`, 1]);
    }
    if (subdivision) {
      commands.push([
        "HINCRBY",
        geoKey(today),
        `s:${subdivision}:${field}`,
        1,
      ]);
      commands.push(["HINCRBY", SUBTOTALS, `${subdivision}:${field}`, 1]);
    }
  }
  commands.push(["SADD", OPEN, today]);
  commands.push(["HSET", META, "updatedAt", new Date().toISOString()]);
  await redisPipeline(cfg, commands);
  await rollover(cfg);
  return loadCounters(cfg);
}

/** The public shape the homepage reads: totals, today's bucket,
 *  today's country rows, and today's subdivision rows (full ISO
 *  3166-2 codes, with country/region parts and a display name) —
 *  nothing else leaves the store. Since Oct 28, 2026 each place
 *  row also carries `bookFinishedOn`: the place's last
 *  book-finish date in the record, or null. */
export function publicView(c: HbCounters) {
  const todayKey = heartbeatToday();
  const today = c.days.find((d) => d.date === todayKey) ?? emptyDay(todayKey);
  /** Each place's LAST book-finish date in the record (Oct 28,
   *  2026): the latest day whose geo counts hold a finish for
   *  that place. Derived here from the day records — the record
   *  is the only source, so a finish is never claimed for a
   *  place or a day the count does not hold — and carried on the
   *  place's rows as `bookFinishedOn` (null when the place has
   *  no finish in the record). The map wears it as a gold ring
   *  for that one day; nothing else about the rows changes, and
   *  the finish counts themselves never fold into read/heard. */
  const lastFinishDates = (
    pick: (d: HbDay) => Record<string, HbCountryCounts>
  ): Map<string, string> => {
    const map = new Map<string, string>();
    for (const d of c.days) {
      for (const [code, v] of Object.entries(pick(d))) {
        if ((v.books ?? 0) > 0 && (map.get(code) ?? "") < d.date) {
          map.set(code, d.date);
        }
      }
    }
    return map;
  };
  const countryFinish = lastFinishDates((d) => d.countries ?? {});
  const subdivisionFinish = lastFinishDates((d) => d.subdivisions ?? {});
  const rows = (
    rec: Record<string, HbCountryCounts>,
    finish: Map<string, string>
  ) =>
    Object.entries(rec)
      .map(([code, v]) => ({
        code,
        read: v.read,
        heard: v.heard,
        opens: v.opens ?? 0,
        total: v.read + v.heard,
        bookFinishedOn: finish.get(code) ?? null,
      }))
      // A row stands when the place has ANY activity — chapters,
      // or opens alone (Oct 27, 2026: an opens-only place rests on
      // the map as an ember, so it must be in the rows to be seen).
      // `total` stays chapters only: opens are their own number,
      // never folded into read/heard.
      .filter((r) => r.total + r.opens > 0)
      .sort((a, b) => b.total - a.total || b.opens - a.opens);
  const namedSubdivisions = (rec: Record<string, HbCountryCounts>) =>
    rows(rec, subdivisionFinish).map((r) => {
      const parts = splitSubdivision(r.code);
      return {
        ...r,
        country: parts?.country ?? "",
        region: parts?.region ?? r.code,
        name: subdivisionName(r.code) ?? parts?.region ?? r.code,
      };
    });
  return {
    live: true as const,
    asOf: c.updatedAt,
    since: c.since,
    totals: c.totals,
    today: {
      date: today.date,
      chaptersRead: today.chaptersRead,
      chaptersHeard: today.chaptersHeard,
      listensMarked: today.listensMarked ?? 0,
      opens: today.opens ?? 0,
    },
    countries: rows(today.countries, countryFinish),
    subdivisions: namedSubdivisions(today.subdivisions ?? {}),
    /** The day-by-day record (Oct 21, 2026) — the same aggregates
     *  the store keeps per day: counts plus the place rows that lit
     *  that day, countries and subdivisions in the same shapes as
     *  today's rows above. It powers "The Vine Is Growing" on the
     *  homepage map: last week, last month, and the family's growth
     *  over time, public for any neighbor who wants to look. Still
     *  totals only — a day's story, never a person's. */
    history: c.days.map((d) => ({
      date: d.date,
      chaptersRead: d.chaptersRead,
      chaptersHeard: d.chaptersHeard,
      listensMarked: d.listensMarked ?? 0,
      opens: d.opens ?? 0,
      countries: rows(d.countries ?? {}, countryFinish),
      subdivisions: namedSubdivisions(d.subdivisions ?? {}),
    })),
  };
}
