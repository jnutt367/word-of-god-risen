/**
 * Listener audio reports — server-side only.
 *
 * The counts for the reader's "Something sounds wrong" tap (Jason's
 * idea, Oct 21, 2026 — the night a TTS meltdown in Mark 12 reached
 * listeners' ears before it reached ours).
 *
 * A report carries exactly three things: the book, the chapter, and
 * the day. Nothing about the reader — no identity, no geography, no
 * IP — is read or stored. The counts exist so a damaged chapter
 * finds us before the next listener finds it. See AUDIO-REPORTS.md.
 *
 * THE STORE MOVED (Oct 23, 2026) with the Bible Heartbeat's: the
 * private Vercel Blob store that held both documents hit its plan
 * ceiling and locked, so the reports now live in the same Upstash
 * Redis database as the counters (free tier, REST — see
 * lib/redis-rest.ts and HEARTBEAT.md's v4 section). Layout, all
 * keys under "ar:":
 *   ar:meta        hash — since, updatedAt, seeded marker
 *   ar:totals      hash — lifetime counts per chapter ("mark:12")
 *   ar:days        hash — CLOSED day buckets, field = date, value =
 *                  the day's JSON ({ date, chapters })
 *   ar:opendays    set  — dates whose day is still open
 *   ar:day:<date>  hash — the open day's per-chapter counts
 * Writes are atomic increments (HINCRBY); a day assembles into
 * ar:days when it closes, exactly like the heartbeat's. The seed
 * (data/audio-reports-seed.json) is the Blob store's last verified
 * record — the Oct 23, 19:42 EDT snapshot plus Jason's matthew:27
 * tap of ~19:49 EDT that evening (pre-lock, confirmed by Jason and
 * the flag ledger) — so an empty store resumes from the truth.
 */
import { heartbeatToday } from "@/lib/heartbeat-date";
import {
  hashToRecord,
  redisCommand,
  redisConfig,
  redisPipeline,
  toInt,
  type RedisCommand,
  type RedisConfig,
} from "@/lib/redis-rest";
import seedSnapshot from "@/data/audio-reports-seed.json";

/** The reports' home key in the Redis store (in the Blob days this
 *  named the document path, "reports/audio-reports.json"). */
export const REPORTS_PATH = "ar:meta";

const META = "ar:meta";
const TOTALS = "ar:totals";
const DAYS = "ar:days";
const OPEN = "ar:opendays";
const dayKey = (date: string) => `ar:day:${date}`;

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
  return redisConfig() !== null;
}

export function emptyReports(): AudioReports {
  return {
    since: new Date().toISOString().slice(0, 10),
    totals: {},
    days: [],
    updatedAt: new Date().toISOString(),
  };
}

/** The seed: the reports' last verified record (see the header). */
export function seedReports(): AudioReports {
  return normalizeReports(
    JSON.parse(JSON.stringify(seedSnapshot)) as AudioReports
  );
}

function normalizeReports(r: AudioReports): AudioReports {
  r.totals ??= {};
  r.days ??= [];
  for (const day of r.days) day.chapters ??= {};
  return r;
}

function parseDay(json: string, date: string): ReportDay {
  try {
    const day = JSON.parse(json) as ReportDay;
    day.date = date;
    day.chapters ??= {};
    return day;
  } catch {
    return { date, chapters: {} };
  }
}

function seedCommands(r: AudioReports): RedisCommand[] {
  const commands: RedisCommand[] = [
    ["HSET", META, "since", r.since, "updatedAt", r.updatedAt, "seeded", "1"],
  ];
  const totalArgs: (string | number)[] = [];
  for (const [key, count] of Object.entries(r.totals)) {
    totalArgs.push(key, count);
  }
  if (totalArgs.length > 0) commands.push(["HSET", TOTALS, ...totalArgs]);
  if (r.days.length > 0) {
    const dayArgs: (string | number)[] = [];
    for (const day of r.days) dayArgs.push(day.date, JSON.stringify(day));
    commands.push(["HSET", DAYS, ...dayArgs]);
  }
  return commands;
}

/** Seed an untouched store from the verified record (see
 *  lib/heartbeat-store.ts for the marker pattern). */
async function ensureSeeded(cfg: RedisConfig): Promise<void> {
  const won = await redisCommand(cfg, ["HSETNX", META, "seeded", "1"]);
  if (won === 1) {
    await redisPipeline(cfg, seedCommands(seedReports()));
  }
}

/** Assemble the full reports document from the store's keys. */
async function loadReports(cfg: RedisConfig): Promise<AudioReports> {
  const [metaFlat, totalsFlat, daysFlat, openRaw] = await redisPipeline(cfg, [
    ["HGETALL", META],
    ["HGETALL", TOTALS],
    ["HGETALL", DAYS],
    ["SMEMBERS", OPEN],
  ]);
  const meta = hashToRecord(metaFlat);
  const totals: Record<string, number> = {};
  for (const [key, value] of Object.entries(hashToRecord(totalsFlat))) {
    totals[key] = toInt(value);
  }
  const daysByDate = new Map<string, ReportDay>();
  for (const [date, json] of Object.entries(hashToRecord(daysFlat))) {
    daysByDate.set(date, parseDay(json, date));
  }
  const openDates = Array.isArray(openRaw) ? openRaw.map(String) : [];
  for (const date of openDates) {
    const flat = await redisCommand(cfg, ["HGETALL", dayKey(date)]);
    const day = daysByDate.get(date) ?? { date, chapters: {} };
    for (const [key, value] of Object.entries(hashToRecord(flat))) {
      day.chapters[key] = (day.chapters[key] ?? 0) + toInt(value);
    }
    daysByDate.set(date, day);
  }
  const seed = seedReports();
  return normalizeReports({
    since: meta.since || seed.since,
    totals,
    days: [...daysByDate.values()]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-14),
    updatedAt: meta.updatedAt || seed.updatedAt,
  });
}

/** Close any open day older than today into ar:days, pruning the
 *  closed history to its last 14 days. Runs on the report path,
 *  after the report has landed. */
async function rollover(cfg: RedisConfig): Promise<void> {
  const today = heartbeatToday();
  const openRaw = await redisCommand(cfg, ["SMEMBERS", OPEN]);
  const openDates = Array.isArray(openRaw) ? openRaw.map(String) : [];
  const old = openDates.filter((d) => d < today).sort();
  for (const date of old) {
    const [chaptersFlat, closedRaw] = await redisPipeline(cfg, [
      ["HGETALL", dayKey(date)],
      ["HGET", DAYS, date],
    ]);
    const merged =
      typeof closedRaw === "string" && closedRaw
        ? parseDay(closedRaw, date)
        : { date, chapters: {} };
    for (const [key, value] of Object.entries(hashToRecord(chaptersFlat))) {
      merged.chapters[key] = (merged.chapters[key] ?? 0) + toInt(value);
    }
    await redisPipeline(cfg, [
      ["HSET", DAYS, date, JSON.stringify(merged)],
      ["SREM", OPEN, date],
      ["DEL", dayKey(date)],
    ]);
  }
  if (old.length > 0) {
    const keysRaw = await redisCommand(cfg, ["HKEYS", DAYS]);
    const keys = (Array.isArray(keysRaw) ? keysRaw.map(String) : []).sort();
    if (keys.length > 14) {
      await redisCommand(cfg, ["HDEL", DAYS, ...keys.slice(0, keys.length - 14)]);
    }
  }
}

interface LoadedReports {
  reports: AudioReports;
  /** Kept for shape with the Blob days (an ETag); Redis increments
   *  are atomic, so there is nothing to condition on — always null. */
  etag: string | null;
}

export async function readReports(): Promise<LoadedReports | null> {
  const cfg = redisConfig();
  if (!cfg) return null;
  await ensureSeeded(cfg);
  return { reports: await loadReports(cfg), etag: null };
}

/**
 * Increment one report — atomic increments only: the lifetime
 * total, the open day's count for the chapter, and the updatedAt
 * stamp; then yesterday (if it just closed) is assembled into the
 * history. Returns false only when no store is configured; a store
 * error propagates to the route, which logs it and answers 503 —
 * a lost report is a pity, never a silent one in the logs.
 */
export async function incrementReports(key: string): Promise<boolean> {
  const cfg = redisConfig();
  if (!cfg) return false;
  await ensureSeeded(cfg);
  const today = heartbeatToday();
  await redisPipeline(cfg, [
    ["HINCRBY", TOTALS, key, 1],
    ["HINCRBY", dayKey(today), key, 1],
    ["SADD", OPEN, today],
    ["HSET", META, "updatedAt", new Date().toISOString()],
  ]);
  await rollover(cfg);
  return true;
}
