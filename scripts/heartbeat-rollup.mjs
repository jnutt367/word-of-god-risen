#!/usr/bin/env node
/**
 * Bible Heartbeat roll-up — refreshes data/heartbeat.json from the site's
 * own Vercel Analytics event totals. Run alongside the Field Report
 * heartbeat (daily), then commit + push: the deploy IS the refresh.
 *
 * The operator (Judah, in the heartbeat run) first queries all-time
 * custom-event counts from Vercel Analytics — via the Vercel connector
 * (count_events / aggregate_events) or the dashboard — and writes them
 * to a counts file:
 *
 *   {
 *     "through": "2026-10-16",                    // last counted day (YYYY-MM-DD)
 *     "totals": {                                  // CUMULATIVE, all time
 *       "chapter_read": 128,
 *       "chapter_listen_start": 74,
 *       "chapter_listen_complete": 51,
 *       "book_complete": 3
 *     },
 *     "today": { "date": "2026-10-16", "chapter_read": 12, "chapter_listen_start": 5 },
 *     "countries": [{ "name": "United States", "chaptersRead": 90 }],
 *     "countriesSource": "Where readers visit from — Vercel Analytics, all time.",
 *     "recent": [{ "book": "Genesis", "chapter": 3, "kind": "read", "date": "2026-10-16" }]
 *   }
 *
 * Only "through" and "totals" are required; the rest replace the
 * snapshot's matching fields when present and are left alone when not.
 * Numbers are copied, never computed from other numbers — if a count
 * can't be verified, leave it out and the snapshot keeps its last
 * honest value.
 *
 * Usage: node scripts/heartbeat-rollup.mjs <counts.json>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const snapshotPath = join(here, "..", "data", "heartbeat.json");

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("usage: node scripts/heartbeat-rollup.mjs <counts.json>");
  process.exit(1);
}

const input = JSON.parse(readFileSync(inputPath, "utf8"));
const snap = JSON.parse(readFileSync(snapshotPath, "utf8"));

if (!input.through || !input.totals) {
  console.error('counts file must carry "through" and "totals"');
  process.exit(1);
}

const num = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

snap.totals = {
  chaptersRead: num(input.totals.chapter_read),
  chaptersHeard: num(input.totals.chapter_listen_start),
  listensCompleted: num(input.totals.chapter_listen_complete),
  booksFinished: num(input.totals.book_complete),
};

if (input.today?.date) {
  snap.today = {
    date: input.today.date,
    chaptersRead: num(input.today.chapter_read),
    chaptersHeard: num(input.today.chapter_listen_start),
  };
}
if (Array.isArray(input.countries)) snap.countries = input.countries;
if (typeof input.countriesSource === "string") {
  snap.countriesSource = input.countriesSource;
}
if (Array.isArray(input.recent)) snap.recent = input.recent.slice(0, 12);
snap.updatedThrough = input.through;

writeFileSync(snapshotPath, JSON.stringify(snap, null, 2) + "\n");
console.log(
  `heartbeat.json → through ${snap.updatedThrough}: ` +
    `${snap.totals.chaptersRead} read · ${snap.totals.chaptersHeard} heard · ` +
    `${snap.totals.booksFinished} books finished`
);
