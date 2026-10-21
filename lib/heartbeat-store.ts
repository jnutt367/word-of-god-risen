/**
 * The Bible Heartbeat — live counters (v3), server-side only.
 *
 * One small JSON document in the project's private Vercel Blob store
 * ("word-of-god-risen-blob", connected Oct 15, 2026) holds the live
 * totals. The heartbeat API route (app/api/heartbeat/route.ts) is the
 * only reader/writer. See HEARTBEAT.md for the schema, the merge rule
 * that reconciles these counters with the Analytics record, and the
 * known limits.
 *
 * Privacy, unchanged from v1: totals only. A beat carries no identity —
 * the only geography stored is the reader session's COUNTRY, derived by
 * the route from Vercel's edge header (x-vercel-ip-country). No IP is
 * ever read or stored. Since v3.1, a beat may also record its
 * SUBDIVISION — the full ISO 3166-2 code ("US-FL") of the connection's
 * first-level region (x-vercel-ip-country-region, sanitized per
 * country by lib/subdivisions.ts; v3.1 covers the US: 50 states + DC)
 * — a subdivision-level aggregate only, stored as a count beside a
 * subdivision code exactly like the count beside a country code;
 * nothing about any person is gathered or kept. The schema is keyed
 * generically (ISO 3166-2), never US-specific in shape, so the
 * worldwide admin-1 pass (v3.2) slots in without rework.
 */
import { get, put, BlobPreconditionFailedError } from "@vercel/blob";
import { heartbeatToday } from "@/lib/heartbeat-date";
import { splitSubdivision, subdivisionName } from "@/lib/subdivisions";
import snapshot from "@/data/heartbeat.json";

export const COUNTERS_PATH = "heartbeat/counters.json";

export type BeatKind =
  | "read"
  | "listen"
  | "listen_complete"
  | "book"
  | "listened_marked";

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
}

export interface HbCountryCounts {
  read: number;
  heard: number;
}

export interface HbDay {
  date: string; // YYYY-MM-DD (America/New_York calendar day)
  chaptersRead: number;
  chaptersHeard: number;
  /** Chapters marked "I listened" by their own listeners that day.
   *  Carries no country/subdivision attribution — like
   *  listen_complete, a marked beat records the count only. */
  listensMarked: number;
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
  /** Recent day buckets, ascending by date; pruned to the last 14. */
  days: HbDay[];
  updatedAt: string; // ISO timestamp of the last counted beat
}

interface SnapshotShape {
  since: string;
  /** The checked-in snapshot predates listensMarked; the field is
   *  optional there and the seed supplies 0 (see seedCounters). */
  totals: Omit<HbTotals, "listensMarked"> & { listensMarked?: number };
  today: { date: string; chaptersRead: number; chaptersHeard: number };
}

const snap = snapshot as SnapshotShape;

export function storeConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function emptyDay(date: string): HbDay {
  return {
    date,
    chaptersRead: 0,
    chaptersHeard: 0,
    listensMarked: 0,
    countries: {},
    subdivisions: {},
  };
}

/**
 * The seed: the checked-in snapshot's totals (the permanent record
 * through the last roll-up), so the live counters start from the truth
 * and never below it. Day/country detail starts empty — pre-Blob beats
 * carried no country attribution, and none is invented for them.
 */
export function seedCounters(): HbCounters {
  const days: HbDay[] = [];
  if (snap.today.chaptersRead + snap.today.chaptersHeard > 0) {
    days.push({
      date: snap.today.date,
      chaptersRead: snap.today.chaptersRead,
      chaptersHeard: snap.today.chaptersHeard,
      listensMarked: 0,
      countries: {},
      subdivisions: {},
    });
  }
  return {
    since: snap.since,
    totals: { ...snap.totals, listensMarked: snap.totals.listensMarked ?? 0 },
    subdivisionTotals: {},
    days,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Fill fields a counters document written by an older version lacks
 * (v3 documents predate `subdivisionTotals` and the day-level
 * `subdivisions`; documents before Oct 20, 2026 predate
 * `listensMarked`), so an upgrade never has to migrate the stored
 * JSON by hand.
 */
function normalizeCounters(c: HbCounters): HbCounters {
  c.subdivisionTotals ??= {};
  c.totals.listensMarked ??= 0;
  for (const day of c.days) {
    day.countries ??= {};
    day.subdivisions ??= {};
    day.listensMarked ??= 0;
  }
  return c;
}

interface LoadedCounters {
  counters: HbCounters;
  /** ETag of the stored document, for conditional writes; null if new. */
  etag: string | null;
}

/** Read the live counters (seeded in memory if the document is new). */
export async function readCounters(): Promise<LoadedCounters | null> {
  if (!storeConfigured()) return null;
  const res = await get(COUNTERS_PATH, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200 || !res.stream) {
    return { counters: seedCounters(), etag: null };
  }
  const text = await new Response(res.stream).text();
  try {
    return {
      counters: normalizeCounters(JSON.parse(text) as HbCounters),
      etag: res.blob.etag,
    };
  } catch {
    return { counters: seedCounters(), etag: res.blob.etag };
  }
}

async function writeCounters(counters: HbCounters, etag: string | null): Promise<void> {
  await put(COUNTERS_PATH, JSON.stringify(counters), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    ...(etag ? { ifMatch: etag } : {}),
  });
}

function applyBeat(
  c: HbCounters,
  kind: BeatKind,
  country: string | null,
  subdivision: string | null
): void {
  const today = heartbeatToday();
  let day = c.days.find((d) => d.date === today);
  if (!day) {
    day = emptyDay(today);
    c.days.push(day);
    c.days.sort((a, b) => (a.date < b.date ? -1 : 1));
    c.days = c.days.slice(-14);
  }
  const bump = (cc: HbCountryCounts | undefined, field: "read" | "heard") => {
    if (cc) cc[field] += 1;
  };
  const countryCounts = country
    ? (day.countries[country] ??= { read: 0, heard: 0 })
    : undefined;
  // Subdivision counts ride along with read/listen beats only,
  // exactly like country counts. `subdivision` arrives pre-sanitized
  // from the route as a full ISO 3166-2 code ("US-FL") whose country
  // part matches the beat's country — the route guarantees both.
  const subdivisionCounts = subdivision
    ? (day.subdivisions[subdivision] ??= { read: 0, heard: 0 })
    : undefined;
  const subdivisionTotalsCounts = subdivision
    ? (c.subdivisionTotals[subdivision] ??= { read: 0, heard: 0 })
    : undefined;
  switch (kind) {
    case "read":
      c.totals.chaptersRead += 1;
      day.chaptersRead += 1;
      bump(countryCounts, "read");
      bump(subdivisionCounts, "read");
      bump(subdivisionTotalsCounts, "read");
      break;
    case "listen":
      c.totals.chaptersHeard += 1;
      day.chaptersHeard += 1;
      bump(countryCounts, "heard");
      bump(subdivisionCounts, "heard");
      bump(subdivisionTotalsCounts, "heard");
      break;
    case "listen_complete":
      c.totals.listensCompleted += 1;
      break;
    case "listened_marked":
      // The reader's own word — its own total and its own day count,
      // never folded into the measured listensCompleted, and (like
      // listen_complete) no geography: the button records that a
      // listener said they listened, nothing about where.
      c.totals.listensMarked += 1;
      day.listensMarked += 1;
      break;
    case "book":
      c.totals.booksFinished += 1;
      break;
  }
  c.updatedAt = new Date().toISOString();
}

/**
 * Increment one beat. Read-modify-write with optimistic concurrency:
 * the write is conditional on the ETag just read, and a lost race
 * retries against the fresh document. At this ministry's scale the
 * window is tiny; HEARTBEAT.md names the residual limit honestly.
 *
 * The rescue (Oct 20, 2026 — see HEARTBEAT.md, "The frozen store"):
 * if every conditional write fails on its precondition, the beat is
 * no longer dropped. One final attempt re-reads the document fresh
 * and writes it back unconditionally. A stored document whose ETag
 * can never match again would otherwise deadlock every future beat
 * silently — reads stay healthy, writes all "lose the race," and the
 * counters freeze while looking live. The rescue write also heals
 * the document: later beats read the ETag of the rescued write and
 * conditional writes work again. Every failure on the way is logged
 * (console.error) so the next failure carries its cause with it.
 */
export async function incrementCounters(
  kind: BeatKind,
  country: string | null,
  subdivision: string | null = null
): Promise<HbCounters | null> {
  if (!storeConfigured()) return null;
  let preconditionFailures = 0;
  for (let attempt = 0; attempt < 5; attempt++) {
    const loaded = await readCounters();
    if (!loaded) return null;
    applyBeat(loaded.counters, kind, country, subdivision);
    try {
      await writeCounters(loaded.counters, loaded.etag);
      return loaded.counters;
    } catch (err) {
      if (err instanceof BlobPreconditionFailedError) {
        preconditionFailures += 1;
        continue;
      }
      console.error(
        `[heartbeat] conditional write failed (attempt ${attempt + 1}/5):`,
        err
      );
      throw err;
    }
  }
  if (preconditionFailures > 0) {
    console.error(
      `[heartbeat] ${preconditionFailures} conditional writes lost their precondition; attempting one unconditional rescue write`
    );
    const loaded = await readCounters();
    if (!loaded) return null;
    applyBeat(loaded.counters, kind, country, subdivision);
    await writeCounters(loaded.counters, null);
    return loaded.counters;
  }
  return null; // five lost races in a row — the beat is dropped, never faked
}

/** The public shape the homepage reads: totals, today's bucket,
 *  today's country rows, and today's subdivision rows (full ISO
 *  3166-2 codes, with country/region parts and a display name) —
 *  nothing else leaves the store. */
export function publicView(c: HbCounters) {
  const todayKey = heartbeatToday();
  const today = c.days.find((d) => d.date === todayKey) ?? emptyDay(todayKey);
  const rows = (rec: Record<string, HbCountryCounts>) =>
    Object.entries(rec)
      .map(([code, v]) => ({ code, read: v.read, heard: v.heard, total: v.read + v.heard }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
  const subdivisionRows = rows(today.subdivisions ?? {}).map((r) => {
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
    },
    countries: rows(today.countries),
    subdivisions: subdivisionRows,
  };
}
