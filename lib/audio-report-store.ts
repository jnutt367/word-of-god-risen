/**
 * Listener audio reports — server-side only.
 *
 * One small JSON document in the project's private Vercel Blob store
 * ("word-of-god-risen-blob", the same store the Bible Heartbeat uses)
 * holds the counts for the reader's "Something sounds wrong" tap
 * (Jason's idea, Oct 21, 2026 — the night a TTS meltdown in Mark 12
 * reached listeners' ears before it reached ours).
 *
 * A report carries exactly three things: the book, the chapter, and
 * the day. Nothing about the reader — no identity, no geography, no
 * IP — is read or stored. The counts exist so a damaged chapter
 * finds us before the next listener finds it. See AUDIO-REPORTS.md.
 */
import { get, put, BlobPreconditionFailedError } from "@vercel/blob";
import { heartbeatToday } from "@/lib/heartbeat-date";

export const REPORTS_PATH = "reports/audio-reports.json";

/** Per chapter ("mark:12") report count for one day. */
export type ReportDayChapters = Record<string, number>;

export interface ReportDay {
  date: string; // YYYY-MM-DD (America/New_York calendar day)
  chapters: ReportDayChapters;
}

export interface AudioReports {
  since: string;
  /** Lifetime report counts per chapter ("mark:12"). */
  totals: Record<string, number>;
  /** Recent day buckets, ascending by date; pruned to the last 14. */
  days: ReportDay[];
  updatedAt: string;
}

export function storeConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function emptyReports(): AudioReports {
  return {
    since: new Date().toISOString().slice(0, 10),
    totals: {},
    days: [],
    updatedAt: new Date().toISOString(),
  };
}

function normalizeReports(r: AudioReports): AudioReports {
  r.totals ??= {};
  r.days ??= [];
  for (const day of r.days) day.chapters ??= {};
  return r;
}

interface LoadedReports {
  reports: AudioReports;
  etag: string | null;
}

export async function readReports(): Promise<LoadedReports | null> {
  if (!storeConfigured()) return null;
  const res = await get(REPORTS_PATH, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200 || !res.stream) {
    return { reports: emptyReports(), etag: null };
  }
  const text = await new Response(res.stream).text();
  try {
    return {
      reports: normalizeReports(JSON.parse(text) as AudioReports),
      etag: res.blob.etag,
    };
  } catch {
    return { reports: emptyReports(), etag: res.blob.etag };
  }
}

async function writeReports(reports: AudioReports, etag: string | null): Promise<void> {
  await put(REPORTS_PATH, JSON.stringify(reports), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    ...(etag ? { ifMatch: etag } : {}),
  });
}

function applyReport(r: AudioReports, key: string): void {
  const today = heartbeatToday();
  let day = r.days.find((d) => d.date === today);
  if (!day) {
    day = { date: today, chapters: {} };
    r.days.push(day);
    r.days.sort((a, b) => (a.date < b.date ? -1 : 1));
    r.days = r.days.slice(-14);
  }
  day.chapters[key] = (day.chapters[key] ?? 0) + 1;
  r.totals[key] = (r.totals[key] ?? 0) + 1;
  r.updatedAt = new Date().toISOString();
}

/**
 * Increment one report. Read-modify-write with optimistic
 * concurrency, mirroring the heartbeat store: a lost ETag race
 * retries against the fresh document, and if the conditional write
 * still cannot land, one final unconditional write rescues the
 * report rather than dropping it (the frozen-store lesson,
 * Oct 20, 2026). Returns false only when the store is unconfigured
 * or every attempt failed.
 */
export async function incrementReports(key: string): Promise<boolean> {
  const loaded = await readReports();
  if (!loaded) return false;
  applyReport(loaded.reports, key);
  try {
    await writeReports(loaded.reports, loaded.etag);
    return true;
  } catch (err) {
    if (!(err instanceof BlobPreconditionFailedError)) throw err;
  }
  const fresh = await readReports();
  if (!fresh) return false;
  applyReport(fresh.reports, key);
  try {
    await writeReports(fresh.reports, fresh.etag);
    return true;
  } catch (err) {
    if (!(err instanceof BlobPreconditionFailedError)) throw err;
  }
  const last = await readReports();
  if (!last) return false;
  applyReport(last.reports, key);
  await writeReports(last.reports, null);
  return true;
}
