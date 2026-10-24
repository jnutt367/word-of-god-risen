"use client";

import { useCallback, useEffect, useState } from "react";
import heartbeat from "@/data/heartbeat.json";
import worldMap from "@/lib/world-map.json";
import {
  EMBER_FILL_OPACITY,
  lightModeForCountry,
  notRecordedLabel,
  subdivisionsOfCountry,
  unrecordedChapters,
} from "@/lib/heartbeat-display";

/**
 * "The Body, Reading" — the Bible Heartbeat visualization (v3).
 *
 * The picture: the world as a flat disc (azimuthal equidistant,
 * centered on the North Pole; Natural Earth geometry, public domain,
 * vendored in lib/world-map.json — no tile services, no trackers) —
 * a pure map, carrying no artwork overlay (v3.1.3, see below).
 *
 * A country that carries counts lights up in its own silhouette —
 * its actual shape filled with warm golden light, breathing gently —
 * with a small bright heart at its center; a counted country with no
 * polygon in the vendored geography falls back to a light at its
 * centroid. The map's lights are GEOGRAPHY ONLY (Jason's model,
 * Oct 15): each person's read traces to their location — his reads
 * light Florida, his cousin's light West Virginia. Today's chapter
 * total rides as TEXT in the caption and counters. Every lit
 * country is also named in plain text (today's live chips and/or the
 * "Neighbors near and far" garland), so the picture never carries the
 * meaning alone.
 *
 * The numbers come from the live counters (GET /api/heartbeat, fed by
 * the private Blob store) refreshed about every minute, and fall back
 * to the checked-in daily snapshot (data/heartbeat.json, the permanent
 * record kept by scripts/heartbeat-rollup.mjs) whenever the live count
 * is unreachable. Live country rows are today's, counted from this
 * app's own reading only; snapshot rows cover their labeled window and
 * come from this app's own Web Analytics geography. Sources never mix,
 * and another property's audience is never plotted here.
 *
 * v3.1: within a counted country, today's SUBDIVISION silhouettes
 * (geometry in lib/world-map.json `subdivisions`, keyed generically
 * by full ISO 3166-2 code — "US-FL" style) light with a warmer golden
 * treatment, layered over the national fill. v3.1 vendors the USA
 * (50 states + DC); the keying is generic so the worldwide admin-1
 * pass (v3.2) needs no schema change. Subdivision counts are
 * aggregates only, taken from the connection's region signal the
 * same anonymous way countries are. See HEARTBEAT.md.
 *
 * Display rule (Jason, Oct 15): a light appears ONLY where it means
 * something, and it means a PLACE — country fills and hearts, and
 * subdivision fills within them. There are no decorative dots and
 * no data-fruit anywhere on the disc.
 *
 * v3.1.1: FINEST GEOGRAPHY WINS THE LIGHT (Jason, Oct 15). When a
 * country has recorded subdivisions in the shown set, the country
 * fill steps back to a faint ember — no glow layer, no breathing,
 * no country heart — and its subdivisions carry the full light,
 * hearts included. The country's remaining chapters (counted in its
 * totals, but with no subdivision recorded) are named honestly in
 * the list — "United States — state not recorded" — never spread
 * over the whole nation as if the whole nation had read. A country
 * with no recorded subdivisions is unchanged from v3. The decision
 * logic lives in lib/heartbeat-display.ts; see HEARTBEAT.md.
 *
 * v3.1.3: THE VINE OVERLAY IS GONE (Jason's condition — "if they
 * stay they should look like what they are" — with the call left to
 * Judah, one redesign attempt under a hard gate). The redesign —
 * tapered filled ribbon branches, a gnarled root stem, forks,
 * curling tendrils, muted bark brown behind the lights — was
 * rendered against the production data (US ember + Florida lit)
 * and inspected: it read as blades / a pinwheel, not unmistakably
 * as a grapevine. With any honest doubt the gate's answer was
 * deletion, so the disc is now a pure map. The same build restores
 * the light markers in the side lists (the design Jason confirmed
 * at 4:31pm): every lit country row and lit subdivision row opens
 * with a small breathing gold dot (aria-hidden — the text carries
 * the meaning), pulsing on the silhouettes' own .hb-glow timing;
 * the "state not recorded" row gets no dot, having no light.
 *
 * TEST VIEW (/heartbeat-test): the optional `fixture` prop injects
 * a make-believe live payload so any single place can be previewed
 * through this exact render path. Fixture mode never fetches,
 * never polls, and never writes — see BodyHeartbeatProps and
 * HEARTBEAT.md's test-view section. Without a fixture (the
 * homepage), nothing about this component's behavior changes.
 *
 * DAY BROWSING (Oct 24, 2026, Jason's word — "they just click on
 * the previous day and it shows that map, without crowding it too
 * much"): while the live record is flowing, one slim row of
 * controls under the map's caption steps the shown set back
 * through the record a day at a time, rendering each past day from
 * the payload's own history — same silhouettes, same ember rule,
 * same honest naming, that day's counts only. Today is the default
 * and is unchanged; a day with no recorded reading stands at rest
 * at zero, never wearing another day's lights. Sources still never
 * mix: browsing reads the live history only, never the snapshot.
 */

interface HbTotals {
  chaptersRead: number;
  chaptersHeard: number;
  listensCompleted: number;
  booksFinished: number;
}

interface HbCountryRow {
  code: string;
  name: string;
  read: number;
  heard: number;
  total: number;
}

interface HbSnapshotCountry {
  /** ISO 3166-1 alpha-2 — required for a silhouette; the list needs only a name. */
  code?: string;
  name: string;
  read?: number;
  heard?: number;
  /** Legacy v1 field, treated as `read`. */
  chaptersRead?: number;
}

interface HbRecent {
  book: string;
  chapter: number;
  kind: "read" | "heard" | "book";
  date: string;
}

interface HeartbeatData {
  since: string;
  updatedThrough: string;
  totals: HbTotals;
  library: { books: number; audioChapters: number };
  today: { date: string; chaptersRead: number; chaptersHeard: number };
  countries: HbSnapshotCountry[];
  countriesSource?: string;
  /** Window the snapshot country rows cover, e.g. "this week". */
  countriesWindow?: string;
  recent: HbRecent[];
}

interface LiveCountRow {
  code: string;
  read: number;
  heard: number;
  total: number;
}

/** One live subdivision row from GET /api/heartbeat (v3.1) — `code`
 *  is the full ISO 3166-2 code ("US-FL"); country/region are its
 *  parts; `name` is the display name resolved server-side. */
interface LiveSubdivisionRow extends LiveCountRow {
  country: string;
  region: string;
  name: string;
}

/** One day of the live day-by-day record (Oct 21, 2026): the day's
 *  counts plus the place rows that lit that day, in the same shapes
 *  as today's rows. Feeds "The Vine Is Growing" below the map. */
interface LiveDay {
  date: string;
  chaptersRead: number;
  chaptersHeard: number;
  listensMarked?: number;
  countries: LiveCountRow[];
  subdivisions?: LiveSubdivisionRow[];
}

export interface LiveData {
  live: boolean;
  asOf: string | null;
  since: string;
  totals: HbTotals;
  today: { date: string; chaptersRead: number; chaptersHeard: number };
  countries: LiveCountRow[];
  /** Today's subdivision rows (v3.1), keyed by ISO 3166-2 code. */
  subdivisions?: LiveSubdivisionRow[];
  /** The day-by-day record, ascending by date (Oct 21, 2026). */
  history?: LiveDay[];
}

export interface BodyHeartbeatProps {
  /**
   * TEST ONLY — an injected, make-believe live payload, used by
   * /heartbeat-test to preview how a single place would light the
   * disc. When a fixture is supplied the component renders it
   * through the exact production path below and NEVER fetches
   * /api/heartbeat (no GET, no POST, no polling) — the live
   * counters are neither read nor written by the test view. The
   * homepage passes no fixture and is unchanged. See HEARTBEAT.md.
   */
  fixture?: LiveData;
}

interface WorldCountry {
  name: string;
  path: string;
  cx: number;
  cy: number;
}

interface WorldCentroid {
  name: string;
  cx: number;
  cy: number;
}

const hb = heartbeat as HeartbeatData;
const world = worldMap as {
  viewBox: string;
  land: string;
  countries: Record<string, WorldCountry>;
  extraCentroids?: Record<string, WorldCentroid>;
  /** Admin-1 geometry keyed by full ISO 3166-2 code ("US-FL"). */
  subdivisions?: Record<string, WorldCountry>;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

const fmt = (n: number) => n.toLocaleString("en-US");

/** "updated moments ago" / "updated 4 minutes ago" — the age of the
 *  latest counted beat, in plain words. */
function asOfWords(iso: string | null): string {
  if (!iso) return "";
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 90) return "moments ago";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

function regionName(code: string): string {
  try {
    return regionNames?.of(code) || code;
  } catch {
    return code;
  }
}

/* (There is deliberately NO fruit/dot position table anymore: the
 * fruit-lights layer was removed entirely at Jason's word, Oct 15 —
 * the map's lights are geography only, so nothing here positions a
 * data dot on the map.) */

/** Gentle log-ish radius for a centroid light, capped — a big country
 *  of readers glows wider, never louder than the vine itself. */
function lightRadius(total: number): number {
  return Math.min(13, 4.5 + 2.6 * Math.log10(1 + total));
}

/** Silhouette warmth, scaled gently (log) by count and capped — depth
 *  without glare; the parchment underneath is 0.13 for comparison. */
function silhouetteFill(total: number): number {
  return Math.min(0.62, 0.3 + 0.11 * Math.log10(1 + total));
}
function silhouetteGlow(total: number): number {
  return Math.min(0.3, 0.14 + 0.055 * Math.log10(1 + total));
}

/** Subdivision silhouettes sit a touch brighter than their country's
 *  fill so the two layers read as one nation, kindled closer in —
 *  never a second, competing map. */
function subdivisionFill(total: number): number {
  return Math.min(0.55, 0.26 + 0.12 * Math.log10(1 + total));
}
function subdivisionGlow(total: number): number {
  return Math.min(0.26, 0.12 + 0.05 * Math.log10(1 + total));
}

interface MapCountry extends HbCountryRow {
  geo: WorldCountry | null;
  centroid: { cx: number; cy: number } | null;
}

function toMapCountry(row: HbCountryRow): MapCountry {
  const geo = world.countries[row.code] ?? null;
  const extra = geo ? null : world.extraCentroids?.[row.code] ?? null;
  return {
    ...row,
    geo,
    centroid: geo
      ? { cx: geo.cx, cy: geo.cy }
      : extra
        ? { cx: extra.cx, cy: extra.cy }
        : null,
  };
}

export default function BodyHeartbeat({ fixture }: BodyHeartbeatProps = {}) {
  const [live, setLive] = useState<LiveData | null>(fixture ?? null);
  // TRUTH GATE (Oct 19, exam item D): the checked-in snapshot opens at
  // zero, and until the first live fetch has answered — one way or the
  // other — the counters print NO number at all, so a stale zero can
  // never dress up as the count on first paint. The fetch settling in
  // the `finally` below is what opens the gate; fixture mode is
  // settled by definition (its numbers are its own test data).
  const [settled, setSettled] = useState(Boolean(fixture));
  // DAY BROWSING (Oct 24, 2026): the day shown on the map. null is
  // today — the live default, rendering exactly as it always has.
  // A date string is a past day from the live record, rendered from
  // the payload's history below.
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/heartbeat", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as LiveData;
      if (data && typeof data.totals?.chaptersRead === "number") {
        setLive(data);
      }
    } catch {
      /* the snapshot stands — the counting is never blocked by the display */
    } finally {
      setSettled(true);
    }
  }, []);

  useEffect(() => {
    // TEST VIEW: a supplied fixture is the whole data source — no
    // fetch of /api/heartbeat, no polling, no writes, ever.
    if (fixture) return;
    // The first load is the point of the effect — subscribing to an
    // external system (the live counter) and syncing its state in.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const id = setInterval(() => void load(), 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, fixture]);

  const gathering = !settled;
  const liveActive = Boolean(live?.live);
  const totals = liveActive && live ? live.totals : hb.totals;
  const today = liveActive && live ? live.today : hb.today;
  const { library, recent } = hb;
  const todayCount = today.chaptersRead + today.chaptersHeard;
  const allQuiet = totals.chaptersRead + totals.chaptersHeard === 0;
  const windowLabel = (hb.countriesWindow || "").trim();

  // Country rows from any day of the live record — today's, or a
  // past day's from the history (day browsing) — resolve the same
  // way: names resolved for display; positions resolve against the
  // vendored geography in toMapCountry.
  const normalizeCountryRows = (rows: LiveCountRow[]): HbCountryRow[] =>
    rows
      .map((c) => ({
        code: (c.code || "").toUpperCase(),
        name: regionName((c.code || "").toUpperCase()),
        read: c.read ?? 0,
        heard: c.heard ?? 0,
        total: c.total ?? (c.read ?? 0) + (c.heard ?? 0),
      }))
      .filter((c) => c.code && c.total > 0)
      .sort((a, b) => b.total - a.total);

  // Today's live country rows.
  const liveRows: HbCountryRow[] =
    liveActive && live ? normalizeCountryRows(live.countries) : [];

  // Subdivision rows from any day of the live record (v3.1) — names
  // and positions resolve against the vendored subdivision
  // geography, keyed by full ISO 3166-2 code; a counted subdivision
  // always has a polygon there (the POST sanitizes against the
  // same tables).
  interface LiveSubdivisionDisplay extends HbCountryRow {
    country: string;
    geo: WorldCountry | null;
  }
  const normalizeSubdivisionRows = (
    rows: LiveSubdivisionRow[]
  ): LiveSubdivisionDisplay[] =>
    rows
      .map((s) => {
        const code = (s.code || "").toUpperCase();
        const geo = world.subdivisions?.[code] ?? null;
        return {
          code,
          name: s.name || geo?.name || code,
          read: s.read ?? 0,
          heard: s.heard ?? 0,
          total: s.total ?? (s.read ?? 0) + (s.heard ?? 0),
          country: (s.country || code.split("-")[0] || "").toUpperCase(),
          geo,
        };
      })
      .filter((s) => s.code && s.total > 0)
      .sort((a, b) => b.total - a.total);

  // Today's live subdivision rows (v3.1).
  const liveSubdivisionRows: LiveSubdivisionDisplay[] =
    liveActive && live
      ? normalizeSubdivisionRows(live.subdivisions ?? [])
      : [];
  // The day words below speak for the SHOWN day (see day browsing):
  // at the live default `shownWhen` is "today" and every phrase is
  // word-for-word what it has always been; while browsing a past
  // day the same phrases name that day instead.
  const subdivisionPhrase = (s: HbCountryRow) =>
    `${s.name} — ${fmt(s.total)} ${s.total === 1 ? "chapter" : "chapters"} ${shownWhen}`;
  // The honest phrase for an EMBER country (v3.1.1): reading is
  // recorded across it, but it is NOT lit — its divisions are.
  const emberPhrase = (c: HbCountryRow) =>
    `${c.name} — reading recorded across the country ${shownDayWord}; divisions lit where recorded`;
  // Subdivision rows grouped under their country for the list below
  // ("United States — by state"); only the US can appear in v3.1,
  // but the grouping itself is generic.
  const subdivisionGroups: [string, LiveSubdivisionDisplay[]][] = [];
  for (const s of liveSubdivisionRows) {
    const g = subdivisionGroups.find(([c]) => c === s.country);
    if (g) g[1].push(s);
    else subdivisionGroups.push([s.country, [s]]);
  }
  const subdivisionGroupLabel = (country: string) =>
    country === "US"
      ? "United States — by state"
      : `${regionName(country)} — by region`;

  // Calendar helpers — day keys are the record's own "YYYY-MM-DD"
  // strings, stepped in UTC so a step is always exactly one day.
  // (Defined here, ahead of both day browsing and "The Vine Is
  // Growing" below, which share them.)
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayKeyToUTC = (iso: string) => {
    const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
    return Date.UTC(y || 1970, (m || 1) - 1, d || 1);
  };
  const utcToDayKey = (t: number) => {
    const dt = new Date(t);
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
  };
  const weekdayOf = (iso: string) =>
    WEEKDAYS[new Date(dayKeyToUTC(iso)).getUTCDay()] ?? "";
  const dayOfMonth = (iso: string) => parseInt(iso.split("-")[2] ?? "", 10) || "";

  // ── Day browsing (Oct 24, 2026) ────────────────────────────────
  // The live payload's history already carries every day's counts
  // AND that day's place rows, in the same shapes as today's. The
  // browsable range is the whole live record — its first day
  // through today. A day inside the range with no stored row is an
  // honest zero day (the record has them, e.g. Oct 19, 2026): it
  // renders at rest with its true zero counts, never dressed in
  // today's lights.
  const historyAsc: LiveDay[] =
    liveActive && live?.history
      ? [...live.history].sort((a, b) =>
          a.date < b.date ? -1 : a.date > b.date ? 1 : 0
        )
      : [];
  const historyByDate = new Map<string, LiveDay>(
    historyAsc.map((d) => [d.date, d])
  );
  const recordStart = historyAsc[0]?.date ?? null;
  const browsingAvailable = Boolean(
    liveActive && live && recordStart && recordStart < live.today.date
  );
  // The day on the map: today's date at the live default, else the
  // stepped-to past day, held inside the record's range.
  const shownDate =
    selectedDate &&
    recordStart &&
    live &&
    selectedDate >= recordStart &&
    selectedDate < live.today.date
      ? selectedDate
      : live?.today.date ?? today.date;
  const browsing = Boolean(live && shownDate !== live.today.date);
  const browsedRaw = browsing ? historyByDate.get(shownDate) : undefined;
  interface ShownDay {
    date: string;
    chaptersRead: number;
    chaptersHeard: number;
    countries: HbCountryRow[];
    subdivisions: LiveSubdivisionDisplay[];
  }
  const browsedDay: ShownDay | null = browsing
    ? {
        date: shownDate,
        chaptersRead: browsedRaw?.chaptersRead ?? 0,
        chaptersHeard: browsedRaw?.chaptersHeard ?? 0,
        countries: normalizeCountryRows(browsedRaw?.countries ?? []),
        subdivisions: normalizeSubdivisionRows(browsedRaw?.subdivisions ?? []),
      }
    : null;
  const shownCount = browsedDay
    ? browsedDay.chaptersRead + browsedDay.chaptersHeard
    : todayCount;
  const canStepBack = Boolean(
    browsingAvailable && recordStart && shownDate > recordStart
  );
  const canStepForward = Boolean(
    browsingAvailable && live && shownDate < live.today.date
  );
  const stepDay = (delta: number) => {
    if (!live || !recordStart) return;
    const next = utcToDayKey(dayKeyToUTC(shownDate) + delta * 86_400_000);
    if (next < recordStart) return;
    // Stepping forward onto today returns to the live default, so
    // the map resumes its ordinary today behavior exactly.
    if (next >= live.today.date) setSelectedDate(null);
    else setSelectedDate(next);
  };
  // The day words the map's phrases speak — "today" at the live
  // default, the browsed date itself while stepping back.
  const shownWhen = browsedDay ? `on ${longDate(browsedDay.date)}` : "today";
  const shownDayWord = browsedDay ? "that day" : "today";

  // Snapshot country rows — the daily record, with its own labeled
  // window. Normalized once; the garland below always speaks for them.
  const snapRows: HbCountryRow[] = hb.countries
    .map((c) => {
      const read = c.read ?? c.chaptersRead ?? 0;
      const heard = c.heard ?? 0;
      return {
        code: (c.code || "").toUpperCase(),
        name: c.name,
        read,
        heard,
        total: read + heard,
      };
    })
    .filter((c) => c.name && c.total > 0)
    .sort((a, b) => b.total - a.total);

  // The map carries ONE country set at a time so its meaning is never
  // blurred: today's live silhouettes while the live count is flowing,
  // otherwise the daily record's. While day browsing, the shown set
  // is the stepped-to day's own rows from the live history — never
  // today's, never the snapshot's. Every set is always named in text.
  const mapSource: "live" | "snapshot" | "history" = browsedDay
    ? "history"
    : liveActive && liveRows.length > 0
      ? "live"
      : "snapshot";
  const mapRows = (
    browsedDay
      ? browsedDay.countries
      : mapSource === "live"
        ? liveRows
        : snapRows
  )
    .map(toMapCountry)
    .filter((c) => c.geo || c.centroid);
  const mapPhrase = (c: HbCountryRow) =>
    mapSource === "snapshot"
      ? `${c.name} — ${fmt(c.total)} ${c.total === 1 ? "chapter" : "chapters"}${windowLabel ? ` ${windowLabel}` : ""}`
      : `${c.name} — ${fmt(c.total)} ${c.total === 1 ? "chapter" : "chapters"} ${shownWhen}`;

  const garlandPhrase = (c: HbCountryRow) =>
    `${fmt(c.total)} ${c.total === 1 ? "chapter" : "chapters"}${windowLabel ? ` ${windowLabel}` : ""}`;

  // v3.1.1 — finest geography wins the light, decided against the
  // SHOWN set: subdivision rows belong to the live sets only —
  // today's, or the browsed day's (the snapshot carries none), so
  // in snapshot mode every country keeps its full v3 light.
  const shownSubdivisions = browsedDay
    ? browsedDay.subdivisions
    : mapSource === "live"
      ? liveSubdivisionRows
      : [];
  const modeOf = (code: string) => lightModeForCountry(shownSubdivisions, code);
  const subsOf = (code: string) =>
    subdivisionsOfCountry(shownSubdivisions, code);
  const anyEmber = mapRows.some((c) => modeOf(c.code) === "ember");

  // The aria description of one mapped country. An ember country is
  // never described as lit: reading was recorded across it, it rests
  // as a faint ember, and its divisions carry the light.
  const describeCountry = (c: MapCountry): string => {
    if (modeOf(c.code) === "ember") {
      const subs = subsOf(c.code);
      return `reading recorded across ${c.name} — ${fmt(c.total)} ${c.total === 1 ? "chapter" : "chapters"} ${shownWhen}; ${c.name} itself rests as a faint ember, not lit, and its divisions are lit where recorded: ${subs.map(subdivisionPhrase).join("; ")}`;
    }
    return `${mapPhrase(c)}, lit in its own shape`;
  };

  const figureLabel = gathering
    ? "A soft world map drawn as a disc, at rest while today's count gathers."
    : browsedDay
      ? mapRows.length > 0
        ? `A soft world map drawn as a disc. ${fmt(shownCount)} ${shownCount === 1 ? "chapter was" : "chapters were"} read or heard on ${longDate(browsedDay.date)}. Where the Word was opened that day: ${mapRows.map(describeCountry).join("; ")}.`
        : shownCount > 0
          ? `A soft world map drawn as a disc, with ${fmt(shownCount)} ${shownCount === 1 ? "chapter" : "chapters"} read or heard on ${longDate(browsedDay.date)}. No country shapes are lit for that day.`
          : `A soft world map drawn as a disc, at rest on ${longDate(browsedDay.date)} — no chapters were counted that day, and no country shapes are lit.`
      : mapRows.length > 0
        ? `A soft world map drawn as a disc. ${fmt(todayCount)} ${todayCount === 1 ? "chapter was" : "chapters were"} read or heard today, ${longDate(today.date)}. Where the Word was opened${mapSource === "live" ? " today" : ""}: ${mapRows.map(describeCountry).join("; ")}.`
        : todayCount > 0
          ? `A soft world map drawn as a disc, with ${fmt(todayCount)} ${todayCount === 1 ? "chapter" : "chapters"} read or heard today, ${longDate(today.date)}. No country shapes are lit yet.`
          : "A soft world map drawn as a disc, at rest in the early morning — the counting of chapters has only just begun, and no country shapes are lit yet.";

  // "The Vine Is Growing" (Oct 21, 2026) — the day-by-day record,
  // turned into a growth story on the map's own card: a continuous
  // calendar series (days with no counted beat stand honestly at
  // zero), rolling windows (last 7 days, the 7 before, last 30),
  // and every place that has ever lit. Live history only — the
  // snapshot carries no day series, and sources never mix.
  interface GrowthDay {
    date: string;
    chaptersRead: number;
    chaptersHeard: number;
    total: number;
    places: string[];
  }
  // (The calendar helpers — dayKeyToUTC, utcToDayKey, weekdayOf,
  // dayOfMonth — are defined above, beside day browsing, and shared
  // with this section.)

  const growthDays: GrowthDay[] = (() => {
    if (!liveActive || !live?.history || live.history.length === 0) return [];
    const byDate = new Map<string, LiveDay>();
    for (const d of live.history) byDate.set(d.date, d);
    const start = dayKeyToUTC(live.history[0].date);
    const end = dayKeyToUTC(live.today.date);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
    const out: GrowthDay[] = [];
    for (let t = start; t <= end; t += 86_400_000) {
      const key = utcToDayKey(t);
      const d = byDate.get(key);
      const places = d
        ? [
            ...d.countries.map((c) => regionName((c.code || "").toUpperCase())),
            ...(d.subdivisions ?? []).map((s) => s.name || s.code),
          ]
        : [];
      out.push({
        date: key,
        chaptersRead: d?.chaptersRead ?? 0,
        chaptersHeard: d?.chaptersHeard ?? 0,
        total: (d?.chaptersRead ?? 0) + (d?.chaptersHeard ?? 0),
        places,
      });
    }
    return out;
  })();
  const sumWindow = (days: GrowthDay[], from: number, to?: number) =>
    days.slice(from, to).reduce((acc, d) => acc + d.total, 0);
  const growthLast7 = growthDays.length ? sumWindow(growthDays, -7) : 0;
  const growthPrev7 =
    growthDays.length > 7 ? sumWindow(growthDays, -14, -7) : 0;
  const growthLast30 = growthDays.length ? sumWindow(growthDays, -30) : 0;
  const growthPlaces = (() => {
    if (!liveActive || !live?.history) return 0;
    const seen = new Set<string>();
    for (const d of live.history) {
      for (const c of d.countries) if (c.total > 0) seen.add(c.code);
      for (const s of d.subdivisions ?? []) if (s.total > 0) seen.add(s.code);
    }
    return seen.size;
  })();
  const growthChart = growthDays.slice(-14);
  const growthMax = Math.max(1, ...growthChart.map((d) => d.total));
  const growthLabel = growthDays.length
    ? `Day-by-day chapters read and heard, ${longDate(growthDays[0].date)} through ${longDate(growthDays[growthDays.length - 1].date)}. Last 7 days: ${fmt(growthLast7)} chapters. The 7 days before: ${fmt(growthPrev7)}. Last 30 days: ${fmt(growthLast30)}. ${fmt(growthPlaces)} places have lit up on the map in this record.`
    : "";

  const tiles: { label: string; value: number | null; sub: string }[] = [
    {
      label: "Chapters read",
      value: gathering ? null : totals.chaptersRead,
      sub: "opened and read here",
    },
    {
      label: "Chapters heard",
      value: gathering ? null : totals.chaptersHeard,
      sub: "in Grandpa Teddy's voice",
    },
    {
      label: "Books finished",
      value: gathering ? null : totals.booksFinished,
      sub: "cover to cover, by neighbors",
    },
    {
      label: "Chapters waiting",
      value: library.audioChapters,
      sub: "every one read aloud, free",
    },
  ];

  return (
    <section
      aria-labelledby="heartbeat-heading"
      className="mx-auto max-w-6xl px-4 pb-4 pt-6 sm:px-6"
    >
      <div className="overflow-hidden rounded-2xl border border-gold-500/15 bg-vineyard-900 px-6 py-10 sm:px-10">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
          The Body, Reading
        </p>
        <h2
          id="heartbeat-heading"
          className="mt-2 text-center font-display text-2xl text-cream-50 sm:text-3xl"
        >
          One Vine, many neighbors
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-cream-100/85">
          This is the heartbeat of the Body in this little corner of the
          internet — chapters opened, chapters heard, whole books finished,
          counted in totals only. Not just numbers… neighbors.
        </p>

        {/* The world alone — a pure map since v3.1.3 (the vine
            overlay was deleted: it never read unmistakably as a
            vine). A counted country lights up in its own silhouette
            (and its subdivisions within it), named in the text
            below. The map's lights are geography only — today's
            chapter total is text, in the caption. */}
        <figure role="img" aria-label={figureLabel} className="mx-auto mt-6 max-w-2xl">
          <svg
            viewBox={world.viewBox}
            aria-hidden="true"
            focusable="false"
            className="w-full"
          >
            <defs>
              <filter id="hb-soft" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>
            {/* the disc's rim — a soft ring holding the world */}
            <circle cx="500" cy="500" r="486" fill="#e4b95c" opacity="0.04" />
            <circle
              cx="500"
              cy="500"
              r="470"
              fill="none"
              stroke="#e8d9ae"
              strokeWidth="1"
              opacity="0.18"
            />
            {/* ground layer — the world, soft and translucent */}
            <path
              d={world.land}
              fill="#e8d9ae"
              fillRule="evenodd"
              opacity="0.13"
              stroke="#e8d9ae"
              strokeWidth="0.6"
              strokeOpacity="0.12"
            />
            {/* (No vine overlay — v3.1.3 removed it under Jason's
                rule "if they stay they should look like what they
                are": the one permitted redesign, tapered filled
                ribbons with forks and tendrils, still read as
                blades / a pinwheel rather than unmistakably as a
                grapevine, so the overlay was deleted and the disc
                is a pure map. See HEARTBEAT.md.) */}
            {/* lit countries — the nation itself, in its own shape:
                a soft outer glow, then the golden fill, breathing.
                EMBER countries (v3.1.1 — the country has recorded
                subdivisions in this set) render instead as a faint,
                still fill at one fixed low opacity: no glow layer,
                no breathing. The light in them belongs to their
                subdivisions, drawn next. */}
            {mapRows.map((c, i) =>
              c.geo ? (
                modeOf(c.code) === "ember" ? (
                  <g key={`sil-${c.code}`}>
                    <title>{emberPhrase(c)}</title>
                    <path
                      d={c.geo.path}
                      fill="#e4b95c"
                      fillRule="evenodd"
                      fillOpacity={EMBER_FILL_OPACITY}
                      stroke="#ffe1a1"
                      strokeWidth="0.8"
                      strokeOpacity="0.25"
                    />
                  </g>
                ) : (
                  <g
                    key={`sil-${c.code}`}
                    className="hb-glow"
                    style={{ animationDelay: `${(i % 5) * 0.9}s` }}
                  >
                    <title>{mapPhrase(c)}</title>
                    <path
                      d={c.geo.path}
                      fill="#e4b95c"
                      fillRule="evenodd"
                      opacity={silhouetteGlow(c.total)}
                      filter="url(#hb-soft)"
                    />
                    <path
                      d={c.geo.path}
                      fill="#e4b95c"
                      fillRule="evenodd"
                      fillOpacity={silhouetteFill(c.total)}
                      stroke="#ffe1a1"
                      strokeWidth="0.8"
                      strokeOpacity="0.5"
                    />
                  </g>
                )
              ) : null
            )}
            {/* lit subdivisions — the first-level regions carrying
                counts in the SHOWN set (today's, or the browsed
                day's) light in their own shapes at FULL treatment
                (v3.1; ISO 3166-2 keying, the US states today): glow,
                fill, breathing — and, since v3.1.1, their own bright
                hearts, because the finest recorded geography wins
                the light. Their country rests behind them as an
                ember and shows no heart of its own. */}
            {shownSubdivisions.map((s, i) =>
              s.geo ? (
                <g
                  key={`sub-${s.code}`}
                  className="hb-glow"
                  style={{ animationDelay: `${((i + 2) % 5) * 0.9}s` }}
                >
                  <title>{subdivisionPhrase(s)}</title>
                  <path
                    d={s.geo.path}
                    fill="#ffdf8a"
                    fillRule="evenodd"
                    opacity={subdivisionGlow(s.total)}
                    filter="url(#hb-soft)"
                  />
                  <path
                    d={s.geo.path}
                    fill="#ffdf8a"
                    fillRule="evenodd"
                    fillOpacity={subdivisionFill(s.total)}
                    stroke="#ffe9b0"
                    strokeWidth="0.7"
                    strokeOpacity="0.55"
                  />
                  {/* the subdivision's heart — the bright core of
                      its light, at its own center */}
                  <circle cx={s.geo.cx} cy={s.geo.cy} r="6.5" fill="#ffdf8a" opacity="0.3" />
                  <circle cx={s.geo.cx} cy={s.geo.cy} r="2.6" fill="#fff3c4" />
                </g>
              ) : null
            )}
            {/* country hearts — a small bright core at each lit
                country's center; for a counted country with no
                polygon, the heart carries a fuller halo and ring
                (the centroid-light fallback). An EMBER country
                (v3.1.1) shows NO heart: its subdivisions hold the
                hearts now. */}
            {mapRows.map((c, i) => {
              if (!c.centroid) return null;
              if (modeOf(c.code) === "ember") {
                if (c.geo) return null;
                return (
                  <g key={`heart-${c.code}`}>
                    <title>{emberPhrase(c)}</title>
                    <circle
                      cx={c.centroid.cx}
                      cy={c.centroid.cy}
                      r={lightRadius(c.total)}
                      fill="#e4b95c"
                      fillOpacity={EMBER_FILL_OPACITY}
                    />
                  </g>
                );
              }
              const r = lightRadius(c.total);
              return (
                <g
                  key={`heart-${c.code}`}
                  className="hb-glow"
                  style={{ animationDelay: `${(i % 5) * 0.9}s` }}
                >
                  <title>{mapPhrase(c)}</title>
                  {c.geo ? (
                    <>
                      <circle cx={c.centroid.cx} cy={c.centroid.cy} r="7" fill="#e4b95c" opacity="0.25" />
                      <circle cx={c.centroid.cx} cy={c.centroid.cy} r="3" fill="#f6d47c" />
                    </>
                  ) : (
                    <>
                      <circle cx={c.centroid.cx} cy={c.centroid.cy} r={r * 2.1} fill="#e4b95c" opacity="0.16" />
                      <circle
                        cx={c.centroid.cx}
                        cy={c.centroid.cy}
                        r={r}
                        fill="#e4b95c"
                        fillOpacity="0.30"
                        stroke="#ffe1a1"
                        strokeWidth="1"
                        strokeOpacity="0.85"
                      />
                      <circle cx={c.centroid.cx} cy={c.centroid.cy} r={Math.max(2.2, r * 0.5)} fill="#f6d47c" />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
          <figcaption className="mt-2 text-center text-sm text-sage-300">
            {gathering ? (
              "Gathering today's count — the lights kindle as the count comes in."
            ) : browsedDay ? (
              shownCount > 0 ? (
                <>
                  {fmt(shownCount)}{" "}
                  {shownCount === 1 ? "chapter" : "chapters"} read or heard
                  on {longDate(browsedDay.date)} —{" "}
                  {mapRows.length > 0
                    ? "each light on the map, a neighbor."
                    : "the place was not recorded that day."}
                </>
              ) : (
                <>
                  The world at rest on {longDate(browsedDay.date)} — no
                  chapters were counted that day.
                </>
              )
            ) : todayCount > 0 ? (
              <>
                {fmt(todayCount)}{" "}
                {todayCount === 1 ? "chapter" : "chapters"} read or heard
                today, {longDate(today.date)} — each light on the map,
                a neighbor.
              </>
            ) : (
              "The world at rest — its lights kindle as neighbors read."
            )}
          </figcaption>
          <p className="mt-2 text-center text-sm text-cream-100/85">
            {mapRows.length > 0
              ? anyEmber
                ? "Each light is a place where the Word was opened — a country in its own shape, or, where the place was recorded more closely, a division within it, lit in its own shape while its country rests as a faint ember."
                : "Each light is a country where the Word was opened."
              : "Country lights join as the count gathers them — each light will mark a country where the Word was opened."}
          </p>
          {/* Day stepping (Oct 24, 2026) — one slim row under the
              caption, in the card's own language: step back a day,
              step forward, and a quiet way home to today. It renders
              only while the live record is flowing and holds more
              than today alone; the map above answers each step from
              that day's own rows in the history. */}
          {browsingAvailable && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => stepDay(-1)}
                disabled={!canStepBack}
                aria-label="Show the previous day on the map"
                className="min-h-11 rounded-full border border-gold-500/25 bg-vineyard-950/60 px-4 py-2 text-sm text-cream-100 transition-colors hover:border-gold-400/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ‹ Previous day
              </button>
              <span
                aria-live="polite"
                className="min-w-44 text-center text-sm font-semibold text-cream-50"
              >
                {browsedDay
                  ? `${weekdayOf(shownDate)}, ${longDate(shownDate)}`
                  : `Today — ${weekdayOf(shownDate)}, ${longDate(shownDate)}`}
              </span>
              <button
                type="button"
                onClick={() => stepDay(1)}
                disabled={!canStepForward}
                aria-label="Show the next day on the map"
                className="min-h-11 rounded-full border border-gold-500/25 bg-vineyard-950/60 px-4 py-2 text-sm text-cream-100 transition-colors hover:border-gold-400/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next day ›
              </button>
              {browsedDay && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  aria-label="Return the map to today"
                  className="min-h-11 rounded-full border border-cream-100/20 px-4 py-2 text-sm text-sage-300 transition-colors hover:border-gold-400/60 hover:text-cream-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
                >
                  Today
                </button>
              )}
            </div>
          )}
          {/* The tending note (Jason, Oct 23, 2026): while the live
              count is unreachable and the card stands on its resting
              snapshot, readers are told plainly that the lights are
              being tended — reading and listening themselves never
              pause. It renders ONLY in that fallback state (settled,
              not live) and removes itself the moment real counts
              return; it is never shown beside live numbers. */}
          {settled && !liveActive && (
            <p className="mx-auto mt-4 max-w-xl rounded-xl border border-gold-500/20 bg-vineyard-950/60 px-4 py-3 text-center text-sm leading-relaxed text-cream-100/90">
              {
                "The lights are resting while we tend them — reading and listening carry on as always, and the map will glow again soon."
              }
            </p>
          )}
        </figure>

        {/* Counters */}
        <ul className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map((t) => (
            <li
              key={t.label}
              className="rounded-xl border border-cream-100/10 bg-vineyard-950/60 px-4 py-5 text-center"
            >
              {t.value === null ? (
                <p className="flex min-h-9 items-center justify-center font-display text-lg text-sage-300">
                  Gathering the count…
                </p>
              ) : (
                <p className="font-display text-3xl text-gold-300">
                  {fmt(t.value)}
                </p>
              )}
              <p className="mt-1 text-sm font-semibold text-cream-50">
                {t.label}
              </p>
              <p className="mt-0.5 text-xs text-sage-300">{t.sub}</p>
            </li>
          ))}
        </ul>

        {settled && allQuiet && (
          <p className="mx-auto mt-6 max-w-xl text-center text-sm italic text-sage-300">
            {liveActive
              ? "The counting has only just begun — as the first neighbors open chapters, the map will kindle here within about a minute."
              : "The counting has only just begun — the first chapters opened here will appear tomorrow morning, the way a farmer walks the rows and finds what grew in the night."}
          </p>
        )}

        {/* Today's live countries — counted as the Body reads, in
            plain text beside the map's silhouettes. */}
        {liveActive && liveRows.length > 0 && (
          <div className="mx-auto mt-10 max-w-3xl">
            <h3 className="text-center font-display text-xl text-cream-50">
              Today on the vine
            </h3>
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {liveRows.map((c, i) => (
                <li
                  key={c.code}
                  className="inline-flex items-center gap-2 rounded-full border border-gold-500/25 bg-vineyard-950/60 px-3.5 py-1.5 text-sm text-cream-100"
                >
                  {/* the row's light — breathing in step with its
                      silhouette on the map (v3.1.3); aria-hidden,
                      the text beside it carries the meaning */}
                  <span
                    aria-hidden="true"
                    className="hb-glow inline-block h-2 w-2 shrink-0 rounded-full bg-gold-300"
                    style={{ animationDelay: `${(i % 5) * 0.9}s` }}
                  />
                  {c.name}{" "}
                  <span className="text-gold-300">
                    {fmt(c.total)} {c.total === 1 ? "chapter" : "chapters"} today
                  </span>
                  {c.heard > 0 && (
                    <span className="text-sage-300">
                      {" "}
                      · {fmt(c.read)} read · {fmt(c.heard)} heard
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {/* Subdivisions, grouped under their country — the text
                mirror of the state silhouettes on the disc (v3.1).
                Each group also names the country's remaining chapters
                honestly (v3.1.1): counted in the country's totals but
                carrying no recorded subdivision, they get their own
                quieter row — "{Country} — state not recorded" — so
                the list neither hides them nor lends them a finer
                place than was recorded. */}
            {subdivisionGroups.map(([country, rows]) => {
              const countryRow = liveRows.find((c) => c.code === country);
              const unrecorded = countryRow
                ? unrecordedChapters(
                    countryRow.total,
                    liveSubdivisionRows,
                    country
                  )
                : 0;
              return (
                <div key={country} className="mt-6">
                  <h4 className="text-center font-display text-base text-cream-50">
                    {subdivisionGroupLabel(country)}
                  </h4>
                  <ul className="mt-3 flex flex-wrap justify-center gap-2">
                    {rows.map((s, i) => (
                      <li
                        key={s.code}
                        className="inline-flex items-center gap-2 rounded-full border border-gold-500/25 bg-vineyard-950/60 px-3.5 py-1.5 text-sm text-cream-100"
                      >
                        {/* the row's light — breathing in step with
                            its silhouette on the map (v3.1.3);
                            aria-hidden, the text carries the meaning */}
                        <span
                          aria-hidden="true"
                          className="hb-glow inline-block h-2 w-2 shrink-0 rounded-full bg-gold-300"
                          style={{ animationDelay: `${((i + 2) % 5) * 0.9}s` }}
                        />
                        {s.name}{" "}
                        <span className="text-gold-300">
                          {fmt(s.total)} {s.total === 1 ? "chapter" : "chapters"} today
                        </span>
                        {s.heard > 0 && (
                          <span className="text-sage-300">
                            {" "}
                            · {fmt(s.read)} read · {fmt(s.heard)} heard
                          </span>
                        )}
                      </li>
                    ))}
                    {countryRow && unrecorded > 0 && (
                      <li
                        key={`${country}-not-recorded`}
                        className="rounded-full border border-cream-100/15 bg-vineyard-950/40 px-3.5 py-1.5 text-sm text-cream-100/75"
                      >
                        {notRecordedLabel(country, countryRow.name)}{" "}
                        <span className="text-gold-300/80">
                          {fmt(unrecorded)}{" "}
                          {unrecorded === 1 ? "chapter" : "chapters"} today
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
            <p className="mt-3 text-center text-xs text-sage-400">
              Counted as the Body reads — the country of a reader&rsquo;s
              connection only, never a name, never an address.
            </p>
          </div>
        )}

        {/* Country garland — the daily record's labeled list, naming
            every country the roll-up has gathered, so the map never
            carries the meaning alone. */}
        {snapRows.length > 0 && (
          <div className="mx-auto mt-10 max-w-3xl">
            <h3 className="text-center font-display text-xl text-cream-50">
              Neighbors near and far
            </h3>
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {snapRows.map((c, i) => (
                <li
                  key={c.code || c.name}
                  className="inline-flex items-center gap-2 rounded-full border border-gold-500/25 bg-vineyard-950/60 px-3.5 py-1.5 text-sm text-cream-100"
                >
                  {/* the row's light — breathing in step with its
                      silhouette on the map (v3.1.3); aria-hidden,
                      the text beside it carries the meaning */}
                  <span
                    aria-hidden="true"
                    className="hb-glow inline-block h-2 w-2 shrink-0 rounded-full bg-gold-300"
                    style={{ animationDelay: `${(i % 5) * 0.9}s` }}
                  />
                  {c.name}{" "}
                  <span className="text-gold-300">{garlandPhrase(c)}</span>
                  {c.heard > 0 && (
                    <span className="text-sage-300">
                      {" "}
                      · {fmt(c.read)} read · {fmt(c.heard)} heard
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {hb.countriesSource && (
              <p className="mt-3 text-center text-xs text-sage-400">
                {hb.countriesSource}
              </p>
            )}
          </div>
        )}

        {/* Recent-chapters river — only when the roll-up has real rows. */}
        {recent.length > 0 && (
          <div className="mx-auto mt-10 max-w-xl">
            <h3 className="text-center font-display text-xl text-cream-50">
              Lately on the vine
            </h3>
            <ul className="mt-4 space-y-2">
              {recent.slice(0, 8).map((r, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-4 rounded-lg border border-cream-100/10 bg-vineyard-950/60 px-4 py-2.5 text-sm"
                >
                  <span className="text-cream-100">
                    {r.book} {r.chapter}
                  </span>
                  <span className="text-sage-300">
                    {r.kind === "heard"
                      ? "heard"
                      : r.kind === "book"
                        ? "book finished"
                        : "read"}{" "}
                    · {longDate(r.date)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* The Vine Is Growing — the day-by-day record, public on
            the map's own card (Oct 21, 2026, Jason's word: "so that
            people could look if they want it… so they can feel like
            they're part of a growing family"). Rolling windows and
            a two-week bar story, with the full numbers in a table —
            the chart never carries the meaning alone. Totals only,
            as everywhere on this card. */}
        {growthDays.length > 0 && (
          <div className="mx-auto mt-12 max-w-3xl">
            <h3 className="text-center font-display text-xl text-cream-50">
              The Vine Is Growing
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-cream-100/85">
              Day by day, the family gathers. Every number below is a
              day of neighbors opening the Word somewhere — counted in
              totals only, the way a shepherd counts the flock at the
              gate.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                {
                  label: "Last 7 days",
                  value: growthLast7,
                  sub: "chapters read & heard",
                },
                {
                  label: "The 7 days before",
                  value: growthPrev7,
                  sub: "the week that was",
                },
                {
                  label: "Last 30 days",
                  value: growthLast30,
                  sub: "a month of gathering",
                },
                {
                  label: "Places lit",
                  value: growthPlaces,
                  sub: "countries & states on the map",
                },
              ].map((w) => (
                <li
                  key={w.label}
                  className="rounded-xl border border-cream-100/10 bg-vineyard-950/60 px-4 py-4 text-center"
                >
                  <p className="font-display text-2xl text-gold-300">
                    {fmt(w.value)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-cream-50">
                    {w.label}
                  </p>
                  <p className="mt-0.5 text-xs text-sage-300">{w.sub}</p>
                </li>
              ))}
            </ul>
            <figure className="mt-8">
              <div
                role="img"
                aria-label={growthLabel}
                className="flex items-end gap-1.5 sm:gap-2"
              >
                {growthChart.map((d) => (
                  <div
                    key={d.date}
                    aria-hidden="true"
                    className="flex flex-1 flex-col items-center gap-1.5"
                    title={`${longDate(d.date)} — ${fmt(d.total)} ${d.total === 1 ? "chapter" : "chapters"}`}
                  >
                    <span className="min-h-4 text-[11px] font-semibold text-gold-300">
                      {d.total > 0 ? fmt(d.total) : ""}
                    </span>
                    <div className="flex h-28 w-full items-end border-b border-cream-100/15">
                      <div
                        className="w-full rounded-t bg-gold-400/80"
                        style={{
                          height: `${d.total > 0 ? Math.max(4, (d.total / growthMax) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-center text-[10px] leading-tight text-sage-300">
                      {weekdayOf(d.date)}
                      <br />
                      {dayOfMonth(d.date)}
                    </span>
                  </div>
                ))}
              </div>
              <figcaption className="mt-3 text-center text-sm text-sage-300">
                Each bar is a day — chapters read and heard over the
                last two weeks.
              </figcaption>
            </figure>
            <details className="mt-6">
              <summary className="cursor-pointer text-center text-sm font-semibold text-gold-300">
                See the day-by-day numbers
              </summary>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">
                    Chapters read and heard, day by day, with the
                    places that lit each day
                  </caption>
                  <thead>
                    <tr className="border-b border-cream-100/15 text-sage-300">
                      <th scope="col" className="py-2 pr-3 font-semibold">Day</th>
                      <th scope="col" className="py-2 pr-3 font-semibold">Read</th>
                      <th scope="col" className="py-2 pr-3 font-semibold">Heard</th>
                      <th scope="col" className="py-2 font-semibold">Places that lit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {growthDays.map((d) => (
                      <tr
                        key={d.date}
                        className="border-b border-cream-100/5 text-cream-100"
                      >
                        <th scope="row" className="py-2 pr-3 font-normal">
                          {weekdayOf(d.date)}, {longDate(d.date)}
                        </th>
                        <td className="py-2 pr-3">{fmt(d.chaptersRead)}</td>
                        <td className="py-2 pr-3">{fmt(d.chaptersHeard)}</td>
                        <td className="py-2">
                          {d.places.length > 0
                            ? d.places.join(", ")
                            : d.total > 0
                              ? "place not recorded"
                              : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        )}

        {fixture ? (
          <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-sage-400">
            Test view — this section is drawn by the same code as the
            live homepage, fed one make-believe chapter for the place
            picked above. Nothing here is counted, stored, or sent
            anywhere; the live counters were never read or written.
          </p>
        ) : liveActive ? (
          <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-sage-400">
            Counted as the Body reads since {longDate(hb.since)} — this page
            listens again about every minute
            {live?.asOf ? `, and the latest beat landed ${asOfWords(live.asOf)}` : ""}.
            Opening a chapter, listening, or finishing a book adds one
            anonymous beat — totals only, never names, never a leaderboard.
            Across this library live {library.books} books and{" "}
            {fmt(library.audioChapters)} chapters read aloud — every one of
            them free. The daily record is kept in full, gathered gently
            each morning.
          </p>
        ) : (
          <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-sage-400">
            Counted with diligence since {longDate(hb.since)} · gathered gently
            and refreshed daily, through {longDate(hb.updatedThrough)}. Opening
            a chapter, listening, or finishing a book adds one anonymous beat —
            totals only, never names, never a leaderboard. Across this library
            live {library.books} books and {fmt(library.audioChapters)} chapters
            read aloud — every one of them free.
          </p>
        )}
      </div>
    </section>
  );
}
