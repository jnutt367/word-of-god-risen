#!/usr/bin/env node
/**
 * Seed (or verify) the count-keeper's Redis store from the checked-in
 * verified records — data/heartbeat-seed.json and
 * data/audio-reports-seed.json (the Blob store's last verified state,
 * Oct 23, 2026; see HEARTBEAT.md "v4").
 *
 * The app seeds an untouched store itself on first touch (the stores
 * in lib/ do exactly this), so this script is the operator's hand
 * tool: run it against a fresh database to lay the seed down ahead
 * of the first request, or with --verify to read a store back and
 * compare it against the seed files.
 *
 * Credentials come from the environment, the same names the app
 * reads: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (or
 * KV_REST_API_URL / KV_REST_API_TOKEN). Values are never printed.
 *
 * Usage:
 *   node scripts/seed-count-store.mjs           # seed if unseeded
 *   node scripts/seed-count-store.mjs --force   # re-write the seed
 *   node scripts/seed-count-store.mjs --verify  # read back + compare
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const hbSeed = JSON.parse(readFileSync(join(here, "..", "data", "heartbeat-seed.json"), "utf8"));
const arSeed = JSON.parse(readFileSync(join(here, "..", "data", "audio-reports-seed.json"), "utf8"));

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
const cmd = async (c) => (await pipeline([c]))[0];
const hashToRecord = (flat) => {
  const out = {};
  if (Array.isArray(flat)) for (let i = 0; i + 1 < flat.length; i += 2) out[String(flat[i])] = String(flat[i + 1]);
  return out;
};
const toInt = (v) => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

function hbSeedCommands(c) {
  const commands = [
    ["HSET", "hb:meta", "since", c.since, "updatedAt", c.updatedAt, "seeded", "1"],
    ["HSET", "hb:totals", "chaptersRead", c.totals.chaptersRead, "chaptersHeard", c.totals.chaptersHeard,
     "listensCompleted", c.totals.listensCompleted, "booksFinished", c.totals.booksFinished, "listensMarked", c.totals.listensMarked],
  ];
  const subs = [];
  for (const [code, v] of Object.entries(c.subdivisionTotals)) subs.push(`${code}:read`, v.read, `${code}:heard`, v.heard);
  if (subs.length) commands.push(["HSET", "hb:subtotals", ...subs]);
  if (c.days.length) {
    const args = [];
    for (const d of c.days) args.push(d.date, JSON.stringify(d));
    commands.push(["HSET", "hb:days", ...args]);
  }
  return commands;
}

function arSeedCommands(r) {
  const commands = [["HSET", "ar:meta", "since", r.since, "updatedAt", r.updatedAt, "seeded", "1"]];
  const totals = [];
  for (const [k, v] of Object.entries(r.totals)) totals.push(k, v);
  if (totals.length) commands.push(["HSET", "ar:totals", ...totals]);
  if (r.days.length) {
    const args = [];
    for (const d of r.days) args.push(d.date, JSON.stringify(d));
    commands.push(["HSET", "ar:days", ...args]);
  }
  return commands;
}

async function assembleHeartbeat() {
  const [metaF, totalsF, daysF, openRaw] = await pipeline([
    ["HGETALL", "hb:meta"], ["HGETALL", "hb:totals"], ["HGETALL", "hb:days"], ["SMEMBERS", "hb:opendays"],
  ]);
  const days = new Map();
  for (const [date, json] of Object.entries(hashToRecord(daysF))) {
    try { days.set(date, JSON.parse(json)); } catch { /* skip garbled */ }
  }
  const open = Array.isArray(openRaw) ? openRaw.map(String) : [];
  for (const date of open) {
    const [scalars, geo] = await pipeline([["HGETALL", `hb:day:${date}`], ["HGETALL", `hb:day:${date}:geo`]]);
    const s = hashToRecord(scalars), g = hashToRecord(geo);
    const day = days.get(date) ?? { date, chaptersRead: 0, chaptersHeard: 0, listensMarked: 0, countries: {}, subdivisions: {} };
    day.chaptersRead += toInt(s.chaptersRead); day.chaptersHeard += toInt(s.chaptersHeard); day.listensMarked += toInt(s.listensMarked);
    for (const [f, v] of Object.entries(g)) {
      const [scope, code, which] = f.split(":");
      if (which !== "read" && which !== "heard") continue;
      const rec = scope === "c" ? (day.countries[code] ??= { read: 0, heard: 0 }) : scope === "s" ? (day.subdivisions[code] ??= { read: 0, heard: 0 }) : null;
      if (rec) rec[which] += toInt(v);
    }
    days.set(date, day);
  }
  const t = hashToRecord(totalsF);
  return {
    meta: hashToRecord(metaF),
    totals: { chaptersRead: toInt(t.chaptersRead), chaptersHeard: toInt(t.chaptersHeard), listensCompleted: toInt(t.listensCompleted), booksFinished: toInt(t.booksFinished), listensMarked: toInt(t.listensMarked) },
    days: [...days.values()].sort((a, b) => (a.date < b.date ? -1 : 1)),
  };
}

async function assembleReports() {
  const [totalsF, daysF] = await pipeline([["HGETALL", "ar:totals"], ["HGETALL", "ar:days"]]);
  const totals = {};
  for (const [k, v] of Object.entries(hashToRecord(totalsF))) totals[k] = toInt(v);
  const days = Object.entries(hashToRecord(daysF)).map(([date, json]) => { try { return JSON.parse(json); } catch { return { date, chapters: {} }; } });
  return { totals, days: days.sort((a, b) => (a.date < b.date ? -1 : 1)) };
}

const mode = process.argv[2];

if (mode === "--verify") {
  const hb = await assembleHeartbeat();
  const ar = await assembleReports();
  console.log("heartbeat totals:", JSON.stringify(hb.totals));
  console.log("seed totals:     ", JSON.stringify(hbSeed.totals));
  console.log("heartbeat days:", hb.days.map((d) => d.date).join(", ") || "(none)");
  console.log("reports totals:", JSON.stringify(ar.totals));
  console.log("seed reports:   ", JSON.stringify(arSeed.totals));
  const totalsMatch = JSON.stringify(hb.totals) === JSON.stringify(hbSeed.totals);
  const reportsMatch = JSON.stringify(ar.totals) === JSON.stringify(arSeed.totals);
  console.log(totalsMatch && reportsMatch ? "VERIFY: store matches the seed record." : "VERIFY: store DIFFERS from the seed record (later beats explain growth; a LOWER number never does).");
} else {
  const force = mode === "--force";
  for (const [name, meta, commands] of [
    ["heartbeat", "hb:meta", hbSeedCommands(hbSeed)],
    ["audio-reports", "ar:meta", arSeedCommands(arSeed)],
  ]) {
    if (!force) {
      const won = await cmd(["HSETNX", meta, "seeded", "1"]);
      if (won !== 1) { console.log(`${name}: already seeded — skipped (use --force to rewrite).`); continue; }
    }
    await pipeline(commands);
    console.log(`${name}: seed written.`);
  }
}
