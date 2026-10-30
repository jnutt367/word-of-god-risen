"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import heartbeat from "@/data/heartbeat.json";
import worldMap from "@/lib/world-map.json";
import {
  EMBER_FILL_OPACITY,
  bookHaloOn,
  countryBookHaloOn,
  emberOpacityForOpens,
  emberStrokeForOpens,
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
 * country is also named in plain text (the day's chips in the list
 * below and/or the "Neighbors near and far" garland), so the picture
 * never carries the meaning alone.
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
 * The day list below the map follows the shown day while browsing
 * (Jason, later that morning): under its own dated heading —
 * "Friday, October 23, 2026 on the Vine" — it names that day's
 * places with that day's counts; the lifetime tiles above it never
 * follow, and stepping home restores "Today on the vine" exactly.
 *
 * THE IVORY RING (Oct 28, 2026, Jason's ruling): when a whole book
 * of the Bible is finished in a place, that place wears a soft
 * ivory-white ring for the rest of that day — traced around its
 * silhouette, or around its centroid light — then settles back
 * to its ordinary light. No names, no counts, nothing permanent.
 * The finish has been counted in the day's geo record beside
 * read/heard/opens since the same day (the book beat carried no
 * geography before), the payload carries each place's last
 * finish date as `bookFinishedOn`, and the ring shows only while
 * that date is today — at the live default, never while day
 * browsing. The ring is steady: no breathing, no flare; and it
 * always rests on a full light, since a finish is a book read or
 * heard through. The finest geography carries it, as with the
 * light: a subdivision's ring steps its country's own ring back.
 * The decisions live in lib/heartbeat-display.ts; see
 * HEARTBEAT.md, "The ivory ring". (The ring shipped gold that
 * morning; Jason ruled ivory-white the same day, because gold
 * already belongs to the visit lights — a finished book gets
 * its own color.)
 */

interface HbTotals {
  chaptersRead: number;
  chaptersHeard: number;
  listensCompleted: number;
  booksFinished: number;
  /** App opens (Oct 27, 2026) — additive in the payload; the
   *  tiles never show it and it is never folded into read/heard. */
  opens?: number;
  /** Video watches (Oct 29, 2026) — additive in the payload; the
   *  tiles never show it (Jason's ruling: no count words, no
   *  clutter) and it is never folded into read/heard. The map's
   *  gold play marks read the per-place rows, not this total. */
  videosWatched?: number;
}

interface HbCountryRow {
  code: string;
  name: string;
  read: number;
  heard: number;
  total: number;
  /** Opens recorded for this place today (Oct 27, 2026). A row
   *  with opens but no chapters rests on the map as an ember. */
  opens: number;
  /** Video watches recorded for this place in the shown day
   *  (Oct 29, 2026). A row with watches wears a gold play pin beside
   *  the map; watches never enter `total`, so a watch is never
   *  chapter activity anywhere. Snapshot rows predate the
   *  field and carry 0. */
  watches: number;
  /** The place's last book-finish date (Oct 28, 2026), or null —
   *  live rows carry it from the payload; the snapshot's rows
   *  predate it and leave it undefined. The ivory ring reads it. */
  bookFinishedOn?: string | null;
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
  /** Opens (Oct 27, 2026) — present in live payloads since the
   *  open beat shipped; older payloads and fixtures omit it. */
  opens?: number;
  /** Video watches (Oct 29, 2026) — present in live payloads
   *  since the watch beat shipped; older payloads and fixtures
   *  omit it, and no heart is worn. */
  watches?: number;
  /** The place's last book-finish date (Oct 28, 2026) — present
   *  in live payloads since the ivory ring shipped; older
   *  payloads and fixtures omit it, and no ring is worn. */
  bookFinishedOn?: string | null;
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
  opens?: number;
  videosWatched?: number;
  countries: LiveCountRow[];
  subdivisions?: LiveSubdivisionRow[];
}

export interface LiveData {
  live: boolean;
  asOf: string | null;
  since: string;
  totals: HbTotals;
  today: {
    date: string;
    chaptersRead: number;
    chaptersHeard: number;
    opens?: number;
  };
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

/** The whole map group — land, lit silhouettes, embers, hearts —
 *  drawn a tad larger inside its rim (Jason, Oct 27, 2026: the
 *  Earth read a little small on mobile). ONE scale, applied to a
 *  single wrapper around every map layer at once, so each light
 *  stays exactly on its geography; the rim circles and the card
 *  around them are the frame and do not scale. 1.06 puts the
 *  land's farthest reach (r≈456 in viewBox units) at r≈484 —
 *  at Jason's word the same evening the rim itself grew a tad
 *  (hairline ring r=490, disc face r=497) so the ring once again
 *  holds the whole scaled world with a small breathing margin. */
const MAP_SCALE = 1.06;

interface MapCountry extends HbCountryRow {
  geo: WorldCountry | null;
  centroid: { cx: number; cy: number } | null;
}

/** THE VIDEO-WATCH MARK glyph (Oct 29, 2026; shape crowned by
 *  Jason the same night). The mark began as a gold heart, but at
 *  the size a state can carry, a heart reads "love" before it
 *  reads "watched" — so Jason crowned the GOLD PLAY PIN: a gold
 *  ring (r 8.5) with a gold play triangle inside, in the lights'
 *  gold (#e4b95c, rimmed #ffe1a1). Gold, never red: red is
 *  reserved for a kindling mark not yet built (and a red pin
 *  would spend it). The pin is drawn beside the place's center
 *  (offset from the centroid, never over the light's small round
 *  core), and a bright gold DOT (r 3) is pinned exactly on the
 *  place's centroid with a hairline leader from dot to pin —
 *  the dot says WHICH place; the pin says WHAT happened. It is
 *  STEADY — no .hb-glow, no breathing — a kept sign for the day,
 *  like the ivory ring. */
function WatchPlayMark({
  cx,
  cy,
  px,
  py,
  label,
}: {
  cx: number;
  cy: number;
  px: number;
  py: number;
  label: string;
}) {
  return (
    <g>
      <title>{label}</title>
      <line
        x1={px}
        y1={py}
        x2={cx}
        y2={cy}
        stroke="#e4b95c"
        strokeWidth="0.8"
        strokeOpacity="0.5"
      />
      <circle cx={px} cy={py} r="3" fill="#ffe1a1" stroke="#e4b95c" strokeWidth="0.8" />
      <circle
        cx={cx}
        cy={cy}
        r="8.5"
        fill="#10394a"
        fillOpacity="0.9"
        stroke="#e4b95c"
        strokeWidth="2"
      />
      <path
        d={`M ${cx - 3} ${cy - 4.6} L ${cx - 3} ${cy + 4.6} L ${cx + 4.2} ${cy} Z`}
        fill="#e4b95c"
      />
    </g>
  );
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
        opens: c.opens ?? 0,
        watches: c.watches ?? 0,
        bookFinishedOn: c.bookFinishedOn ?? null,
      }))
      // A place stands in the rows on ANY activity: chapters,
      // opens alone (Oct 27, 2026 — it rests on the map as an
      // ember, so the rows, the list, and the disc all see it),
      // or watches alone (Oct 29, 2026 — its gold play pin must be
      // drawn, so the disc must see the row).
      .filter((c) => c.code && (c.total > 0 || c.opens > 0 || c.watches > 0))
      .sort(
        (a, b) =>
          b.total - a.total || b.opens - a.opens || b.watches - a.watches
      );

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
          opens: s.opens ?? 0,
          watches: s.watches ?? 0,
          bookFinishedOn: s.bookFinishedOn ?? null,
          country: (s.country || code.split("-")[0] || "").toUpperCase(),
          geo,
        };
      })
      .filter((s) => s.code && (s.total > 0 || s.opens > 0 || s.watches > 0))
      .sort(
        (a, b) =>
          b.total - a.total || b.opens - a.opens || b.watches - a.watches
      );

  // Today's live subdivision rows (v3.1).
  const liveSubdivisionRows: LiveSubdivisionDisplay[] =
    liveActive && live
      ? normalizeSubdivisionRows(live.subdivisions ?? [])
      : [];
  // ALL-TIME opens per place (Oct 27, 2026 — Phase 2.5). The API's
  // per-place rows are today's (and each history day's); the richest
  // lifetime figure the payload carries is the sum of a place's
  // opens across every day in the history (the store's own lifetime
  // subdivision subtotals are not exposed per-place in the public
  // view, and countries keep no separate lifetime geo total). The
  // history includes today, so these sums are true all-time opens
  // within the kept record. Fixture/snapshot payloads carry no
  // history — the getters then fall back to the row's own opens.
  const lifetimeOpensByCountry = new Map<string, number>();
  const lifetimeOpensBySubdivision = new Map<string, number>();
  if (liveActive && live?.history) {
    for (const d of live.history) {
      for (const c of d.countries ?? []) {
        const code = (c.code || "").toUpperCase();
        if (code) lifetimeOpensByCountry.set(code, (lifetimeOpensByCountry.get(code) ?? 0) + (c.opens ?? 0));
      }
      for (const s of d.subdivisions ?? []) {
        const code = (s.code || "").toUpperCase();
        if (code) lifetimeOpensBySubdivision.set(code, (lifetimeOpensBySubdivision.get(code) ?? 0) + (s.opens ?? 0));
      }
    }
  }
  const allTimeOpensOf = (c: HbCountryRow): number =>
    Math.max(c.opens, lifetimeOpensByCountry.get(c.code) ?? 0);
  const allTimeOpensOfSubdivision = (s: HbCountryRow): number =>
    Math.max(s.opens, lifetimeOpensBySubdivision.get(s.code) ?? 0);
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
  // The honest phrases for an OPENS-ONLY place (Oct 27, 2026):
  // the app was opened there — a knock on the door — and the
  // place rests as a faint ember. It is never described as lit,
  // and never in chapters: opens are named as opens.
  const openPhrase = (c: HbCountryRow) => {
    const n = allTimeOpensOf(c);
    return `${c.name} — the app was opened here ${shownWhen}; ${fmt(n)} ${n === 1 ? "visit" : "visits"} in all — it rests as a faint ember, glowing a little brighter with visits, its rim brightening too, until the Word is read or heard`;
  };
  const subdivisionOpenPhrase = (s: HbCountryRow) => {
    const n = allTimeOpensOfSubdivision(s);
    return `${s.name} — the app was opened here ${shownWhen}; ${fmt(n)} ${n === 1 ? "visit" : "visits"} in all — it rests as a faint ember, glowing a little brighter with visits, its rim brightening too`;
  };
  // (Subdivision rows are grouped under their country further
  // down, from the SHOWN set — see shownSubdivisionGroups beside
  // the day browsing — so the list below the map can follow the
  // day the map is showing.)
  const subdivisionGroupLabel = (country: string) =>
    country === "US"
      ? "United States — by state"
      : `${regionName(country)} — by region`;

  // Calendar helpers — day keys are the record's own "YYYY-MM-DD"
  // strings, stepped in UTC so a step is always exactly one day.
  // (Defined here, ahead of both day browsing and "The Vine Is
  // Growing" below, which share them.)
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const WEEKDAYS_FULL = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday",
  ];
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
  const weekdayFullOf = (iso: string) =>
    WEEKDAYS_FULL[new Date(dayKeyToUTC(iso)).getUTCDay()] ?? "";
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
        // The daily record predates the open beat — its rows are
        // chapters only, so opens stands at zero here. It likewise
        // predates the watch beat — watches stands at zero too.
        opens: 0,
        watches: 0,
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
  // The light tiers (Oct 27, 2026): "full" and "ember" are the
  // chapter tiers exactly as v3.1.1 settled them. "open" wears the
  // ember treatment — the same faint, steady fill, no glow layer,
  // no breathing, no heart — for a place whose shown activity is
  // OPENS ONLY. Any chapter at all outranks the opens: where the
  // Word was read or heard, the full light wins, exactly as now.
  // A place with NO chapters at all wears the ember treatment,
  // whatever its activity — opens (Oct 27, 2026) or watches alone
  // (Oct 29, 2026: a watch is not the Word read or heard, so a
  // watches-only place must never wear the full light; it rests
  // as an ember and carries its gold play pin beside it).
  const tierOf = (c: HbCountryRow): "full" | "ember" | "open" =>
    c.total === 0 ? "open" : modeOf(c.code);
  const subsOf = (code: string) =>
    subdivisionsOfCountry(shownSubdivisions, code);
  const anyEmber = mapRows.some((c) => tierOf(c) !== "full");

  // THE GOLD RING (Oct 28, 2026) — decided against the SHOWN
  // set, but the sign belongs to TODAY: haloDate is today's date
  // only at the live default, so while day browsing no ring is
  // worn (a past day keeps its own lights, and the ring is a
  // one-day sign). The decisions themselves are the pure
  // functions in lib/heartbeat-display.ts.
  const haloDate = !browsedDay && liveActive && live ? live.today.date : null;
  const subHaloOn = (s: LiveSubdivisionDisplay) => bookHaloOn(s, haloDate);
  const countryHaloOn = (c: HbCountryRow) =>
    countryBookHaloOn(c, shownSubdivisions, haloDate);
  const anyHalo =
    mapRows.some((c) => countryHaloOn(c)) ||
    shownSubdivisions.some((s) => subHaloOn(s));
  const haloTitle = (name: string) =>
    `${name} — a white ring: book finished here today`;
  // The aria voice of the ivory ring: the places within this
  // country that wear it today, named plainly. (In the opens-only
  // branch of describeCountry it can never speak — a ring needs
  // chapters, and an opens-only country has none, its
  // subdivisions included, since their chapters count in its
  // total too.)
  const ringClause = (c: HbCountryRow): string => {
    const names: string[] = [];
    if (countryHaloOn(c)) names.push(c.name);
    for (const s of subsOf(c.code)) if (subHaloOn(s)) names.push(s.name);
    return names.length
      ? `; a white ring marks ${names.join(" and ")} — book finished there today`
      : "";
  };

  // THE GOLD PLAY MARK (Oct 29, 2026) — a video watched in
  // the app sets a gold play pin beside the watcher's place. Its voices (title/aria
  // only — Jason's ruling: no visible count words anywhere; the
  // ocean legend's "Video watched" row is the only words it
  // carries). The clause is honest about what a watch is: a
  // video watched — never a chapter, never a light.
  const watchClause = (r: HbCountryRow): string =>
    r.watches > 0
      ? `; a gold play mark marks ${r.name} — a video was watched here ${shownWhen}`
      : "";
  const watchTitle = (r: HbCountryRow): string =>
    r.watches > 0
      ? ` — a gold play mark: a video was watched here ${shownWhen}`
      : "";
  // The finest geography carries the play pin, as it carries the
  // light (v3.1.1): a country's own pin stands only when none
  // of its shown subdivisions carries one.
  const countryWatchHeartOn = (c: HbCountryRow): boolean =>
    c.watches > 0 &&
    !shownSubdivisions.some((s) => s.country === c.code && s.watches > 0);

  // The "on the Vine" day list below the map follows the SHOWN day
  // (Jason, Oct 24, 2026): at the live default these are today's
  // rows and the block renders exactly as it always has; while
  // browsing, the same list carries the stepped-to day's own rows
  // from the history, under that day's date. The lifetime tiles
  // above the list never follow — they are lifetime, and stay so.
  const vineRows: HbCountryRow[] = browsedDay
    ? browsedDay.countries
    : liveRows;
  // Subdivision rows of the shown set, grouped under their country
  // for the list ("United States — by state"); only the US can
  // appear in v3.1, but the grouping itself is generic.
  const shownSubdivisionGroups: [string, LiveSubdivisionDisplay[]][] = [];
  for (const s of shownSubdivisions) {
    const g = shownSubdivisionGroups.find(([c]) => c === s.country);
    if (g) g[1].push(s);
    else shownSubdivisionGroups.push([s.country, [s]]);
  }

  // The aria description of one mapped country. An ember country is
  // never described as lit: reading was recorded across it, it rests
  // as a faint ember, and its divisions carry the light.
  const describeCountry = (c: MapCountry): string => {
    if (tierOf(c) === "open") {
      const subs = shownSubdivisions.filter(
        (s) => s.country === c.code && (s.opens > 0 || s.watches > 0)
      );
      const base = `the app was opened in ${c.name} ${shownWhen} — ${fmt(allTimeOpensOf(c))} ${allTimeOpensOf(c) === 1 ? "visit" : "visits"} in all, and the Word has not been opened there yet; ${c.name} rests as a faint ember, glowing a little brighter with visits, not fully lit${countryWatchHeartOn(c) ? watchClause(c) : ""}`;
      return subs.length > 0
        ? `${base}; its divisions rest as embers where recorded: ${subs
            .map((s) =>
              s.opens > 0
                ? subdivisionOpenPhrase(s) + watchClause(s)
                : `${s.name} — a video was watched here ${shownWhen}; ${s.name} rests as a faint ember, not fully lit`
            )
            .join("; ")}`
        : base;
    }
    if (modeOf(c.code) === "ember") {
      const subs = subsOf(c.code);
      return `reading recorded across ${c.name} — ${fmt(c.total)} ${c.total === 1 ? "chapter" : "chapters"} ${shownWhen}; ${c.name} itself rests as a faint ember, not lit, and its divisions are lit where recorded: ${subs.map((s) => subdivisionPhrase(s) + watchClause(s)).join("; ")}${ringClause(c)}${countryWatchHeartOn(c) ? watchClause(c) : ""}`;
    }
    return `${mapPhrase(c)}, lit in its own shape${ringClause(c)}${watchClause(c)}`;
  };

  const figureLabel = gathering
    ? "A soft world map drawn as a disc, at rest while today's count gathers."
    : browsedDay
      ? mapRows.length > 0 && shownCount > 0
        ? `A soft world map drawn as a disc. ${fmt(shownCount)} ${shownCount === 1 ? "chapter was" : "chapters were"} read or heard on ${longDate(browsedDay.date)}. Where the Word was opened that day: ${mapRows.map(describeCountry).join("; ")}.`
        : mapRows.length > 0
          ? `A soft world map drawn as a disc. No chapters were read or heard on ${longDate(browsedDay.date)} — the app was opened that day, and these places rest as faint embers: ${mapRows.map(describeCountry).join("; ")}.`
          : shownCount > 0
            ? `A soft world map drawn as a disc, with ${fmt(shownCount)} ${shownCount === 1 ? "chapter" : "chapters"} read or heard on ${longDate(browsedDay.date)}. No country shapes are lit for that day.`
            : `A soft world map drawn as a disc, at rest on ${longDate(browsedDay.date)} — no chapters were counted that day, and no country shapes are lit.`
      : mapRows.length > 0 && todayCount > 0
        ? `A soft world map drawn as a disc. ${fmt(todayCount)} ${todayCount === 1 ? "chapter was" : "chapters were"} read or heard today, ${longDate(today.date)}. Where the Word was opened${mapSource === "live" ? " today" : ""}: ${mapRows.map(describeCountry).join("; ")}.`
        : mapRows.length > 0
          ? `A soft world map drawn as a disc. No chapters have been read or heard yet today, ${longDate(today.date)} — the app has been opened, and these places rest as faint embers: ${mapRows.map(describeCountry).join("; ")}.`
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
      // A place counts as lit on chapters, or on opens alone
      // (Oct 27, 2026 — an opens-only place rests on the map as
      // an ember, and the tile says "places lit": it is on it).
      for (const c of d.countries)
        if (c.total > 0 || (c.opens ?? 0) > 0) seen.add(c.code);
      for (const s of d.subdivisions ?? [])
        if (s.total > 0 || (s.opens ?? 0) > 0) seen.add(s.code);
    }
    return seen.size;
  })();
  const growthChart = growthDays.slice(-14);
  const growthMax = Math.max(1, ...growthChart.map((d) => d.total));
  const growthLabel = growthDays.length
    ? `Day-by-day chapters read and heard, ${longDate(growthDays[0].date)} through ${longDate(growthDays[growthDays.length - 1].date)}. Last 7 days: ${fmt(growthLast7)} chapters. The 7 days before: ${fmt(growthPrev7)}. Last 30 days: ${fmt(growthLast30)}. ${fmt(growthPlaces)} places have lit up on the map in this record.`
    : "";

  // THE DAY CHART SCROLLS SIDEWAYS (Jason, Oct 29, 2026 — his phone
  // screenshot: fourteen flex-1 bars squeezed until the newest days
  // fell off the right edge). The chart below gives every day a
  // fixed, comfortable width inside a horizontally scrollable row,
  // and the first time it appears it opens already scrolled to the
  // newest day at the right end — the days a neighbor most likely
  // came to see. Once only: the live refresh must never yank the
  // row back while someone is looking at an earlier day.
  const chartScrollRef = useRef<HTMLDivElement | null>(null);
  const chartScrolledOnce = useRef(false);
  useEffect(() => {
    const el = chartScrollRef.current;
    if (!el || chartScrolledOnce.current || growthChart.length === 0) return;
    el.scrollLeft = el.scrollWidth;
    chartScrolledOnce.current = true;
  }, [growthChart.length]);

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
      id="earth-map"
      aria-labelledby="heartbeat-heading"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-4 pt-6 sm:px-6"
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
              {/* the sea — a deep teal-blue radial depth (water
                  pass, Jason, Oct 27, 2026): the disc's ground is
                  deep water, #175263 lifted at the center and
                  settling to #0b2836 at the rim. Lighter and
                  bluer than the greens it replaces, but still a
                  night sea: unlit land composited over its
                  brightest point stays below the faintest ember,
                  so land still reads as land and every light
                  still reads as light. */}
              <radialGradient id="hb-sea" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#175263" />
                <stop offset="55%" stopColor="#10394a" />
                <stop offset="100%" stopColor="#0b2836" />
              </radialGradient>
            </defs>
            {/* the disc's rim — a soft ring holding the world */}
            <circle cx="500" cy="500" r="497" fill="url(#hb-sea)" />
            <circle
              cx="500"
              cy="500"
              r="490"
              fill="none"
              stroke="#e8d9ae"
              strokeWidth="1"
              opacity="0.18"
            />
            {/* The map group — every layer of the world itself
                (land, lights, embers, hearts) inside ONE wrapper,
                scaled a tad up about the disc's center (MAP_SCALE,
                Jason, Oct 27, 2026) so the Earth reads clearer on
                mobile. The rim circles above stay unscaled: they
                are the frame. Because the scale wraps all layers
                together, no light can drift off its geography. */}
            <g
              transform={`translate(500 500) scale(${MAP_SCALE}) translate(-500 -500)`}
            >
            {/* ground layer — the world, soft and translucent.
                Color pass (Jason, Oct 27, 2026): the land's
                presence raised (fill 0.13 → 0.22, stroke 0.12 →
                0.20, same cream) so the world reads as a place,
                not a whisper — and held there on purpose: the
                faintest ember silhouette layers its gold over
                this land and stays clearly warmer and brighter,
                so unlit land never competes with an ember. */}
            <path
              d={world.land}
              fill="#e8d9ae"
              fillRule="evenodd"
              opacity="0.22"
              stroke="#e8d9ae"
              strokeWidth="0.6"
              strokeOpacity="0.20"
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
                subdivisions, drawn next. OPENS-ONLY countries
                (Oct 27, 2026) wear that same ember treatment —
                tierOf(c) !== "full" — with their own honest title:
                the app was opened there, nothing read or heard
                yet; their RIM brightens with visits (Jason's rim
                rule, Oct 27) while the v3.1.1 ember beside them
                keeps its flat, faint outline exactly as before. */}
            {mapRows.map((c, i) =>
              c.geo ? (
                tierOf(c) !== "full" ? (
                  <g key={`sil-${c.code}`}>
                    <title>
                      {tierOf(c) === "open" ? openPhrase(c) : emberPhrase(c)}
                      {countryWatchHeartOn(c) ? watchTitle(c) : ""}
                    </title>
                    <path
                      d={c.geo.path}
                      fill="#e4b95c"
                      fillRule="evenodd"
                      fillOpacity={
                        tierOf(c) === "open"
                          ? emberOpacityForOpens(allTimeOpensOf(c))
                          : EMBER_FILL_OPACITY
                      }
                      stroke="#ffe1a1"
                      strokeWidth={tierOf(c) === "open" ? 1.1 : 0.8}
                      strokeOpacity={
                        tierOf(c) === "open"
                          ? emberStrokeForOpens(allTimeOpensOf(c))
                          : 0.25
                      }
                    />
                  </g>
                ) : (
                  <g
                    key={`sil-${c.code}`}
                    className="hb-glow"
                    style={{ animationDelay: `${(i % 5) * 0.9}s` }}
                  >
                    <title>
                      {mapPhrase(c)}
                      {countryWatchHeartOn(c) ? watchTitle(c) : ""}
                    </title>
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
                ember and shows no heart of its own. A subdivision
                whose shown counts are OPENS ONLY (Oct 27, 2026)
                renders as an ember instead — faint and steady,
                no glow, no heart — in the branch below. */}
            {shownSubdivisions.map((s, i) =>
              s.geo ? (
                s.total > 0 ? (
                <g
                  key={`sub-${s.code}`}
                  className="hb-glow"
                  style={{ animationDelay: `${((i + 2) % 5) * 0.9}s` }}
                >
                  <title>
                    {subdivisionPhrase(s)}
                    {subHaloOn(s)
                      ? " — book finished here today; a white ring marks it"
                      : ""}
                    {watchTitle(s)}
                  </title>
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
                ) : (
                  // OPENS-ONLY subdivision (Oct 27, 2026): the
                  // ember treatment in the subdivision's own
                  // shape — one faint, steady fill; no glow
                  // layer, no breathing, no heart. Its RIM
                  // brightens with visits (Jason's rim rule,
                  // Oct 27): the outline traces the shape
                  // steadily, brighter as the visits gather.
                  <g key={`sub-${s.code}`}>
                    <title>
                      {s.opens > 0
                        ? subdivisionOpenPhrase(s) + watchTitle(s)
                        : `${s.name} — a video was watched here ${shownWhen}; it rests as a faint ember, glowing a little brighter with visits, its rim brightening too`}
                    </title>
                    <path
                      d={s.geo.path}
                      fill="#ffdf8a"
                      fillRule="evenodd"
                      fillOpacity={emberOpacityForOpens(allTimeOpensOfSubdivision(s))}
                      stroke="#ffe9b0"
                      strokeWidth="1.0"
                      strokeOpacity={emberStrokeForOpens(allTimeOpensOfSubdivision(s))}
                    />
                  </g>
                )
              ) : null
            )}
            {/* country hearts — a small bright core at each lit
                country's center; for a counted country with no
                polygon, the heart carries a fuller halo and ring
                (the centroid-light fallback). An EMBER country
                (v3.1.1) shows NO heart: its subdivisions hold the
                hearts now. An OPENS-ONLY country (Oct 27, 2026)
                shows no heart either — it rests as the same faint
                disc an ember country leaves at a centroid. */}
            {mapRows.map((c, i) => {
              if (!c.centroid) return null;
              if (tierOf(c) !== "full") {
                if (c.geo) return null;
                return (
                  <g key={`heart-${c.code}`}>
                    <title>
                      {tierOf(c) === "open" ? openPhrase(c) : emberPhrase(c)}
                      {countryWatchHeartOn(c) ? watchTitle(c) : ""}
                    </title>
                    <circle
                      cx={c.centroid.cx}
                      cy={c.centroid.cy}
                      r={lightRadius(c.total)}
                      fill="#e4b95c"
                      fillOpacity={
                        tierOf(c) === "open"
                          ? emberOpacityForOpens(allTimeOpensOf(c))
                          : EMBER_FILL_OPACITY
                      }
                      stroke={tierOf(c) === "open" ? "#ffe1a1" : "none"}
                      strokeWidth={tierOf(c) === "open" ? 1.2 : 0}
                      strokeOpacity={
                        tierOf(c) === "open"
                          ? emberStrokeForOpens(allTimeOpensOf(c))
                          : 0
                      }
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
                  <title>
                    {mapPhrase(c)}
                    {countryWatchHeartOn(c) ? watchTitle(c) : ""}
                  </title>
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
            {/* THE GOLD PLAY PINS (Oct 29, 2026) — a video
                watched in the app sets a gold play pin beside
                the watcher's place for the shown day, with a
                bright dot pinned exactly on the place's center
                and a hairline from dot to pin — never over the
                light's small round core, which stays exactly as
                it was — and it is steady, like the ring. The
                finest geography carries it, as it carries the
                light: a subdivision's pin stands for its
                country's watches; the country's own pin stands
                only when no shown subdivision carries one. A
                place with watches but no chapters keeps its
                ember (or its quiet land) — the pin is its only
                bright mark, and it never makes a light. Drawn
                before the rings, so a ring for the day still
                rests over everything it honors. */}
            {shownSubdivisions.map((s) =>
              s.watches > 0 && s.geo ? (
                <WatchPlayMark
                  key={`watch-${s.code}`}
                  cx={s.geo.cx + 19}
                  cy={s.geo.cy + 15}
                  px={s.geo.cx}
                  py={s.geo.cy}
                  label={`${s.name} — a gold play mark: a video was watched here ${shownWhen}`}
                />
              ) : null
            )}
            {mapRows.map((c) =>
              countryWatchHeartOn(c) && c.centroid ? (
                <WatchPlayMark
                  key={`watch-${c.code}`}
                  cx={
                    c.geo
                      ? c.centroid.cx + 19
                      : c.centroid.cx + lightRadius(c.total) * 2.1 + 18
                  }
                  cy={c.geo ? c.centroid.cy + 15 : c.centroid.cy}
                  px={c.centroid.cx}
                  py={c.centroid.cy}
                  label={`${c.name} — a gold play mark: a video was watched here ${shownWhen}`}
                />
              ) : null
            )}
            {/* THE IVORY RING (Oct 28, 2026) — drawn last, over
                the lights it honors: a soft ivory-white ring traced
                around the mark of a place where a whole book of
                the Bible was finished TODAY — around a country's
                silhouette, around a subdivision's silhouette, or
                around a centroid light where the place has no
                silhouette. Two strokes give it its softness (a
                wide, faint pass under a narrower, clearer one),
                and it is STEADY: no .hb-glow, no breathing, no
                flare — a kept sign for the day, not an animation.
                A country's own ring steps back when one of its
                subdivisions wears the ring (countryBookHaloOn),
                as its light does. */}
            {mapRows.map((c) =>
              countryHaloOn(c) ? (
                c.geo ? (
                  <g key={`halo-${c.code}`}>
                    <title>{haloTitle(c.name)}</title>
                    <path
                      d={c.geo.path}
                      fill="none"
                      stroke="#fffff0"
                      strokeWidth="3.4"
                      strokeOpacity="0.22"
                    />
                    <path
                      d={c.geo.path}
                      fill="none"
                      stroke="#fffff0"
                      strokeWidth="1.5"
                      strokeOpacity="0.9"
                    />
                  </g>
                ) : c.centroid ? (
                  <g key={`halo-${c.code}`}>
                    <title>{haloTitle(c.name)}</title>
                    <circle
                      cx={c.centroid.cx}
                      cy={c.centroid.cy}
                      r={lightRadius(c.total) * 2.1 + 5}
                      fill="none"
                      stroke="#fffff0"
                      strokeWidth="1.5"
                      strokeOpacity="0.9"
                    />
                  </g>
                ) : null
              ) : null
            )}
            {shownSubdivisions.map((s) =>
              subHaloOn(s) && s.geo ? (
                <g key={`halo-${s.code}`}>
                  <title>{haloTitle(s.name)}</title>
                  <path
                    d={s.geo.path}
                    fill="none"
                    stroke="#fffff0"
                    strokeWidth="3.4"
                    strokeOpacity="0.22"
                  />
                  <path
                    d={s.geo.path}
                    fill="none"
                    stroke="#fffff0"
                    strokeWidth="1.5"
                    strokeOpacity="0.9"
                  />
                </g>
              ) : null
            )}
            </g>
            {/* THE LEGEND (Oct 29, 2026, Jason's crown — "Build the
                legend in the ocean"): a small visual key ON the disc,
                riding over empty sea in the upper-left quadrant — the
                Pacific-side water between the Asian and North American
                silhouettes. The patch was verified against the RENDERED
                geometry (every country and subdivision path, MAP_SCALE
                applied, sampled on a 2-unit grid): the panel's rect
                (x 140–398, y 166–400) touches no land at all, and its
                rounded corners stay inside the disc's rim. It is drawn
                OUTSIDE the scaled map group, so it can never drift onto
                a light, and it changes no light, ember, rim, ring, or
                sea value — it only names them. An SVG panel (not an
                HTML overlay) on purpose: a fixed-pixel panel would
                swell to cover real geography as the map shrinks to
                phone width, while this panel scales with the disc and
                holds the same patch of ocean at every width. Each
                meaning is told in two short lines so the words stay as
                large as the patch allows. The disc's prose and aria
                label already carry these meanings, so the legend is
                reinforcement, not the sole carrier — and it is not
                interactive. (No kindling-red row: that mark is not
                built yet, and the legend names only real things.)
                The FOURTH row (Oct 29, 2026, later the same night)
                is the gold play pin — "Video watched" — the only
                words the watch count carries anywhere (Jason's
                ruling). It was added by tightening the rows'
                spacing INSIDE the same verified rect (x 140–398,
                y 166–400): the panel did not grow, so the patch of
                ocean it rides is the very one sampled empty above,
                and its corners stay inside the rim as before. */}
            <g aria-hidden="true">
              <rect
                x="140"
                y="166"
                width="258"
                height="234"
                rx="20"
                fill="#0b2836"
                fillOpacity="0.85"
                stroke="#e8d9ae"
                strokeWidth="1.5"
                strokeOpacity="0.30"
              />
              <text
                x="162"
                y="193"
                fontSize="19"
                fontWeight="600"
                fill="#e8d9ae"
              >
                How to read this map:
              </text>
              {/* full golden light — golden fill, bright heart */}
              <circle cx="170" cy="233" r="12" fill="#e4b95c" fillOpacity="0.55" stroke="#ffe1a1" strokeWidth="1" strokeOpacity="0.6" />
              <circle cx="170" cy="233" r="4.5" fill="#fff3c4" />
              <text x="198" y="225" fontSize="22" fill="#f6efdb">
                Word read or
              </text>
              <text x="198" y="249" fontSize="22" fill="#f6efdb">
                heard here
              </text>
              {/* faint ember — a dim fill whose rim brightens with
                  visits; no heart, no breathing */}
              <circle cx="170" cy="281" r="12" fill="#e4b95c" fillOpacity="0.18" stroke="#ffe1a1" strokeWidth="1.2" strokeOpacity="0.68" />
              <text x="198" y="273" fontSize="22" fill="#f6efdb">
                App opened here
              </text>
              <text
                x="198"
                y="297"
                fontSize="21"
                fill="#f6efdb"
                textLength="186"
                lengthAdjust="spacingAndGlyphs"
              >
                brightens with visits
              </text>
              {/* the ivory ring — the same double stroke the ring
                  itself wears on the map */}
              <circle cx="170" cy="329" r="11" fill="none" stroke="#fffff0" strokeWidth="4.5" strokeOpacity="0.22" />
              <circle cx="170" cy="329" r="11" fill="none" stroke="#fffff0" strokeWidth="2" strokeOpacity="0.9" />
              <text x="198" y="321" fontSize="22" fill="#f6efdb">
                Book finished
              </text>
              <text x="198" y="345" fontSize="22" fill="#f6efdb">
                here today
              </text>
              {/* the gold play pin — the same glyph the watch
                  mark wears on the map, at swatch size */}
              <circle
                cx="170"
                cy="377"
                r="8.5"
                fill="#10394a"
                fillOpacity="0.9"
                stroke="#e4b95c"
                strokeWidth="2"
              />
              <path d="M 167 372.4 L 167 381.6 L 174.2 377 Z" fill="#e4b95c" />
              <text x="198" y="385" fontSize="22" fill="#f6efdb">
                Video watched
              </text>
            </g>
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
              ) : mapRows.length > 0 ? (
                <>
                  No chapters were counted on {longDate(browsedDay.date)} —
                  but the app was opened, and those places rest on the
                  map as faint embers.
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
            ) : mapRows.length > 0 ? (
              <>
                No chapters counted yet today — but the app has been
                opened, and those places rest on the map as faint
                embers.
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
            {anyHalo
              ? " A white ring — book finished here today."
              : ""}
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

        {/* The shown day's live countries — counted as the Body
            reads, in plain text beside the map's silhouettes. At
            the live default this is "Today on the vine"; while day
            browsing it follows the map to the stepped-to day, under
            that day's date, with that day's own counts. */}
        {liveActive && vineRows.length > 0 && (
          <div aria-live="polite" className="mx-auto mt-10 max-w-3xl">
            <h3 className="text-center font-display text-xl text-cream-50">
              {browsedDay
                ? `${weekdayFullOf(shownDate)}, ${longDate(shownDate)} on the Vine`
                : "Today on the vine"}
            </h3>
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {vineRows.map((c, i) => (
                <li
                  key={c.code}
                  className="inline-flex items-center gap-2 rounded-full border border-gold-500/25 bg-vineyard-950/60 px-3.5 py-1.5 text-sm text-cream-100"
                >
                  {/* the row's light — breathing in step with its
                      silhouette on the map (v3.1.3); aria-hidden,
                      the text beside it carries the meaning. An
                      OPENS-ONLY row (Oct 27, 2026) rests as an
                      ember everywhere: its dot here is steady and
                      dim, and its text names opens as opens. A
                      WATCHES-ONLY row (Oct 29, 2026) rests as an
                      ember too — steady dot, and NO words at all
                      beside its name: the heart on the map and
                      the legend are its only telling (Jason's
                      ruling: no count words, no clutter). */}
                  {c.total === 0 ? (
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 shrink-0 rounded-full bg-gold-300"
                      style={{ opacity: emberOpacityForOpens(allTimeOpensOf(c)) / 0.3 * 0.75 }}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="hb-glow inline-block h-2 w-2 shrink-0 rounded-full bg-gold-300"
                      style={{ animationDelay: `${(i % 5) * 0.9}s` }}
                    />
                  )}
                  {c.name}{" "}
                  {c.total > 0 ? (
                    <span className="text-gold-300">
                      {fmt(c.total)} {c.total === 1 ? "chapter" : "chapters"} {shownWhen}
                    </span>
                  ) : c.opens > 0 ? (
                    <span className="text-gold-300">opened {shownWhen}</span>
                  ) : null}
                  {c.heard > 0 && (
                    <span className="text-sage-300">
                      {" "}
                      · {fmt(c.read)} read · {fmt(c.heard)} heard
                    </span>
                  )}
                  {c.opens > 0 && (
                    <span className="text-sage-300">
                      {" "}
                      · {fmt(c.opens)}{" "}
                      {c.opens === 1 ? "visit" : "visits"}
                    </span>
                  )}
                  {countryHaloOn(c) && (
                    <span className="text-sage-300">
                      {" "}
                      · book finished
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
            {shownSubdivisionGroups.map(([country, rows]) => {
              const countryRow = vineRows.find((c) => c.code === country);
              const unrecorded = countryRow
                ? unrecordedChapters(
                    countryRow.total,
                    shownSubdivisions,
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
                            aria-hidden, the text carries the meaning.
                            An OPENS-ONLY row rests as an ember:
                            steady dim dot, opens named as opens. A
                            WATCHES-ONLY row (Oct 29, 2026) rests as
                            an ember too — steady dot, no words
                            beside its name (see the country chips). */}
                        {s.total === 0 ? (
                          <span
                            aria-hidden="true"
                            className="inline-block h-2 w-2 shrink-0 rounded-full bg-gold-300"
                            style={{ opacity: emberOpacityForOpens(allTimeOpensOfSubdivision(s)) / 0.3 * 0.75 }}
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="hb-glow inline-block h-2 w-2 shrink-0 rounded-full bg-gold-300"
                            style={{ animationDelay: `${((i + 2) % 5) * 0.9}s` }}
                          />
                        )}
                        {s.name}{" "}
                        {s.total > 0 ? (
                          <span className="text-gold-300">
                            {fmt(s.total)} {s.total === 1 ? "chapter" : "chapters"} {shownWhen}
                          </span>
                        ) : s.opens > 0 ? (
                          <span className="text-gold-300">opened {shownWhen}</span>
                        ) : null}
                        {s.heard > 0 && (
                          <span className="text-sage-300">
                            {" "}
                            · {fmt(s.read)} read · {fmt(s.heard)} heard
                          </span>
                        )}
                        {s.opens > 0 && (
                          <span className="text-sage-300">
                            {" "}
                            · {fmt(s.opens)}{" "}
                            {s.opens === 1 ? "visit" : "visits"}
                          </span>
                        )}
                        {subHaloOn(s) && (
                          <span className="text-sage-300">
                            {" "}
                            · book finished
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
                          {unrecorded === 1 ? "chapter" : "chapters"} {shownWhen}
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
                ref={chartScrollRef}
                className="overflow-x-auto pb-2"
              >
                <div
                  role="img"
                  aria-label={growthLabel}
                  className="flex w-max min-w-full items-end gap-1.5 sm:gap-2"
                >
                  {growthChart.map((d) => (
                    <div
                      key={d.date}
                      aria-hidden="true"
                      className="flex min-w-11 flex-1 flex-col items-center gap-1.5"
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
              </div>
              <figcaption className="mt-3 text-center text-sm text-sage-300">
                Each bar is a day — chapters read and heard over the
                last two weeks. On a small screen, swipe the chart
                sideways to see every day.
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
