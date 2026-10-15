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

export interface LiveData {
  live: boolean;
  asOf: string | null;
  since: string;
  totals: HbTotals;
  today: { date: string; chaptersRead: number; chaptersHeard: number };
  countries: LiveCountRow[];
  /** Today's subdivision rows (v3.1), keyed by ISO 3166-2 code. */
  subdivisions?: LiveSubdivisionRow[];
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

  const liveActive = Boolean(live?.live);
  const totals = liveActive && live ? live.totals : hb.totals;
  const today = liveActive && live ? live.today : hb.today;
  const { library, recent } = hb;
  const todayCount = today.chaptersRead + today.chaptersHeard;
  const allQuiet = totals.chaptersRead + totals.chaptersHeard === 0;
  const windowLabel = (hb.countriesWindow || "").trim();

  // Today's live country rows (names resolved for display; positions
  // resolve against the vendored geography in toMapCountry).
  const liveRows: HbCountryRow[] =
    liveActive && live
      ? live.countries
          .map((c) => ({
            code: (c.code || "").toUpperCase(),
            name: regionName((c.code || "").toUpperCase()),
            read: c.read ?? 0,
            heard: c.heard ?? 0,
            total: c.total ?? (c.read ?? 0) + (c.heard ?? 0),
          }))
          .filter((c) => c.code && c.total > 0)
          .sort((a, b) => b.total - a.total)
      : [];

  // Today's live subdivision rows (v3.1) — names and positions
  // resolve against the vendored subdivision geography, keyed by
  // full ISO 3166-2 code; a counted subdivision always has a polygon
  // there (the POST sanitizes against the same tables).
  interface LiveSubdivisionDisplay extends HbCountryRow {
    country: string;
    geo: WorldCountry | null;
  }
  const liveSubdivisionRows: LiveSubdivisionDisplay[] =
    liveActive && live
      ? (live.subdivisions ?? [])
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
          .sort((a, b) => b.total - a.total)
      : [];
  const subdivisionPhrase = (s: HbCountryRow) =>
    `${s.name} — ${fmt(s.total)} ${s.total === 1 ? "chapter" : "chapters"} today`;
  // The honest phrase for an EMBER country (v3.1.1): reading is
  // recorded across it, but it is NOT lit — its divisions are.
  const emberPhrase = (c: HbCountryRow) =>
    `${c.name} — reading recorded across the country today; divisions lit where recorded`;
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
  // otherwise the daily record's. Both sets are always named in text.
  const mapSource: "live" | "snapshot" =
    liveActive && liveRows.length > 0 ? "live" : "snapshot";
  const mapRows = (mapSource === "live" ? liveRows : snapRows)
    .map(toMapCountry)
    .filter((c) => c.geo || c.centroid);
  const mapPhrase = (c: HbCountryRow) =>
    mapSource === "live"
      ? `${c.name} — ${fmt(c.total)} ${c.total === 1 ? "chapter" : "chapters"} today`
      : `${c.name} — ${fmt(c.total)} ${c.total === 1 ? "chapter" : "chapters"}${windowLabel ? ` ${windowLabel}` : ""}`;

  const garlandPhrase = (c: HbCountryRow) =>
    `${fmt(c.total)} ${c.total === 1 ? "chapter" : "chapters"}${windowLabel ? ` ${windowLabel}` : ""}`;

  // v3.1.1 — finest geography wins the light, decided against the
  // SHOWN set: subdivision rows belong to today's live set only (the
  // snapshot carries none), so in snapshot mode every country keeps
  // its full v3 light.
  const shownSubdivisions = mapSource === "live" ? liveSubdivisionRows : [];
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
      return `reading recorded across ${c.name} — ${fmt(c.total)} ${c.total === 1 ? "chapter" : "chapters"} today; ${c.name} itself rests as a faint ember, not lit, and its divisions are lit where recorded: ${subs.map(subdivisionPhrase).join("; ")}`;
    }
    return `${mapPhrase(c)}, lit in its own shape`;
  };

  const figureLabel =
    mapRows.length > 0
      ? `A soft world map drawn as a disc. ${fmt(todayCount)} ${todayCount === 1 ? "chapter was" : "chapters were"} read or heard today, ${longDate(today.date)}. Where the Word was opened${mapSource === "live" ? " today" : ""}: ${mapRows.map(describeCountry).join("; ")}.`
      : todayCount > 0
        ? `A soft world map drawn as a disc, with ${fmt(todayCount)} ${todayCount === 1 ? "chapter" : "chapters"} read or heard today, ${longDate(today.date)}. No country shapes are lit yet.`
        : "A soft world map drawn as a disc, at rest in the early morning — the counting of chapters has only just begun, and no country shapes are lit yet.";

  const tiles: { label: string; value: number; sub: string }[] = [
    {
      label: "Chapters read",
      value: totals.chaptersRead,
      sub: "opened and read here",
    },
    {
      label: "Chapters heard",
      value: totals.chaptersHeard,
      sub: "in Grandpa Teddy's voice",
    },
    {
      label: "Books finished",
      value: totals.booksFinished,
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
                counts today light in their own shapes at FULL
                treatment (v3.1; ISO 3166-2 keying, the US states
                today): glow, fill, breathing — and, since v3.1.1,
                their own bright hearts, because the finest recorded
                geography wins the light. Their country rests behind
                them as an ember and shows no heart of its own. */}
            {mapSource === "live" &&
              liveSubdivisionRows.map((s, i) =>
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
            {todayCount > 0 ? (
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
        </figure>

        {/* Counters */}
        <ul className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map((t) => (
            <li
              key={t.label}
              className="rounded-xl border border-cream-100/10 bg-vineyard-950/60 px-4 py-5 text-center"
            >
              <p className="font-display text-3xl text-gold-300">
                {fmt(t.value)}
              </p>
              <p className="mt-1 text-sm font-semibold text-cream-50">
                {t.label}
              </p>
              <p className="mt-0.5 text-xs text-sage-300">{t.sub}</p>
            </li>
          ))}
        </ul>

        {allQuiet && (
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
