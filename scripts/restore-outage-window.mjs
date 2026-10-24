#!/usr/bin/env node
/**
 * Restore the Blob-lock outage window into the count-keeper's record.
 *
 * The window: from the Vercel Blob store's lock (~19:52 EDT, Oct 23,
 * 2026) until the Redis cutover. During it, heartbeat beats POSTed
 * to a dead store and were dropped by the live door — but the
 * Analytics door (Vercel Analytics custom events, fired client-side
 * behind the same dedupe) heard them. This tool folds that hearing
 * back into the live record by the codebase's standing merge rule —
 * the same one scripts/heartbeat-rollup.mjs applies to the snapshot:
 *
 *     restored = max(analytics, live)        (field by field)
 *
 * Both doors hear the same beats behind the same dedupe, so the max
 * can never double-count, and nothing here ever lowers a number.
 * Numbers are copied from the operator's counts file, never computed
 * from other numbers — if a count can't be verified, leave it out.
 *
 * Jason's ruling for this restoration (Oct 23, 2026): "if we know
 * that there's someone reading in a state that hasn't lit up just
 * turn that light on." So geography the window's analytics honestly
 * shows — this app's OWN Web Analytics geography for the window
 * days, copied into the counts file per day — is merged into the
 * record the same way (max per place per field), and any place that
 * has never lit before is lit by it, and NAMED in this tool's
 * output. Subdivision geography is restored only where that record
 * honestly carries it; nothing is estimated.
 *
 * What this tool does NOT restore: "Something sounds wrong" taps.
 * The tap fires no Analytics event (lib/audio-report.ts is a plain
 * POST), so taps made during the window left no second record and
 * cannot be brought back. Stated plainly, not papered over.
 *
 * Counts file shape (extends the roll-up's):
 *   {
 *     "window": { "from": "2026-10-23T19:52:00-04:00", "through": "2026-10-24" },
 *     "totals": {                       // Analytics ALL-TIME event totals
 *       "chapter_read": 171, "chapter_listen_start": 96,
 *       "chapter_listen_complete": 50, "book_complete": 2,
 *       "chapter_listened_marked": 51   // optional
 *     },
 *     "days": [                         // optional: per-day Analytics counts
 *       { "date": "2026-10-23", "chapter_read": 31, "chapter_listen_start": 21,
 *         "chapter_listened_marked": 13 }
 *     ],
 *     "geography": [                    // optional: per-day window geography,
 *       { "date": "2026-10-23",         // copied from this app's Web Analytics
 *         "countries":    [ { "code": "BS", "read": 1, "heard": 0 } ],
 *         "subdivisions": [ { "code": "US-GA", "read": 1, "heard": 0 } ] }
 *     ]
 *   }
 *
 * Usage: node scripts/restore-outage-window.mjs <counts.json> [--apply]
 * Dry-run by default: it prints exactly what would change, including
 * the NEW PLACES LIT lists, and writes nothing without --apply.
 * Credentials: the same env names the app reads (values never printed).
 */
import { readFileSync } from "node:fs";

const inputPath = process.argv[2];
const apply = process.argv.includes("--apply");
if (!inputPath) {
  console.error("usage: node scripts/restore-outage-window.mjs <counts.json> [--apply]");
  process.exit(1);
}
const input = JSON.parse(readFileSync(inputPath, "utf8"));
if (!input.totals) {
  console.error('counts file must carry "totals" (Analytics all-time event totals)');
  process.exit(1);
}

const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "").replace(/\/+$/, "");
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error("store env vars not set (UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN)");
  process.exit(1);
}

async function pipeline(commands) {
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`redis REST HTTP ${res.status}`);
  const replies = await res.json();
  return commands.map((c, i) => {
    if (replies[i]?.error) throw new Error(`redis ${c[0]} failed: ${replies[i].error}`);
    return replies[i]?.result;
  });
}
const hashToRecord = (flat) => {
  const out = {};
  if (Array.isArray(flat)) for (let i = 0; i + 1 < flat.length; i += 2) out[String(flat[i])] = String(flat[i + 1]);
  return out;
};
const toInt = (v) => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};
const num = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : undefined);
const emptyDay = (date) => ({ date, chaptersRead: 0, chaptersHeard: 0, listensMarked: 0, countries: {}, subdivisions: {} });

async function assemble() {
  const [metaF, totalsF, daysF, openRaw] = await pipeline([
    ["HGETALL", "hb:meta"], ["HGETALL", "hb:totals"], ["HGETALL", "hb:days"], ["SMEMBERS", "hb:opendays"],
  ]);
  const meta = hashToRecord(metaF);
  if (meta.seeded !== "1") {
    console.error("the store is not seeded yet — let the app serve one request (or run scripts/seed-count-store.mjs) first.");
    process.exit(1);
  }
  const t = hashToRecord(totalsF);
  const days = new Map();
  for (const [date, json] of Object.entries(hashToRecord(daysF))) {
    try { const d = JSON.parse(json); d.countries ??= {}; d.subdivisions ??= {}; d.listensMarked ??= 0; days.set(date, d); } catch { /* skip */ }
  }
  const open = new Set((Array.isArray(openRaw) ? openRaw : []).map(String));
  const closedDates = new Set(days.keys());
  const openPortions = new Map(); // date -> the open hashes' contribution alone
  for (const date of open) {
    const [scalars, geo] = await pipeline([["HGETALL", `hb:day:${date}`], ["HGETALL", `hb:day:${date}:geo`]]);
    const s = hashToRecord(scalars), g = hashToRecord(geo);
    const portion = emptyDay(date);
    portion.chaptersRead = toInt(s.chaptersRead); portion.chaptersHeard = toInt(s.chaptersHeard); portion.listensMarked = toInt(s.listensMarked);
    for (const [f, v] of Object.entries(g)) {
      const [scope, code, which] = f.split(":");
      if (which !== "read" && which !== "heard") continue;
      const rec = scope === "c" ? (portion.countries[code] ??= { read: 0, heard: 0 }) : scope === "s" ? (portion.subdivisions[code] ??= { read: 0, heard: 0 }) : null;
      if (rec) rec[which] = toInt(v);
    }
    openPortions.set(date, portion);
    const day = days.get(date) ?? emptyDay(date);
    day.chaptersRead += portion.chaptersRead; day.chaptersHeard += portion.chaptersHeard; day.listensMarked += portion.listensMarked;
    for (const kind of ["countries", "subdivisions"]) {
      for (const [code, v] of Object.entries(portion[kind])) {
        const rec = (day[kind][code] ??= { read: 0, heard: 0 });
        rec.read += v.read; rec.heard += v.heard;
      }
    }
    days.set(date, day);
  }
  return {
    totals: { chaptersRead: toInt(t.chaptersRead), chaptersHeard: toInt(t.chaptersHeard), listensCompleted: toInt(t.listensCompleted), booksFinished: toInt(t.booksFinished), listensMarked: toInt(t.listensMarked) },
    days, open, openPortions, closedDates,
  };
}

/** merged minus an open day's portion = what the CLOSED record must
 *  hold so that closed + open (the store's own assembly) reproduces
 *  merged exactly — never the full values, or the open increments
 *  would be counted twice. */
function subtractPortion(merged, portion) {
  const sub = (a, b) => Math.max(0, a - b);
  const out = emptyDay(merged.date);
  out.chaptersRead = sub(merged.chaptersRead, portion?.chaptersRead ?? 0);
  out.chaptersHeard = sub(merged.chaptersHeard, portion?.chaptersHeard ?? 0);
  out.listensMarked = sub(merged.listensMarked, portion?.listensMarked ?? 0);
  for (const kind of ["countries", "subdivisions"]) {
    for (const [code, v] of Object.entries(merged[kind])) {
      const o = portion?.[kind]?.[code] ?? { read: 0, heard: 0 };
      const r = sub(v.read, o.read), h = sub(v.heard, o.heard);
      if (r > 0 || h > 0) out[kind][code] = { read: r, heard: h };
    }
  }
  return out;
}

const before = await assemble();
const after = JSON.parse(JSON.stringify({ totals: before.totals, days: [...before.days.values()] }));
const afterDays = new Map(after.days.map((d) => [d.date, d]));
const getDay = (date) => {
  let d = afterDays.get(date);
  if (!d) { d = emptyDay(date); afterDays.set(date, d); }
  return d;
};

// Totals — the merge rule, field by field.
const FIELD_MAP = [
  ["chapter_read", "chaptersRead"],
  ["chapter_listen_start", "chaptersHeard"],
  ["chapter_listen_complete", "listensCompleted"],
  ["book_complete", "booksFinished"],
  ["chapter_listened_marked", "listensMarked"],
];
for (const [src, dst] of FIELD_MAP) {
  const v = num(input.totals[src]);
  if (v !== undefined) after.totals[dst] = Math.max(after.totals[dst], v);
}

// Per-day counts — the same rule per day bucket.
for (const row of input.days ?? []) {
  if (!row?.date) continue;
  const day = getDay(row.date);
  const r = num(row.chapter_read), h = num(row.chapter_listen_start), m = num(row.chapter_listened_marked);
  if (r !== undefined) day.chaptersRead = Math.max(day.chaptersRead, r);
  if (h !== undefined) day.chaptersHeard = Math.max(day.chaptersHeard, h);
  if (m !== undefined) day.listensMarked = Math.max(day.listensMarked, m);
}

// Geography — the same rule per place per field (Jason's ruling:
// known reading lights the place).
for (const row of input.geography ?? []) {
  if (!row?.date) continue;
  const day = getDay(row.date);
  for (const [list, target] of [[row.countries, day.countries], [row.subdivisions, day.subdivisions]]) {
    for (const place of list ?? []) {
      if (!place?.code) continue;
      const rec = (target[place.code] ??= { read: 0, heard: 0 });
      const r = num(place.read), h = num(place.heard);
      if (r !== undefined) rec.read = Math.max(rec.read, r);
      if (h !== undefined) rec.heard = Math.max(rec.heard, h);
    }
  }
}

// New places lit: codes present after, absent anywhere before.
const placesOf = (dayList, kind) => {
  const set = new Set();
  for (const d of dayList) for (const code of Object.keys(d[kind])) set.add(code);
  return set;
};
const beforeCountries = placesOf(before.days.values(), "countries");
const beforeSubs = placesOf(before.days.values(), "subdivisions");
const afterDayList = [...afterDays.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
const newCountries = [...placesOf(afterDayList, "countries")].filter((c) => !beforeCountries.has(c));
const newSubs = [...placesOf(afterDayList, "subdivisions")].filter((c) => !beforeSubs.has(c));
const litOn = (kind, code) => afterDayList.filter((d) => d[kind][code]).map((d) => d.date).join(", ");

// Nothing may ever decrease.
for (const f of Object.keys(after.totals)) {
  if (after.totals[f] < before.totals[f]) { console.error(`REFUSING: ${f} would decrease`); process.exit(1); }
}

console.log(`window: ${input.window?.from ?? "?"} → ${input.window?.through ?? "?"}`);
console.log("totals before:", JSON.stringify(before.totals));
console.log("totals after: ", JSON.stringify(after.totals));
const changedDays = afterDayList.filter((d) => JSON.stringify(d) !== JSON.stringify(before.days.get(d.date) ?? null));
for (const d of changedDays) console.log(`day ${d.date}: → ${d.chaptersRead} read · ${d.chaptersHeard} heard · ${d.listensMarked} marked · countries ${JSON.stringify(d.countries)} · subdivisions ${JSON.stringify(d.subdivisions)}`);
console.log("NEW COUNTRIES LIT:", newCountries.length ? newCountries.map((c) => `${c} (on ${litOn("countries", c)})`).join("; ") : "none");
console.log("NEW SUBDIVISIONS LIT:", newSubs.length ? newSubs.map((c) => `${c} (on ${litOn("subdivisions", c)})`).join("; ") : "none");
console.log("NOTE: audio reports are not touched — taps made during the window have no Analytics record and cannot be restored.");

if (!apply) {
  console.log("DRY RUN — nothing written. Re-run with --apply to fold this into the record.");
  process.exit(0);
}

// Write back: totals, subdivision lifetime totals (recomputed from
// the merged days, their source), and every changed day — through
// its open hashes if the day is still open, else as a closed record.
const subTotals = {};
for (const d of afterDayList) for (const [code, v] of Object.entries(d.subdivisions)) {
  const t = (subTotals[code] ??= { read: 0, heard: 0 });
  t.read += v.read; t.heard += v.heard;
}
const commands = [
  ["HSET", "hb:totals", "chaptersRead", after.totals.chaptersRead, "chaptersHeard", after.totals.chaptersHeard,
   "listensCompleted", after.totals.listensCompleted, "booksFinished", after.totals.booksFinished, "listensMarked", after.totals.listensMarked],
];
const subArgs = [];
for (const [code, v] of Object.entries(subTotals)) subArgs.push(`${code}:read`, v.read, `${code}:heard`, v.heard);
if (subArgs.length) commands.push(["HSET", "hb:subtotals", ...subArgs]);
for (const d of changedDays) {
  if (before.open.has(d.date) && !before.closedDates.has(d.date)) {
    // The day lives only in its open hashes — set them to the
    // merged values outright.
    commands.push(["HSET", `hb:day:${d.date}`, "chaptersRead", d.chaptersRead, "chaptersHeard", d.chaptersHeard, "listensMarked", d.listensMarked]);
    const geoArgs = [];
    for (const [code, v] of Object.entries(d.countries)) geoArgs.push(`c:${code}:read`, v.read, `c:${code}:heard`, v.heard);
    for (const [code, v] of Object.entries(d.subdivisions)) geoArgs.push(`s:${code}:read`, v.read, `s:${code}:heard`, v.heard);
    if (geoArgs.length) commands.push(["HSET", `hb:day:${d.date}:geo`, ...geoArgs]);
  } else if (before.open.has(d.date)) {
    // The day stands BOTH closed and open (the seeded migration
    // day is exactly this): the closed record takes the merged
    // values minus the open hashes' portion, and the open hashes
    // keep their increments untouched — closed + open then
    // reproduces the merged day exactly, nothing counted twice.
    commands.push(["HSET", "hb:days", d.date, JSON.stringify(subtractPortion(d, before.openPortions.get(d.date)))]);
  } else {
    commands.push(["HSET", "hb:days", d.date, JSON.stringify(d)]);
  }
}
await pipeline(commands);
console.log(`APPLIED: ${commands.length} pipeline commands written. Verify with GET /api/heartbeat and scripts/seed-count-store.mjs --verify.`);
