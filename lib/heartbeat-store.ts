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
 * ever read or stored, and nothing finer than a country is kept.
 */
import { get, put, BlobPreconditionFailedError } from "@vercel/blob";
import snapshot from "@/data/heartbeat.json";

export const COUNTERS_PATH = "heartbeat/counters.json";

export type BeatKind = "read" | "listen" | "listen_complete" | "book";

export interface HbTotals {
  chaptersRead: number;
  chaptersHeard: number;
  listensCompleted: number;
  booksFinished: number;
}

export interface HbCountryCounts {
  read: number;
  heard: number;
}

export interface HbDay {
  date: string; // YYYY-MM-DD (UTC)
  chaptersRead: number;
  chaptersHeard: number;
  countries: Record<string, HbCountryCounts>;
}

export interface HbCounters {
  since: string;
  totals: HbTotals;
  /** Recent day buckets, ascending by date; pruned to the last 14. */
  days: HbDay[];
  updatedAt: string; // ISO timestamp of the last counted beat
}

interface SnapshotShape {
  since: string;
  totals: HbTotals;
  today: { date: string; chaptersRead: number; chaptersHeard: number };
}

const snap = snapshot as SnapshotShape;

export function storeConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyDay(date: string): HbDay {
  return { date, chaptersRead: 0, chaptersHeard: 0, countries: {} };
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
      countries: {},
    });
  }
  return {
    since: snap.since,
    totals: { ...snap.totals },
    days,
    updatedAt: new Date().toISOString(),
  };
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
    return { counters: JSON.parse(text) as HbCounters, etag: res.blob.etag };
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

function applyBeat(c: HbCounters, kind: BeatKind, country: string | null): void {
  const today = utcToday();
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
  switch (kind) {
    case "read":
      c.totals.chaptersRead += 1;
      day.chaptersRead += 1;
      bump(countryCounts, "read");
      break;
    case "listen":
      c.totals.chaptersHeard += 1;
      day.chaptersHeard += 1;
      bump(countryCounts, "heard");
      break;
    case "listen_complete":
      c.totals.listensCompleted += 1;
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
 */
export async function incrementCounters(
  kind: BeatKind,
  country: string | null
): Promise<HbCounters | null> {
  if (!storeConfigured()) return null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const loaded = await readCounters();
    if (!loaded) return null;
    applyBeat(loaded.counters, kind, country);
    try {
      await writeCounters(loaded.counters, loaded.etag);
      return loaded.counters;
    } catch (err) {
      if (err instanceof BlobPreconditionFailedError) continue;
      throw err;
    }
  }
  return null; // five lost races in a row — the beat is dropped, never faked
}

/** The public shape the homepage reads: totals, today's bucket, and
 *  today's country rows with counts — nothing else leaves the store. */
export function publicView(c: HbCounters) {
  const today = c.days.find((d) => d.date === utcToday()) ?? emptyDay(utcToday());
  const countries = Object.entries(today.countries)
    .map(([code, v]) => ({ code, read: v.read, heard: v.heard, total: v.read + v.heard }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);
  return {
    live: true as const,
    asOf: c.updatedAt,
    since: c.since,
    totals: c.totals,
    today: {
      date: today.date,
      chaptersRead: today.chaptersRead,
      chaptersHeard: today.chaptersHeard,
    },
    countries,
  };
}
