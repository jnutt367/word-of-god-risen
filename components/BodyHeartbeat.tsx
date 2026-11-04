"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import heartbeat from "@/data/heartbeat.json";
import worldMap from "@/lib/world-map.json";
import {
  EMBER_FILL_OPACITY,
  EMBER_STROKE_MAX_OPACITY,
  HUNDREDFOLD_RING,
  KINDLING_FILL,
  KINDLING_FILL_OPACITY,
  KINDLING_RIM,
  PRAYER_CANDLE,
  STILL_KNOCKING_DEEP_GLOW,
  STILL_KNOCKING_GLOW,
  bookHaloOn,
  countryBookHaloOn,
  countryChaptersRecorded,
  countryHundredfoldOn,
  countryStillKnockingDeepOn,
  countryStillKnockingOn,
  emberOpacityForOpens,
  emberStrokeForOpens,
  goldenScrollPlaces,
  hundredfold,
  kindled,
  lightModeForCountry,
  notRecordedLabel,
  stillKnocking,
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
 * THE BOOK RING (Oct 28, 2026, Jason's ruling; color re-ruled
 * Nov 4, 2026): when a whole book
 * of the Bible is finished in a place, that place wears a soft
 * vine-green ring for the rest of that day — traced around its
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
 * its own color. On Nov 4, 2026, watching South Carolina
 * finish a book, Jason re-ruled the color: white did not carry
 * the significance of a finished book, and gold would blur
 * into the hundredfold's gold on a double day — so the ring
 * is now the vine's own green, #94c64a, the green of "VINE"
 * in the TruVINE wordmark: a finished book is fruit on the
 * vine. The mechanism is unchanged; only the color moved.)
 *
 * THE HUNDREDFOLD (Oct 30, 2026, Jason's crown — "I never
 * thought I'd have to ask this": named for the good soil of
 * Matthew 13, which bore a hundredfold): when a place's shown
 * day brings a hundred or more chapters read or heard, that
 * place wears a STEADY GOLD RING for the day — gold being the
 * lights' own gold, the chapter light's crown, and red stays
 * kindling's alone. The ring nests OUTSIDE the ivory ring when
 * a place has earned both: ivory on the border for the book
 * finished, gold beyond it for the hundred chapters. The
 * decision is hundredfold() in lib/heartbeat-display.ts, read
 * off the SHOWN day's own rows, so a past day browsed in the
 * record (or opened by its ?day= link) wears the ring it
 * earned that day — unlike the ivory ring, a today-only sign.
 * The finest geography carries it, as with the light and the
 * ivory ring: a subdivision's ring steps its country's back.
 * Only chapters count toward it — never a watch, never an
 * open. Florida is its first wearer: 101 chapters on the very
 * night it was crowned, a book finished there the same day, so
 * the first gold ring stands nested outside an ivory one.
 *
 * STILL KNOCKING (Oct 30, 2026, later the same night —
 * Jason: "I think 100 visits should get you something too",
 * and the name is his crown from Luke 11, the friend at
 * midnight who would not stop knocking): when a place's
 * shown day brings a hundred or more VISITS, that place's
 * light wears a SOFT PURPLE GLOW — a steady halo around the
 * light, not a ring: rings belong to the Word's feats
 * (ivory for a book, gold for a hundred chapters), and
 * visits are the seeking family, so they live in the glow.
 * The purple is a royal purple (#a855f7), a hue the map
 * spends nowhere else. Any chapter state qualifies — a
 * kindled place at a hundred visits wears its red ember
 * inside the purple glow; a hundredfold place wears its
 * gold ring inside it too. The decision is stillKnocking()
 * in lib/heartbeat-display.ts, read off the SHOWN day's own
 * rows, so a past day browsed in the record (or opened by
 * its ?day= link) wears the glow it earned that day. STATE
 * BY STATE (Jason's correction, the same night): a divided
 * country never wears it on summed visits — its states
 * wear their own, or none; only a country with no
 * subdivisions in the record glows as a country. One
 * unsaid exception, ruled later that night: at a THOUSAND
 * summed visits a divided country wears a DEEP purple
 * glow (#7e22ce, countryStillKnockingDeepOn) — rendered,
 * never written: no legend, title, aria, chip, or caption
 * names it.
 *
 * THE PRAYER LIGHT (Nov 2, 2026, Jason's crown — "wish we
 * could put a praying for you light on the map to show
 * Bacong Church in the Philippines that we're rooting for
 * them to open the app and read the word with us"): the
 * Philippines wears a warm, candle-like light though it
 * has recorded no activity at all — the map's first mark
 * that is NOT a count, and the legend says so in plain
 * words. It is a standing sign, decided from the same
 * record the map already consumes (no new data): the
 * moment the Philippines records chapter activity anywhere
 * in that record, the candle gives way for good; on the
 * FIRST day of that activity it is replaced for that day
 * by a wide, radiant answered mark ("that one would be
 * big" — Jason), and from the next day the Philippines
 * wears the ordinary marks like any neighbor. Both signs
 * belong to the live default, never to day browsing. See
 * the decision block below (prayerLightOn /
 * prayerAnsweredToday).
 *
 * THE GOLDEN SCROLL (Nov 3, 2026, Jason's crown — born of a
 * dictation that heard "squirrel" for SCROLL, and kept
 * because the scroll is the right picture: the Word itself,
 * unrolled in celebration): when ONE place finishes TEN or
 * more whole books in a single day, a golden scroll stands
 * ABOVE the disc — outside the legend, at Jason's word, so
 * the legend is never crowded — naming the feat and the
 * place in one line, for that day only, then settling.
 * Rare on purpose: at its crowning, the best single-place
 * day in the record stood at eight books. The decision is
 * goldenScrollPlaces() in lib/heartbeat-display.ts, read
 * off the SHOWN day's own rows (the payload's per-place
 * `books`, counted since Oct 28, 2026), so a past day
 * browsed in the record wears the scroll it earned. The
 * counting honesty is the honor chip's (Oct 31, 2026): a
 * finish increments its country row AND its subdivision
 * row — the scroll announces the most specific places and
 * never announces one finish twice. It is rendered from
 * the existing payload alone: no new counting, no new
 * tracking, aggregate only, like every mark on this map.
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
   *  blue inner traces read the per-place rows, not this total. */
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
   *  (Oct 29, 2026). A row with watches wears a blue inner trace inside
   *  the map; watches never enter `total`, so a watch is never
   *  chapter activity anywhere. Snapshot rows predate the
   *  field and carry 0. */
  watches: number;
  /** The place's last book-finish date (Oct 28, 2026), or null —
   *  live rows carry it from the payload; the snapshot's rows
   *  predate it and leave it undefined. The ivory ring reads it. */
  bookFinishedOn?: string | null;
  /** Whole books finished in this place in the shown day
   *  (Oct 31, 2026) — the honor chip counts them ("· 2 books
   *  finished") instead of only naming the honor. */
  books?: number;
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
  today: {
    date: string;
    chaptersRead: number;
    chaptersHeard: number;
    booksFinished?: number;
  };
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
  /** Whole books finished in this place in the shown day
   *  (Oct 31, 2026) — the count the honor chip speaks; present
   *  in live payloads since the books fix shipped. */
  books?: number;
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
  booksFinished?: number;
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
    booksFinished?: number;
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
 *  holds the whole scaled world with a small breathing margin.
 *  Nov 1, 2026 (Jason again: the map still read a little small
 *  on his phone, and the countries were hard to make out): the
 *  scale steps to 1.09 — the farthest reach lands at r≈497, the
 *  disc face itself, the most growth the sea can hold. The
 *  breathing margin is spent on purpose this time, and because
 *  the one scale still wraps every layer together, no light
 *  moves off its geography and the ratio never distorts.
 *  SECOND SIZE PASS (later Nov 1, 2026 — Jason: "is there any
 *  more room to make that a little bit bigger"): the scale
 *  itself has no more honest room (the rim is spent), so this
 *  growth comes from the LAYOUT around the disc instead: the
 *  section's phone padding narrows (px-4 → px-2), the map
 *  figure and the legend strip bleed 16px toward the card's
 *  edges on phone widths (-mx-4, leaving an 8px frame of card
 *  around the disc), and the column widens a step on larger
 *  screens (max-w-2xl → max-w-3xl, joining the closer-look
 *  panel's width). On a 390px phone the disc renders ~358px
 *  across, up from ~310px — about 15% wider, a third more
 *  area — and not one light moved: the bleed is the figure's
 *  box, the projection and the single scale are untouched. */
const MAP_SCALE = 1.09;

/** A CLOSER LOOK (Oct 29, 2026, Jason's crown — built first as a
 *  picture, prototype v2, and crowned from it the same night): the
 *  United States drawn larger and turned HORIZONTAL in its own
 *  panel under the disc, because on the disc's pole-centered
 *  turning the states run in a tall wedge and the southeast —
 *  where most of the lights are — crowds too small to read. The
 *  panel is a plain cartographic inset, the way printed maps set
 *  Alaska and Hawaii apart: the disc itself stays true, and the
 *  panel's caption says why it exists — the one place recorded
 *  state by state. NO flag, NO red/white/blue, no patriotic
 *  dressing of any kind (Jason's hard rule: "I don't want to look
 *  like a Christian nationalist at all, because that's not it at
 *  all what I'm doing") — the family colors only: sea, gold,
 *  cream, screen blue.
 *
 *  THE GEOMETRY: the panel draws the vendored subdivision paths
 *  themselves (the very shapes the disc lights), inside one
 *  rotated group — rotation ONLY, never a mirror: rotate(263.24°
 *  about the US centroid (342.6, 477.2)), the angle the prototype
 *  verified. Alaska and Hawaii are not in the panel: under this
 *  rotation they land far outside the horizontal cluster (Alaska
 *  ~120 units north of it, Hawaii ~120 west), exactly as the
 *  crowned prototype showed the mainland alone. The shapes drawn
 *  are the 48 mainland states + DC (49 shapes). The rotated
 *  cluster's bounds were computed from the path vertices (the
 *  paths are pure M/L/Z, so the vertex bounds are exact):
 *  x 274.2–417.1, y 433.3–518.9. The viewBox below is those
 *  bounds with a ~7-unit margin. Orientation verified by the
 *  rotated named centroids, normalized in the cluster: California
 *  x 0.07 (far west) · Washington (0.13, 0.08) top-left · Texas
 *  (0.44, 0.80) bottom-center · Florida (0.81, 0.86) bottom-right
 *  · Maine (0.97, 0.11) top-right · Georgia directly above
 *  Florida. */
const US_PANEL_VIEWBOX = "267 426 157 100";
const US_PANEL_TRANSFORM = "rotate(263.24 342.6 477.2)";
const US_PANEL_STATES: { code: string; geo: WorldCountry }[] = Object.entries(
  world.subdivisions ?? {}
)
  .filter(
    ([code]) => code.startsWith("US-") && code !== "US-AK" && code !== "US-HI"
  )
  .map(([code, geo]) => ({ code, geo }))
  .sort((a, b) => a.code.localeCompare(b.code));

interface MapCountry extends HbCountryRow {
  geo: WorldCountry | null;
  centroid: { cx: number; cy: number } | null;
}

/** THE VIDEO-WATCH MARK (Oct 29, 2026; final shape is Jason's
 *  own design, crowned the same night). The mark went heart →
 *  gold play pin → this, each step corrected by Jason's eye:
 *  beside-the-place marks are either too big or unattributable.
 *  Jason's fix: trace the place ITSELF — an inner outline in
 *  pale screen blue (#8fd8ff, the light a video screen casts, a
 *  color the map spends nowhere else) drawn just INSIDE the
 *  place's own border. It cannot point at the wrong place, and
 *  it scales with the place: a state wears a state-sized trace,
 *  a country a country-sized one. Drawn by clipping a wide
 *  stroke to the silhouette, so only the stroke's inner half
 *  shows — a band hugging the inside of the border. It is the
 *  ivory ring's sibling: the ring traces OUTSIDE for a book
 *  finished; this trace runs INSIDE for a video watched; a
 *  place that earned both wears them nested. STEADY — no
 *  .hb-glow, no breathing — a kept sign for the day. A place
 *  with no silhouette (centroid light only) wears a blue ring
 *  around its light instead. */
function WatchTraceMark({
  idKey,
  d,
  cx,
  cy,
  fallbackR,
  label,
}: {
  idKey: string;
  d?: string;
  cx?: number;
  cy?: number;
  fallbackR?: number;
  label: string;
}) {
  if (!d) {
    if (cx === undefined || cy === undefined) return null;
    return (
      <g>
        <title>{label}</title>
        <circle
          cx={cx}
          cy={cy}
          r={fallbackR ?? 10}
          fill="none"
          stroke="#8fd8ff"
          strokeWidth="1.6"
          strokeOpacity="0.95"
        />
      </g>
    );
  }
  const clipId = `watchtrace-${idKey.replace(/[^A-Za-z0-9-]/g, "")}`;
  return (
    <g>
      <title>{label}</title>
      <clipPath id={clipId}>
        <path d={d} />
      </clipPath>
      {/* A depth seam under the trace (Nov 1, 2026, the
          lighter-sea pass): the pale screen blue lost the
          most ground of any mark when the sea lifted to a
          true ocean blue — measured over pale land at the
          disc's bright heart, its separation fell from
          ~40 to ~24 (still clear, but the thinnest margin
          on the map). So the trace gains a soft seam of
          deep ocean (#12405f, darker than the new rim) at
          low opacity beneath its own two passes — the mark
          itself is untouched (same pale blue, same widths,
          same clip); the seam only shows where the line
          crosses pale ground, and over gold it is nearly
          invisible. Depth, not a redesign. */}
      <path
        d={d}
        fill="none"
        stroke="#12405f"
        strokeWidth="8"
        strokeOpacity="0.30"
        clipPath={`url(#${clipId})`}
      />
      <path
        d={d}
        fill="none"
        stroke="#8fd8ff"
        strokeWidth="6"
        strokeOpacity="0.40"
        clipPath={`url(#${clipId})`}
      />
      <path
        d={d}
        fill="none"
        stroke="#8fd8ff"
        strokeWidth="3"
        strokeOpacity="0.95"
        clipPath={`url(#${clipId})`}
      />
    </g>
  );
}

/** THE HUNDREDFOLD RING (Oct 30, 2026) — the ivory ring's
 *  elder brother: a STEADY GOLD RING for a place whose shown
 *  day brought a hundred or more chapters read or heard (the
 *  decision is hundredfold() in lib/heartbeat-display.ts). It
 *  follows the ivory ring's own construction — a wide, faint
 *  pass under a narrower, clearer one — and it nests OUTSIDE
 *  that ring: for a silhouette, the gold stroke is clipped to
 *  the OUTSIDE of the place's shape (the mirror of the watch
 *  trace's inside clip: a clip of everything-but-the-shape,
 *  cut by even-odd), at doubled widths so the visible band
 *  stands beyond the border the ivory ring rests on; for a
 *  centroid light, a plain circle at the ivory ring's radius
 *  plus its own margin. STEADY — no .hb-glow, no breathing —
 *  a kept sign for the day. */
function HundredfoldRingMark({
  idKey,
  d,
  cx,
  cy,
  r,
  label,
}: {
  idKey: string;
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  label: string;
}) {
  if (!d) {
    if (cx === undefined || cy === undefined || r === undefined) return null;
    return (
      <g>
        <title>{label}</title>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={HUNDREDFOLD_RING}
          strokeWidth="3.4"
          strokeOpacity="0.2"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={HUNDREDFOLD_RING}
          strokeWidth="1.5"
          strokeOpacity="0.9"
        />
      </g>
    );
  }
  const clipId = `hundredfold-${idKey.replace(/[^A-Za-z0-9-]/g, "")}`;
  return (
    <g>
      <title>{label}</title>
      {/* the outside of the shape: a frame far larger than the
          disc, minus the silhouette itself (even-odd) */}
      <clipPath id={clipId}>
        <path
          d={`M-200 -200 H1200 V1200 H-200 Z ${d}`}
          clipRule="evenodd"
        />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <path
          d={d}
          fill="none"
          stroke={HUNDREDFOLD_RING}
          strokeWidth="7.5"
          strokeOpacity="0.2"
        />
        <path
          d={d}
          fill="none"
          stroke={HUNDREDFOLD_RING}
          strokeWidth="4.4"
          strokeOpacity="0.88"
        />
      </g>
    </g>
  );
}

/** STILL KNOCKING (Oct 30, 2026) — a SOFT PURPLE GLOW for a
 *  place whose shown day brought a hundred or more visits
 *  (the decision is stillKnocking() in
 *  lib/heartbeat-display.ts). Not a ring — rings belong to
 *  the Word's feats; visits are the seeking family and live
 *  in the glow. The construction is the light's own: the
 *  place's shape filled with royal purple (STILL_KNOCKING_
 *  GLOW, #a855f7 — a hue the map spends nowhere else) and
 *  passed through the map's soft blur, with a second blurred
 *  pass along its rim, so the color blooms past the border
 *  as a halo around the light. The layer is drawn UNDER the
 *  lights themselves, so gold keeps a place's inside and
 *  purple keeps its outside; for a centroid light, a blurred
 *  purple circle wider than the light's own halo, over a
 *  faint steady disc of the same purple. STEADY — no
 *  .hb-glow, no breathing — a kept sign for the day.
 *
 *  WITHIN BORDERS — THE SUBDIVISION TREATMENT (Oct 30,
 *  2026, Jason's eye, corrected four times in one night).
 *  Florida, the first true wearer (102 visits), showed NO
 *  visible purple: a small state's blurred shape under the
 *  map's brightest gold light washed out entirely. The
 *  first fix gave the glow a true halo — a soft purple
 *  disc at the state's centroid, blooming past its rings.
 *  It read at last, but as a round BLOB: on Jason's own
 *  phone screenshot the purple spilled far past Florida's
 *  borders, over the Gulf, the Atlantic, and up toward
 *  Georgia — claiming ground Florida never earned. His
 *  ruling: "don't we want the purple inside the borders
 *  of Florida?" The map's honesty is geographic: a mark
 *  colors only the place that earned it. So the halo is
 *  GONE, and a subdivision's glow (withinBorders) is two
 *  within-borders parts: THIS mark lays the state's own
 *  shape filled with the purple, UNBLURRED, at 0.85,
 *  under the lights as before — the body itself tints,
 *  strongest where a light or an ember is thin — and
 *  StillKnockingTraceMark (below) carries the readable
 *  sign: a purple FRAME just INSIDE the border, above
 *  the lights, in the watch trace's grammar, at the
 *  legend purple's full strength (the centered
 *  border line this mark first paired with hid under
 *  the rings, and the gold washed the fill pale beside
 *  the legend's swatch — Jason caught both). Nothing
 *  purple stands outside the border line. Country
 *  callers pass no withinBorders: their soft bloom is
 *  untouched. */
function StillKnockingGlowMark({
  d,
  cx,
  cy,
  r,
  withinBorders,
  label,
  filterId,
}: {
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  withinBorders?: boolean;
  label: string;
  filterId: string;
}) {
  if (!d) {
    if (cx === undefined || cy === undefined || r === undefined) return null;
    return (
      <g>
        <title>{label}</title>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={STILL_KNOCKING_GLOW}
          fillOpacity="0.18"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={STILL_KNOCKING_GLOW}
          fillOpacity="0.55"
          filter={`url(#${filterId})`}
        />
      </g>
    );
  }
  if (withinBorders) {
    // A SUBDIVISION'S GLOW (within borders — see the note
    // above): the state's own shape filled with the purple,
    // UNBLURRED, so not a hair of color stands outside its
    // border, and strong (0.85) so the body tints through
    // where the gold above it is thin. No rim pass here —
    // the readable sign is StillKnockingTraceMark's inner
    // trace, drawn above the lights in its own layer; this
    // fill is the body under it.
    return (
      <g>
        <title>{label}</title>
        <path
          d={d}
          fill={STILL_KNOCKING_GLOW}
          fillRule="evenodd"
          fillOpacity="0.85"
        />
      </g>
    );
  }
  return (
    <g>
      <title>{label}</title>
      <path
        d={d}
        fill={STILL_KNOCKING_GLOW}
        fillRule="evenodd"
        fillOpacity="0.55"
        filter={`url(#${filterId})`}
      />
      <path
        d={d}
        fill="none"
        stroke={STILL_KNOCKING_GLOW}
        strokeWidth="2.5"
        strokeOpacity="0.3"
        filter={`url(#${filterId})`}
      />
    </g>
  );
}

/** THE STILL-KNOCKING INNER TRACE (Oct 30, 2026 — the
 *  third drawing of the mark in one night, each step
 *  corrected by Jason's eye). The within-borders fix
 *  first traced the state's own border in the purple,
 *  centered on the border line, above the lights. Jason
 *  looked at his phone and caught two things. (1) COLOR:
 *  the purple on the map read pale LAVENDER beside the
 *  legend's still-knocking swatch — the same #a855f7 in
 *  the can, but the fill lies under the gold light and
 *  the gold washes it, and the centered line hid under
 *  the rings that rest on the border. On screen they
 *  were not the same color. (2) THE IVORY RING: asked
 *  whether a top-layer purple line would REPLACE the
 *  ivory book-finished ring, Jason's answer settled the
 *  geometry for good — never: ivory (a book finished)
 *  and gold (the hundredfold) keep their seats OUTSIDE
 *  a place's line, untouched. So the purple takes the
 *  one seat that is wholly its own: INSIDE the border,
 *  in the watch trace's own grammar (Jason's design —
 *  the blue trace reads crisp in his screenshot for
 *  exactly this reason). The construction mirrors
 *  WatchTraceMark — strokes clipped to the silhouette,
 *  so only their inner halves show — set DEEPER by a
 *  mask: the mask keeps the shape and erases a 6-wide
 *  stroke's band around the border, so the trace's
 *  visible bands begin 3 units inside the line, clear
 *  of the watch trace's own ground (its core fills
 *  0→1.5 in, its skirt reaches 3). The knocking trace
 *  as first drawn: a soft pass (stroke 13 at 0.40,
 *  visible 3→6.5 in) under a core pass (stroke 9 at
 *  0.95, visible 3→4.5 in — the watch core's own
 *  1.5-unit width, at the legend purple's strength).
 *  Drawn ABOVE the gold
 *  light fills: nothing washes over it, so the purple
 *  on the map IS the legend's purple. The two inner
 *  traces share no ground — blue hugs the border,
 *  purple stands deeper — and where a place has earned
 *  both, they read as two separate lines. STEADY — no
 *  .hb-glow, no breathing. It carries no <title>: the
 *  glow under the lights already voices the place; this
 *  is the same sign, drawn where eyes land.
 *
 *  THE FRAME (Oct 30, 2026, the fourth drawing, later
 *  the same night — Jason's PHONE ruled on the third).
 *  The browser checks passed the thin trace too
 *  easily: they render wider than his 390px-class
 *  Android, and on his screen the purple inside
 *  Florida still read "pretty pale" — a 1.5-unit core
 *  of true color is ~3.5px in the panel there and next
 *  to nothing on the disc, and the state's body is
 *  dominated by the pale under-gold fill. PHONE FIRST,
 *  then: the trace is now a FRAME inside the border.
 *  Same mask (the visible band still begins 3 units
 *  in; the seats are unchanged — blue keeps 0→1.5,
 *  the rings keep the outside). A shoulder pass
 *  (stroke 14 at 0.55, visible 3→7 in) under a core
 *  pass (stroke 12 at 1.0 — full strength, no step
 *  down — visible 3→6 in): THREE units of the legend's
 *  own #a855f7, exactly double the third drawing's
 *  core, then one unit of the shoulder's moderate
 *  violet (6→7 in) grading into the gold body. The
 *  whole visible band is 4 units: in the closer-look
 *  panel (157 units across ~370px of phone screen,
 *  ~2.36px a unit) that is ~9–10px, ~7px of it true
 *  purple; on the disc (1000 units across the same
 *  width) it is ~1.5px — a small mark there, as it
 *  must be: the panel is where this honor lives. THE
 *  PENINSULA, honestly: Florida's peninsula is only
 *  ~8–10 units wide, so each coast's frame — 3 masked
 *  units plus 4 of band — reaches past the middle and
 *  the two frames MEET: the peninsula wears graded
 *  purple across its whole width, the full-strength
 *  cores joining at its center as a violet spine of
 *  TRUE color, not the pale stripe of the third
 *  drawing. The panhandle is wide enough to keep a
 *  true frame with gold inside it. Accepted geometry,
 *  named here so no one later mistakes the spine for
 *  a flaw. */
function StillKnockingTraceMark({
  idKey,
  d,
}: {
  idKey: string;
  d: string;
}) {
  const clipId = `knocking-${idKey.replace(/[^A-Za-z0-9-]/g, "")}`;
  const maskId = `knockingmask-${idKey.replace(/[^A-Za-z0-9-]/g, "")}`;
  return (
    <g aria-hidden="true">
      <clipPath id={clipId}>
        <path d={d} />
      </clipPath>
      <mask
        id={maskId}
        maskUnits="userSpaceOnUse"
        x="-100"
        y="-100"
        width="1200"
        height="1200"
      >
        <path d={d} fill="white" />
        <path d={d} fill="none" stroke="black" strokeWidth="6" />
      </mask>
      <g clipPath={`url(#${clipId})`} mask={`url(#${maskId})`}>
        <path
          d={d}
          fill="none"
          stroke={STILL_KNOCKING_GLOW}
          strokeWidth="14"
          strokeOpacity="0.55"
        />
        <path
          d={d}
          fill="none"
          stroke={STILL_KNOCKING_GLOW}
          strokeWidth="12"
          strokeOpacity="1"
        />
      </g>
    </g>
  );
}

/** THE UNSAID DEEP TIER (Oct 30, 2026) — the same
 *  construction as the still-knocking glow above, in the
 *  deeper purple (STILL_KNOCKING_DEEP_GLOW, #7e22ce), for
 *  a divided country whose shown day brought a thousand
 *  or more visits in all (the decision is
 *  countryStillKnockingDeepOn() in
 *  lib/heartbeat-display.ts). Deliberately voiceless:
 *  Jason ruled it "just unsaid" — no <title> here, and no
 *  legend row, chip, aria, or caption anywhere names it.
 *  It is drawn first among the disc's marks, under every
 *  light, so the states' own glows bloom inside it while
 *  the deep color keeps the whole country's outside.
 *  STEADY — no .hb-glow, no breathing. Disc only: the
 *  closer-look panel holds states, not the country. */
function StillKnockingDeepGlowMark({
  d,
  cx,
  cy,
  r,
  filterId,
}: {
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  filterId: string;
}) {
  if (!d) {
    if (cx === undefined || cy === undefined || r === undefined) return null;
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={STILL_KNOCKING_DEEP_GLOW}
          fillOpacity="0.18"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={STILL_KNOCKING_DEEP_GLOW}
          fillOpacity="0.55"
          filter={`url(#${filterId})`}
        />
      </g>
    );
  }
  return (
    <g>
      <path
        d={d}
        fill={STILL_KNOCKING_DEEP_GLOW}
        fillRule="evenodd"
        fillOpacity="0.55"
        filter={`url(#${filterId})`}
      />
      <path
        d={d}
        fill="none"
        stroke={STILL_KNOCKING_DEEP_GLOW}
        strokeWidth="2.5"
        strokeOpacity="0.3"
        filter={`url(#${filterId})`}
      />
    </g>
  );
}

/** PRAYING HANDS (Nov 3, 2026 — Jason saw the candle
 *  live and ruled: same color and feel, but the center
 *  should be "a little like prayer hands") — the glyph
 *  at the prayer light's heart, drawn once and used by
 *  both the map mark and its legend swatch. Two palms
 *  pressed together, fingers pointing up: each hand is
 *  its own shape, so the candle amber glows through the
 *  seam where they meet; the left hand wears the plain
 *  cream, the right the same cream deepened a step (the
 *  soft amber shading), and the thumbs lie across the
 *  front as two long amber ridges running down from the
 *  seam. Bold and simple on purpose — at the map's size
 *  the split form and the ridges are what read; no fine
 *  detail is attempted. Glyph space: 14.8 tall, 8.1
 *  wide, origin at its center; callers scale it to the
 *  flame's old footprint. */
function PrayingHandsGlyph({
  x,
  y,
  scale,
}: {
  x: number;
  y: number;
  scale: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M -0.35 -7.4 C -1.5 -7.3 -2.6 -6.2 -3 -4.8 C -3.5 -3.2 -3.9 -1.2 -4 0.8 C -4.05 2.6 -3.6 4.4 -2.9 5.7 L -3.6 7.4 L -1.15 7.4 L -0.6 5.9 C -0.4 3.6 -0.35 1 -0.35 -1.6 C -0.35 -4 -0.35 -5.8 -0.35 -7.4 Z"
        fill="#fff6da"
      />
      <path
        d="M 0.35 -7.4 C 1.5 -7.3 2.6 -6.2 3 -4.8 C 3.5 -3.2 3.9 -1.2 4 0.8 C 4.05 2.6 3.6 4.4 2.9 5.7 L 3.6 7.4 L 1.15 7.4 L 0.6 5.9 C 0.4 3.6 0.35 1 0.35 -1.6 C 0.35 -4 0.35 -5.8 0.35 -7.4 Z"
        fill="#ffe9b0"
      />
      <path
        d="M -0.52 -2.8 C -1.3 -1.2 -2 0.3 -2.6 1.7"
        fill="none"
        stroke="#f08a24"
        strokeWidth="0.62"
        strokeLinecap="round"
        strokeOpacity="0.88"
      />
      <path
        d="M 0.52 -2.8 C 1.3 -1.2 2 0.3 2.6 1.7"
        fill="none"
        stroke="#f08a24"
        strokeWidth="0.62"
        strokeLinecap="round"
        strokeOpacity="0.88"
      />
    </g>
  );
}

/** THE PRAYER LIGHT (Nov 2, 2026) — a warm, candle-like
 *  glow for the Philippines, a place being prayed for
 *  before the Word has been opened there (the decisions
 *  are prayerLightOn / prayerAnsweredToday in the
 *  component; the color is PRAYER_CANDLE in
 *  lib/heartbeat-display.ts). The construction keeps it
 *  unmistakably a candle and never a count: the country's
 *  own shape rests in the candle amber — a soft blurred
 *  pass under a steadier one, so the archipelago itself
 *  glows the way a candle lights a room — and at its
 *  center a small pair of PRAYING HANDS stands where a
 *  flame first stood (Nov 3, 2026, Jason's ruling: same
 *  color and feel, hands at the heart — see
 *  PrayingHandsGlyph above). No bright heart (hearts
 *  belong to chapter lights), no ring, no trace, and a
 *  breathing all its own — .hb-prayer, slower and
 *  shallower than the lights' .hb-glow, and still under
 *  reduced motion. */
function PrayerLightMark({
  d,
  cx,
  cy,
  label,
}: {
  d: string;
  cx: number;
  cy: number;
  label: string;
}) {
  return (
    <g className="hb-prayer">
      <title>{label}</title>
      <path
        d={d}
        fill={PRAYER_CANDLE}
        fillRule="evenodd"
        fillOpacity="0.5"
        filter="url(#hb-soft)"
      />
      <path
        d={d}
        fill={PRAYER_CANDLE}
        fillRule="evenodd"
        fillOpacity="0.34"
        stroke="#ffd9a0"
        strokeWidth="0.8"
        strokeOpacity="0.5"
      />
      <circle
        cx={cx}
        cy={cy}
        r="15"
        fill={PRAYER_CANDLE}
        opacity="0.4"
        filter="url(#hb-soft)"
      />
      <PrayingHandsGlyph x={cx} y={cy} scale={0.77} />
    </g>
  );
}

/** PRAYER ANSWERED (Nov 2, 2026 — Jason: "that one would
 *  be big") — the candle's successor for ONE day: the
 *  first day the Philippines records chapter activity,
 *  the place wears this wide, radiant mark instead. It is
 *  built to be impossible to mistake for an ordinary read:
 *  where a chapter light's whole halo spans ~27 units and
 *  the widest ring ~37, this burst runs to 60 — a broad
 *  soft halo, TWELVE rays, a gold-white ring at r=36 in
 *  the ivory ring's double-stroke grammar but far wider,
 *  and a bright core over the country's own radiant fill.
 *  It breathes on the lights' .hb-glow (steady under
 *  reduced motion, like them). Drawn last in the disc's
 *  group, over the ordinary light the day also earned —
 *  the day after, only that ordinary light remains. */
function PrayerAnsweredMark({
  d,
  cx,
  cy,
  label,
}: {
  d: string;
  cx: number;
  cy: number;
  label: string;
}) {
  const rays = Array.from({ length: 12 }, (_, k) => {
    const a = (Math.PI / 6) * k;
    return {
      x1: cx + 41 * Math.cos(a),
      y1: cy + 41 * Math.sin(a),
      x2: cx + 56 * Math.cos(a),
      y2: cy + 56 * Math.sin(a),
    };
  });
  return (
    <g className="hb-glow">
      <title>{label}</title>
      <path d={d} fill="#ffdf8a" fillRule="evenodd" fillOpacity="0.45" />
      <circle
        cx={cx}
        cy={cy}
        r="60"
        fill="#ffdf8a"
        opacity="0.32"
        filter="url(#hb-soft)"
      />
      {rays.map((r, k) => (
        <line
          key={k}
          x1={r.x1}
          y1={r.y1}
          x2={r.x2}
          y2={r.y2}
          stroke="#ffe9a8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
      ))}
      <circle
        cx={cx}
        cy={cy}
        r="36"
        fill="none"
        stroke="#fff3c4"
        strokeWidth="7.5"
        strokeOpacity="0.22"
      />
      <circle
        cx={cx}
        cy={cy}
        r="36"
        fill="none"
        stroke="#fff3c4"
        strokeWidth="3"
        strokeOpacity="0.95"
      />
      <circle cx={cx} cy={cy} r="11" fill="#fff8dc" opacity="0.9" />
      <circle cx={cx} cy={cy} r="5.5" fill="#ffffff" opacity="0.95" />
    </g>
  );
}

/** THE GOLDEN SCROLL GLYPH (Nov 3, 2026) — a small unrolled
 *  scroll in the family's own colors: gold rolls, cream
 *  parchment, two quiet gold lines where the writing would
 *  rest. Drawn once, inline, so the honor above the disc
 *  needs no image file and no emblem — the emblem's rules
 *  are not this element's, and none is used. Decorative:
 *  the line of text beside it carries the whole meaning. */
function GoldenScrollGlyph() {
  return (
    <svg
      viewBox="0 0 40 28"
      width="22"
      height="16"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <rect x="6" y="5" width="28" height="18" rx="2" fill="#f7ead0" />
      <line
        x1="12.5"
        y1="11.5"
        x2="27.5"
        y2="11.5"
        stroke="#b98a2f"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1="12.5"
        y1="16.5"
        x2="23"
        y2="16.5"
        stroke="#b98a2f"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="3.5" y="2.5" width="5.5" height="23" rx="2.75" fill="#e4b95c" />
      <rect x="31" y="2.5" width="5.5" height="23" rx="2.75" fill="#e4b95c" />
    </svg>
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
        books: c.books ?? 0,
        bookFinishedOn: c.bookFinishedOn ?? null,
      }))
      // A place stands in the rows on ANY activity: chapters,
      // opens alone (Oct 27, 2026 — it rests on the map as an
      // ember, so the rows, the list, and the disc all see it),
      // or watches alone (Oct 29, 2026 — its blue inner trace must be
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
          books: s.books ?? 0,
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
    booksFinished: number;
    countries: HbCountryRow[];
    subdivisions: LiveSubdivisionDisplay[];
  }
  const browsedDay: ShownDay | null = browsing
    ? {
        date: shownDate,
        chaptersRead: browsedRaw?.chaptersRead ?? 0,
        chaptersHeard: browsedRaw?.chaptersHeard ?? 0,
        booksFinished: browsedRaw?.booksFinished ?? 0,
        countries: normalizeCountryRows(browsedRaw?.countries ?? []),
        subdivisions: normalizeSubdivisionRows(browsedRaw?.subdivisions ?? []),
      }
    : null;
  const shownCount = browsedDay
    ? browsedDay.chaptersRead + browsedDay.chaptersHeard
    : todayCount;
  const shownBooks = browsedDay
    ? browsedDay.booksFinished
    : (today.booksFinished ?? 0);
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

  // ── Day deep-link (Oct 30, 2026) ─────────────────────────────
  // A shared link may name the day — ?day=YYYY-MM-DD — so a story
  // can open the map as it stood that night (the California
  // kindling post points at 2026-10-29). Read once, client-side,
  // when the live record first arrives: a real past day inside
  // the record enters day browsing exactly as if the reader had
  // stepped back to it — same rows, same counts, same Today
  // button home. A malformed, future, pre-record, or same-day
  // value is ignored silently; with no param, nothing changes.
  // (window.location read, after GrandmaReset's house pattern —
  // no router state, no SSR, so the ordinary visit is untouched.)
  const dayLinkApplied = useRef(false);
  useEffect(() => {
    if (dayLinkApplied.current || fixture) return;
    if (!liveActive || !live || !recordStart) return;
    dayLinkApplied.current = true;
    let day: string | null = null;
    try {
      day = new URLSearchParams(window.location.search).get("day");
    } catch {
      day = null;
    }
    if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
    // A real calendar day, not just the shape of one: a date like
    // 2026-02-31 rolls forward when parsed and fails the round trip.
    if (utcToDayKey(dayKeyToUTC(day)) !== day) return;
    if (day < recordStart || day >= live.today.date) return;
    // Syncing one piece of state from the address bar, once, when
    // the record it must be checked against has arrived.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedDate(day);
  }, [live, liveActive, recordStart, fixture]);

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
  // THE DAY TOLD AS A SENTENCE (Jason, Oct 31, 2026 — the first of
  // three tellings he crowned together): the caption under the disc
  // learns to say how many PLACES the shown day's chapters were
  // opened in, counted exactly as the growth record counts places
  // (growthPlaces): every country and every subdivision standing
  // in the shown day with chapters or opens.
  const shownPlaces = (() => {
    const seen = new Set<string>();
    const cs = browsedDay
      ? browsedDay.countries
      : mapSource === "live"
        ? liveRows
        : snapRows;
    for (const c of cs) if (c.total > 0 || (c.opens ?? 0) > 0) seen.add(c.code);
    for (const s of shownSubdivisions)
      if (s.total > 0 || (s.opens ?? 0) > 0) seen.add(s.code);
    return seen.size;
  })();
  // THE GOLDEN SCROLL (Nov 3, 2026) — decided against the SHOWN
  // set, from the same rows Telling 1 counts its places from:
  // today's live rows at the default, the browsed day's while
  // stepping back. (In the resting snapshot fallback the rows
  // carry no per-place books, so the scroll simply never
  // stands there.) The decision itself — threshold, the
  // most-specific-place rule, most books first — is
  // goldenScrollPlaces() in lib/heartbeat-display.ts.
  const scrollPlaces = goldenScrollPlaces(
    browsedDay
      ? browsedDay.countries
      : mapSource === "live"
        ? liveRows
        : snapRows,
    shownSubdivisions
  );
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
  // as an ember and carries its blue inner trace inside it).
  const tierOf = (c: HbCountryRow): "full" | "ember" | "open" =>
    c.total === 0 ? "open" : modeOf(c.code);
  const subsOf = (code: string) =>
    subdivisionsOfCountry(shownSubdivisions, code);
  const anyEmber = mapRows.some((c) => tierOf(c) !== "full");

  // THE PRAYER LIGHT (Nov 2, 2026 — Jason's crown, the night
  // the app's link was carried by hand to Bacong Believers
  // Church in the Philippines): a standing candle for a
  // place being prayed for BEFORE the Word has been opened
  // there. It is NOT activity data — no row stands behind
  // it, and it renders though the Philippines has never
  // recorded a beat — so it is decided here, from the same
  // record the map already consumes (today's rows, the live
  // history, the checked-in snapshot; no new data), under
  // two laws:
  //   (1) THE GIVE-WAY: the moment the Philippines records
  //       chapter activity ANYWHERE in that record, the
  //       candle goes out for good (phEverActive) — the
  //       real marks take over, exactly as they do for any
  //       neighbor. Opens and watches never answer it:
  //       countryChaptersRecorded reads read/heard only.
  //   (2) THE ANSWERED DAY: on the FIRST day of that
  //       activity — active in today's rows, never active
  //       before today — the candle is replaced for that
  //       day by PrayerAnsweredMark, the big radiant sign
  //       (prayerAnsweredToday); from the next day the
  //       Philippines wears the ordinary marks alone.
  // Both signs belong to the live default: while day
  // browsing neither renders (the answered mark reads
  // today's rows; the candle is a present-tense sign), the
  // same discipline the ivory ring keeps. The candle also
  // waits for the first fetch to settle, so a resting first
  // paint never shows it an instant before the live record
  // corrects it — the truth gate's own caution.
  const phGeo = world.countries["PH"] ?? null;
  const phActiveToday =
    !browsedDay && countryChaptersRecorded(liveRows, "PH");
  const phActiveBeforeToday =
    countryChaptersRecorded(snapRows, "PH") ||
    (live
      ? historyAsc.some(
          (d) =>
            d.date < live.today.date &&
            countryChaptersRecorded(d.countries ?? [], "PH")
        )
      : false);
  const phEverActive =
    phActiveBeforeToday ||
    phActiveToday ||
    (live
      ? historyAsc.some((d) =>
          countryChaptersRecorded(d.countries ?? [], "PH")
        )
      : false);
  const prayerLightOn = settled && !browsedDay && !phEverActive;
  const prayerAnsweredToday = phActiveToday && !phActiveBeforeToday;
  const prayerLightTitle =
    "Philippines — a warm, candle-like light: praying for you — we are praying the Word will be opened here";
  const prayerAnsweredTitle =
    "Philippines — a wide, radiant light: prayer answered — the Word was opened here today, after prayer";

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
    `${name} — a green ring: book finished here today`;
  // THE HUNDREDFOLD (Oct 30, 2026) — decided against the SHOWN
  // set on the rows themselves: each shown row IS its day's
  // row, so the gold ring is true at the live default and for
  // a browsed day alike (the ?day= record shows a past day's
  // ring too). No date gate — hundredfold() in
  // lib/heartbeat-display.ts reads the row's own total, and a
  // country's ring ENCOMPASSES it when one of its subdivisions
  // bears the ring (Jason's re-ruling, late Oct 31, 2026 —
  // the ring no longer steps back).
  const subHundredfoldOn = (s: LiveSubdivisionDisplay) => hundredfold(s);
  const countryHundredfoldSignOn = (c: HbCountryRow) =>
    countryHundredfoldOn(c, shownSubdivisions);
  const usCountryRow = mapRows.find((c) => c.code === "US");
  const anyHundredfold =
    mapRows.some((c) => countryHundredfoldSignOn(c)) ||
    shownSubdivisions.some((s) => subHundredfoldOn(s));
  const hundredfoldTitle = (name: string) =>
    `${name} — a gold ring: the hundredfold — a hundred chapters read or heard here ${shownWhen}`;
  // STILL KNOCKING (Oct 30, 2026) — decided against the SHOWN
  // set on the rows themselves, like the hundredfold: each
  // shown row IS its day's row, so the purple glow is true at
  // the live default and for a browsed day alike. No date
  // gate — stillKnocking() in lib/heartbeat-display.ts reads
  // the row's own opens, visits only, in any chapter state.
  // STATE BY STATE (Jason's correction, the mark's first
  // night): the glow belongs to places — a state on its own
  // hundred, or a country with no subdivisions in the record
  // on its own — and a divided country's SUMMED visits never
  // earn it: countryStillKnockingOn refuses any country the
  // shown set divides. (The rings keep their step-back; the
  // stricter rule is this glow's alone.)
  const subStillKnockingOn = (s: LiveSubdivisionDisplay) => stillKnocking(s);
  const countryStillKnockingSignOn = (c: HbCountryRow) =>
    countryStillKnockingOn(c, shownSubdivisions);
  // THE UNSAID DEEP TIER (Oct 30, 2026, later still): a
  // divided country whose shown day brought a THOUSAND or
  // more visits in all wears a deep purple glow on the
  // disc — the one country-level form the correction left
  // standing, at ten times the count. It feeds NO voice:
  // anyStillKnocking below is untouched by it, and no
  // title, clause, chip, legend row, or caption reads this
  // decision. Rendered only, exactly as Jason ruled it.
  const countryStillKnockingDeepSignOn = (c: HbCountryRow) =>
    countryStillKnockingDeepOn(c, shownSubdivisions);
  const anyStillKnocking =
    mapRows.some((c) => countryStillKnockingSignOn(c)) ||
    shownSubdivisions.some((s) => subStillKnockingOn(s));
  const stillKnockingTitle = (name: string) =>
    `${name} — a purple glow: still knocking — a hundred visits here ${shownWhen}`;
  // The per-row voice of the purple glow, in kindledClause's
  // own shape. Visits are its whole substance, so unlike the
  // ring clauses it can speak anywhere — an opens-only place
  // carries it too.
  const stillKnockingClause = (r: HbCountryRow): string =>
    stillKnocking(r)
      ? ` — still knocking: a hundred or more visits ${shownWhen}`
      : "";
  // The country voice of the same clause follows the SIGN,
  // not the raw row (state by state, Oct 30, 2026): a
  // divided country never speaks it on its summed visits —
  // its states speak for themselves, through the clause
  // above on their own rows.
  const countryStillKnockingClause = (c: HbCountryRow): string =>
    countryStillKnockingSignOn(c)
      ? ` — still knocking: a hundred or more visits ${shownWhen}`
      : "";
  // The aria voice of the purple glow, in hundredfoldClause's
  // own shape: the places within this country that wear it in
  // the shown day, named plainly.
  const knockingClause = (c: HbCountryRow): string => {
    const names: string[] = [];
    if (countryStillKnockingSignOn(c)) names.push(c.name);
    for (const s of subsOf(c.code))
      if (subStillKnockingOn(s)) names.push(s.name);
    return names.length
      ? `; a purple glow marks ${names.join(" and ")} — still knocking: a hundred visits there ${shownWhen}`
      : "";
  };
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
      ? `; a green ring marks ${names.join(" and ")} — book finished there today`
      : "";
  };
  // The aria voice of the gold ring, in ringClause's own shape:
  // the places within this country that wear it in the shown
  // day, named plainly. (In the opens-only branch of
  // describeCountry it can never speak — a hundred chapters is
  // chapters, and an opens-only country has none.)
  const hundredfoldClause = (c: HbCountryRow): string => {
    const names: string[] = [];
    if (countryHundredfoldSignOn(c)) names.push(c.name);
    for (const s of subsOf(c.code))
      if (subHundredfoldOn(s)) names.push(s.name);
    return names.length
      ? `; a gold ring marks ${names.join(" and ")} — the hundredfold: a hundred chapters read or heard there ${shownWhen}`
      : "";
  };

  // THE BLUE INNER TRACE (Oct 29, 2026) — a video watched
  // in the app traces the watcher's place from inside. Its voices (title/aria
  // only — Jason's ruling: no visible count words anywhere; the
  // legend's "Video watched" row is the only words it
  // carries). The clause is honest about what a watch is: a
  // video watched — never a chapter, never a light.
  const watchClause = (r: HbCountryRow): string =>
    r.watches > 0
      ? `; a blue inner trace marks ${r.name} — a video was watched here ${shownWhen}`
      : "";
  const watchTitle = (r: HbCountryRow): string =>
    r.watches > 0
      ? ` — a blue inner trace: a video was watched here ${shownWhen}`
      : "";
  // KINDLING (Oct 29, 2026) — the voice of the warm-red ember:
  // 75 or more visits in the shown day, and no chapters yet. The
  // decision is kindled() in lib/heartbeat-display.ts, shared by
  // the disc and the closer-look panel so they always agree.
  const kindledClause = (r: HbCountryRow): string =>
    kindled(r) ? ` — kindled: 75 or more visits ${shownWhen}` : "";
  // The finest geography carries the trace, as it carries the
  // light (v3.1.1): a country's own trace stands only when none
  // of its shown subdivisions carries one.
  const countryWatchHeartOn = (c: HbCountryRow): boolean =>
    c.watches > 0 &&
    !shownSubdivisions.some((s) => s.country === c.code && s.watches > 0);

  // A CLOSER LOOK (Oct 29, 2026) — the enlarged, horizontal
  // United States panel under the disc reads the SAME shown set
  // as the disc (shownSubdivisions — today's rows at the live
  // default, the browsed day's while stepping back): no second
  // fetch, no second data path, so the panel can never disagree
  // with the disc above it. Its aria voice is built from the
  // disc's own phrases.
  const usShownSubdivisions = shownSubdivisions.filter(
    (s) => s.country === "US"
  );
  const closerLookLabel = gathering
    ? "An enlarged map of the United States, drawn horizontally so the states can be seen, at rest while today's count gathers."
    : usShownSubdivisions.length > 0
      ? `An enlarged map of the United States, drawn horizontally so the states can be seen. ${usShownSubdivisions
          .map(
            (s) =>
              (s.total > 0
                ? subdivisionPhrase(s)
                : s.opens > 0
                  ? subdivisionOpenPhrase(s) + kindledClause(s) + stillKnockingClause(s)
                  : `${s.name} — a video was watched here ${shownWhen}; it rests as a faint ember, not fully lit${kindledClause(s)}${stillKnockingClause(s)}`) +
              (subHaloOn(s)
                ? "; a green ring marks it — book finished here today"
                : "") +
              (subHundredfoldOn(s)
                ? `; a gold ring marks it — the hundredfold: a hundred chapters read or heard here ${shownWhen}`
                : "") +
              (subStillKnockingOn(s)
                ? `; a purple glow marks it — still knocking: a hundred visits here ${shownWhen}`
                : "") +
              watchClause(s)
          )
          .join("; ")}.`
      : `An enlarged map of the United States, drawn horizontally so the states can be seen. No state carries a count ${shownWhen}.`;

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
      const base = `the app was opened in ${c.name} ${shownWhen} — ${fmt(allTimeOpensOf(c))} ${allTimeOpensOf(c) === 1 ? "visit" : "visits"} in all, and the Word has not been opened there yet; ${c.name} rests as a faint ember, glowing a little brighter with visits, not fully lit${kindledClause(c)}${countryStillKnockingClause(c)}${countryWatchHeartOn(c) ? watchClause(c) : ""}`;
      return subs.length > 0
        ? `${base}; its divisions rest as embers where recorded: ${subs
            .map((s) =>
              s.opens > 0
                ? subdivisionOpenPhrase(s) + kindledClause(s) + stillKnockingClause(s) + watchClause(s)
                : `${s.name} — a video was watched here ${shownWhen}; ${s.name} rests as a faint ember, not fully lit${kindledClause(s)}${stillKnockingClause(s)}`
            )
            .join("; ")}`
        : base;
    }
    if (modeOf(c.code) === "ember") {
      const subs = subsOf(c.code);
      return `reading recorded across ${c.name} — ${fmt(c.total)} ${c.total === 1 ? "chapter" : "chapters"} ${shownWhen}; ${c.name} itself rests as a faint ember, not lit, and its divisions are lit where recorded: ${subs.map((s) => subdivisionPhrase(s) + watchClause(s)).join("; ")}${ringClause(c)}${hundredfoldClause(c)}${knockingClause(c)}${countryWatchHeartOn(c) ? watchClause(c) : ""}`;
    }
    return `${mapPhrase(c)}, lit in its own shape${ringClause(c)}${hundredfoldClause(c)}${knockingClause(c)}${watchClause(c)}`;
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

  // The prayer signs speak in the figure's own voice (they
  // carry legend rows, so — unlike the unsaid deep tier —
  // they are named): the candle as what it is, prayer and
  // never a count, and the answered mark on its one day.
  const prayerAria = prayerAnsweredToday
    ? " The Philippines wears a wide, radiant light — a prayer answered: the Word was opened there today, after prayer."
    : prayerLightOn
      ? " A warm, candle-like light rests on the Philippines. It is not a count — it marks prayer: we are praying for the Philippines, that the Word will be opened there."
      : "";

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
      aria-labelledby="heartbeat-heading"
      className="mx-auto max-w-6xl px-2 pb-4 pt-6 sm:px-6"
    >
      {/* The #earth-map anchor lands on the card itself (Oct 30,
          2026): on the section, the jump stopped at an 80px scroll
          margin — 15px more than the 65px sticky header needs —
          plus the section's own 24px top padding above the card,
          so the view settled a little above the map. On the card
          with a 72px margin (the header + a breath of air), the
          landing settles on the panel: heading and disc in frame. */}
      <div
        id="earth-map"
        className="scroll-mt-[4.5rem] overflow-hidden rounded-2xl border border-gold-500/15 bg-vineyard-900 px-6 py-10 sm:px-10"
      >
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
        {/* (Second size pass, Nov 1, 2026 — see MAP_SCALE's
            note: on phone widths this figure bleeds 16px toward
            the card's edges, -mx-4, and the column widens to
            max-w-3xl from sm up.) */}
        {/* THE GOLDEN SCROLL (Nov 3, 2026) — the honor stands
            ABOVE the disc, outside the legend, exactly where
            Jason placed it: the legend below the disc is not
            crowded by so much as a row, and the feat gets a
            place of its own at the map's head. One line per
            place that earned it in the shown day, most books
            first, in the map's own voice and the caption's own
            number style (Telling 1 writes its counts as
            numerals: "8 whole books finished"). For a past
            shown day the line names that day the way the
            caption does — "on {long date}". Most days this
            renders nothing at all: the threshold is ten whole
            books in one place in one day, and the scroll is
            rare on purpose. */}
        {scrollPlaces.length > 0 ? (
          <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center gap-1.5 px-2">
            {scrollPlaces.map((p) => (
              <p
                key={`${p.name}-${p.books}`}
                className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1.5 text-center text-xs font-semibold text-gold-300 sm:text-sm"
              >
                <GoldenScrollGlyph />
                {fmt(p.books)} books finished in {p.name}
                {browsedDay
                  ? ` on ${longDate(browsedDay.date)}`
                  : " today"}
                .
              </p>
            ))}
          </div>
        ) : null}
        <figure role="img" aria-label={figureLabel + prayerAria} className="-mx-4 mt-6 sm:mx-auto sm:max-w-3xl">
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
                  still reads as light.
                  SECOND WATER PASS (Nov 1, 2026, Jason again:
                  "make the ocean like a sea a bit more realistic
                  or at least lighter blue"): the night sea lifts
                  to a true ocean blue — #2a7ab0 at the heart,
                  #1f6395 mid-water, #174a73 at the rim — lighter
                  toward the disc's heart, deeper at the rim, so
                  it still reads as water with depth, never a
                  flat fill. Every mark was re-proven against the
                  brighter water before the change (composited
                  separations measured, not eyeballed): the land
                  reads BETTER on the new blue, the gold lights,
                  embers and their rims, the ivory and
                  hundredfold rings, both purples, kindling's
                  red and the legend all hold their separations
                  at or above the old sea's. One mark took a
                  minimal depth adjustment — the blue watch
                  trace, whose pale line lost the most ground
                  over pale land; see WatchTraceMark's note. The
                  hero slide's disc wears these same stops, so
                  both maps are the same world, and the two
                  deep-sea panels below (the legend strip, the
                  closer look) follow the rim to #174a73 as they
                  were always designed to — panel and rim are
                  one color. */}
              <radialGradient id="hb-sea" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2a7ab0" />
                <stop offset="55%" stopColor="#1f6395" />
                <stop offset="100%" stopColor="#174a73" />
              </radialGradient>
            </defs>
            {/* the disc's rim — a soft ring holding the world
                (lifted a touch, 0.18 → 0.25, in the Nov 1, 2026
                presence pass below, so the disc reads as a disc
                at phone width) */}
            <circle cx="500" cy="500" r="497" fill="url(#hb-sea)" />
            <circle
              cx="500"
              cy="500"
              r="490"
              fill="none"
              stroke="#e8d9ae"
              strokeWidth="1"
              opacity="0.25"
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
                so unlit land never competes with an ember.
                Presence pass (Jason, Nov 1, 2026): fill 0.22 →
                0.28, stroke 0.20 → 0.40 at width 0.6 → 0.8 — at
                phone width a country is made out mostly by its
                border, so the borders carry this pass. The guard
                above still holds: 0.28 stays under the faintest
                gold light's base (silhouetteFill starts at 0.30),
                and an ember's gold layers over this cream exactly
                as before — rendering presence only; no mark is
                added, moved, or changed.
                DARK EARTH PASS (third pass, Nov 1, 2026 — Jason,
                with the new ocean on his phone: "make the land
                darker so that when our lights show up it really
                pops"): the ground trades the pale parchment for
                a deep olive-brown earth, #5f5430 — the parchment
                family darkened, warm, never grey or black — at
                fill 0.78, the pale parchment surviving only in
                the border stroke (0.42) so countries still draw
                their own outlines on the dark ground. Measured
                before it shipped, the pass-2 way (every mark
                composited at its real values over the old land
                and the new): the land itself darkens ~15 L*
                points (53 → 36 over mid-water) and separates
                from the sea FAR better than the pale land did
                (ΔE ~14 → ~30 at every stop — warm earth against
                blue water), so unlit land reads as land more
                surely than before. The lights' POP is luminance:
                the faintest chapter light's contrast against
                its ground rises 1.26 → 1.60, a full light's
                1.63 → 2.53, a light's bright core 3.64 → 6.71,
                and the gold now renders true gold instead of a
                blue-washed tint. The faint marks were the risk
                and were checked hardest: the ember's fill holds
                its separation (ΔE 6.0 → 6.2, its rim 12.5 →
                14.6 and up), kindling's fill actually gains
                (13.6 → 18.3), the purples and the deep tier
                gain wide, the watch trace nearly doubles
                (23.6 → 47.9) — NO mark needed strengthening,
                and no light, fill, or count changed: the data
                encodings are untouched, only the ground under
                them darkened. The hero slide and the closer
                look wear the same earth, so the page is one
                world. */}
            <path
              d={world.land}
              fill="#5f5430"
              fillRule="evenodd"
              fillOpacity="0.78"
              stroke="#e8d9ae"
              strokeWidth="0.8"
              strokeOpacity="0.42"
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
            {/* STILL KNOCKING (Oct 30, 2026) — a soft purple
                glow for a place whose shown day brought a
                hundred or more visits, drawn FIRST among the
                marks, under the lights themselves: gold keeps
                a place's inside, purple blooms past its border
                as a halo around the light. Any chapter state
                wears it — a kindled ember's red inside the
                purple, a hundredfold light's gold ring inside
                it too — and it is STEADY: no .hb-glow, no
                breathing, a kept sign for the day. STATE BY
                STATE (Jason's correction, Oct 30, 2026): a
                divided country never wears it on its summed
                visits (countryStillKnockingOn) — its states
                wear their own below; only a country with no
                subdivisions in the record glows as a country. */}
            {/* THE PRAYER LIGHT (Nov 2, 2026) — the candle for
                the Philippines, drawn first among the marks,
                under every light: it is not a light earned by
                a count but a prayer kept for a place, so it
                rests beneath the day's activity and never
                competes with it. It stands only while the
                Philippines has recorded no chapter activity
                anywhere in the record (the decision block
                above); on the first day the Word is opened
                there, the answered mark at the end of this
                group takes its place for that day. */}
            {prayerLightOn && phGeo ? (
              <PrayerLightMark
                d={phGeo.path}
                cx={phGeo.cx}
                cy={phGeo.cy}
                label={prayerLightTitle}
              />
            ) : null}
            {/* THE UNSAID DEEP TIER (Oct 30, 2026) — drawn
                before every other glow, under all the lights:
                a divided country whose shown day brought a
                thousand or more visits in all, in the deep
                purple (StillKnockingDeepGlowMark). It has no
                title and no text anywhere speaks it — the
                color is the whole statement, as Jason ruled. */}
            {mapRows.map((c) =>
              countryStillKnockingDeepSignOn(c) ? (
                c.geo ? (
                  <StillKnockingDeepGlowMark
                    key={`knocking-deep-${c.code}`}
                    d={c.geo.path}
                    filterId="hb-soft"
                  />
                ) : c.centroid ? (
                  <StillKnockingDeepGlowMark
                    key={`knocking-deep-${c.code}`}
                    cx={c.centroid.cx}
                    cy={c.centroid.cy}
                    r={lightRadius(c.total) * 2.1 + 6}
                    filterId="hb-soft"
                  />
                ) : null
              ) : null
            )}
            {mapRows.map((c) =>
              countryStillKnockingSignOn(c) ? (
                c.geo ? (
                  <StillKnockingGlowMark
                    key={`knocking-${c.code}`}
                    d={c.geo.path}
                    label={stillKnockingTitle(c.name)}
                    filterId="hb-soft"
                  />
                ) : c.centroid ? (
                  <StillKnockingGlowMark
                    key={`knocking-${c.code}`}
                    cx={c.centroid.cx}
                    cy={c.centroid.cy}
                    r={lightRadius(c.total) * 2.1 + 6}
                    label={stillKnockingTitle(c.name)}
                    filterId="hb-soft"
                  />
                ) : null
              ) : null
            )}
            {/* A subdivision's glow, WITHIN BORDERS (Oct 30,
                2026, Jason's ruling — see StillKnocking
                GlowMark's note): the state's own shape filled
                with the purple, unblurred, under the lights;
                its readable sign — the purple inner trace —
                is drawn in its own layer above the lights.
                No halo: the purple claims only the ground the
                state itself covers. */}
            {shownSubdivisions.map((s) =>
              subStillKnockingOn(s) && s.geo ? (
                <StillKnockingGlowMark
                  key={`knocking-${s.code}`}
                  d={s.geo.path}
                  withinBorders
                  label={stillKnockingTitle(s.name)}
                  filterId="hb-soft"
                />
              ) : null
            )}
            {mapRows.map((c, i) =>
              c.geo ? (
                tierOf(c) !== "full" ? (
                  <g key={`sil-${c.code}`}>
                    <title>
                      {tierOf(c) === "open" ? openPhrase(c) : emberPhrase(c)}
                      {kindledClause(c)}
                      {countryStillKnockingClause(c)}
                      {countryWatchHeartOn(c) ? watchTitle(c) : ""}
                    </title>
                    <path
                      d={c.geo.path}
                      fill={kindled(c) ? KINDLING_FILL : "#e4b95c"}
                      fillRule="evenodd"
                      fillOpacity={
                        kindled(c)
                          ? KINDLING_FILL_OPACITY
                          : tierOf(c) === "open"
                            ? emberOpacityForOpens(allTimeOpensOf(c))
                            : EMBER_FILL_OPACITY
                      }
                      stroke={kindled(c) ? KINDLING_RIM : "#ffe1a1"}
                      strokeWidth={tierOf(c) === "open" ? 1.1 : 0.8}
                      strokeOpacity={
                        kindled(c)
                          ? EMBER_STROKE_MAX_OPACITY
                          : tierOf(c) === "open"
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
                      ? " — book finished here today; a green ring marks it"
                      : ""}
                    {subHundredfoldOn(s)
                      ? ` — the hundredfold: a hundred chapters read or heard here ${shownWhen}; a gold ring marks it`
                      : ""}
                    {stillKnockingClause(s)}
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
                        ? subdivisionOpenPhrase(s) + kindledClause(s) + stillKnockingClause(s) + watchTitle(s)
                        : `${s.name} — a video was watched here ${shownWhen}; it rests as a faint ember, glowing a little brighter with visits, its rim brightening too${kindledClause(s)}${stillKnockingClause(s)}`}
                    </title>
                    <path
                      d={s.geo.path}
                      fill={kindled(s) ? KINDLING_FILL : "#ffdf8a"}
                      fillRule="evenodd"
                      fillOpacity={
                        kindled(s)
                          ? KINDLING_FILL_OPACITY
                          : emberOpacityForOpens(allTimeOpensOfSubdivision(s))
                      }
                      stroke={kindled(s) ? KINDLING_RIM : "#ffe9b0"}
                      strokeWidth="1.0"
                      strokeOpacity={
                        kindled(s)
                          ? EMBER_STROKE_MAX_OPACITY
                          : emberStrokeForOpens(allTimeOpensOfSubdivision(s))
                      }
                    />
                  </g>
                )
              ) : null
            )}
            {/* THE STILL-KNOCKING INNER TRACES (Oct 30,
                2026, third drawing; widened to a FRAME in
                the fourth, phone-first — see StillKnocking
                TraceMark's note) — each knocking state's
                purple frame just INSIDE its border, drawn
                here: ABOVE the gold light fills just
                rendered (nothing washes it, so the purple
                is the legend's purple at full strength) and
                in its own layer below the hearts, the blue
                traces, and the rings. The blue watch trace
                hugs the border (its core 0→1.5 in); this
                frame stands deeper (full-strength core
                3→6 in, graded band to 7 in) — the two
                share no ground and read as separate marks
                where a place has earned both. The
                hundredfold gold and ivory rings rest
                OUTSIDE the state's line, untouched. */}
            {shownSubdivisions.map((s) =>
              subStillKnockingOn(s) && s.geo ? (
                <StillKnockingTraceMark
                  key={`knocking-trace-${s.code}`}
                  idKey={s.code}
                  d={s.geo.path}
                />
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
                      {kindledClause(c)}
                      {countryStillKnockingClause(c)}
                      {countryWatchHeartOn(c) ? watchTitle(c) : ""}
                    </title>
                    <circle
                      cx={c.centroid.cx}
                      cy={c.centroid.cy}
                      r={lightRadius(c.total)}
                      fill={kindled(c) ? KINDLING_FILL : "#e4b95c"}
                      fillOpacity={
                        kindled(c)
                          ? KINDLING_FILL_OPACITY
                          : tierOf(c) === "open"
                            ? emberOpacityForOpens(allTimeOpensOf(c))
                            : EMBER_FILL_OPACITY
                      }
                      stroke={
                        kindled(c)
                          ? KINDLING_RIM
                          : tierOf(c) === "open"
                            ? "#ffe1a1"
                            : "none"
                      }
                      strokeWidth={tierOf(c) === "open" || kindled(c) ? 1.2 : 0}
                      strokeOpacity={
                        kindled(c)
                          ? EMBER_STROKE_MAX_OPACITY
                          : tierOf(c) === "open"
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
            {/* THE BLUE INNER TRACES (Oct 29, 2026) — a video
                watched in the app traces the watcher's place
                for the shown day: a pale screen-blue outline
                just inside the place's own border (Jason's
                design — the trace IS the place, so it can never
                be mistaken for another). The finest geography
                carries it, as it carries the light: a
                subdivision's trace stands for its country's
                watches; the country's own trace stands only
                when no shown subdivision carries one. A place
                with watches but no chapters keeps its ember (or
                its quiet land) — the trace is its only bright
                mark, and it never makes a light. Drawn before
                the ivory rings, so a ring for the day still
                rests outside everything it honors. */}
            {shownSubdivisions.map((s) =>
              s.watches > 0 && s.geo ? (
                <WatchTraceMark
                  key={`watch-${s.code}`}
                  idKey={s.code}
                  d={s.geo.path}
                  label={`${s.name} — a blue inner trace: a video was watched here ${shownWhen}`}
                />
              ) : null
            )}
            {mapRows.map((c) =>
              countryWatchHeartOn(c) ? (
                c.geo ? (
                  <WatchTraceMark
                    key={`watch-${c.code}`}
                    idKey={c.code}
                    d={c.geo.path}
                    label={`${c.name} — a blue inner trace: a video was watched here ${shownWhen}`}
                  />
                ) : c.centroid ? (
                  <WatchTraceMark
                    key={`watch-${c.code}`}
                    idKey={c.code}
                    cx={c.centroid.cx}
                    cy={c.centroid.cy}
                    fallbackR={lightRadius(c.total) * 2.1 + 2}
                    label={`${c.name} — a blue inner trace: a video was watched here ${shownWhen}`}
                  />
                ) : null
              ) : null
            )}
            {/* THE HUNDREDFOLD RING (Oct 30, 2026) — drawn just
                before the ivory rings, so where a place has
                earned both, the rings nest: ivory on the border
                for the book finished, gold beyond it for the
                hundred chapters. A steady gold ring around the
                mark of a place whose shown day brought a hundred
                or more chapters read or heard — around a
                silhouette, clipped to the shape's outside (the
                watch trace's mirror); around a centroid light,
                a circle beyond the ivory ring's own. A country's
                ring ENCOMPASSES it when one of its subdivisions
                wears the ring (countryHundredfoldOn — Jason's
                re-ruling, late Oct 31, 2026: both rings stand). */}
            {mapRows.map((c) =>
              countryHundredfoldSignOn(c) ? (
                c.geo ? (
                  <HundredfoldRingMark
                    key={`hundredfold-${c.code}`}
                    idKey={c.code}
                    d={c.geo.path}
                    label={hundredfoldTitle(c.name)}
                  />
                ) : c.centroid ? (
                  <HundredfoldRingMark
                    key={`hundredfold-${c.code}`}
                    idKey={c.code}
                    cx={c.centroid.cx}
                    cy={c.centroid.cy}
                    r={lightRadius(c.total) * 2.1 + 10}
                    label={hundredfoldTitle(c.name)}
                  />
                ) : null
              ) : null
            )}
            {shownSubdivisions.map((s) =>
              subHundredfoldOn(s) && s.geo ? (
                <HundredfoldRingMark
                  key={`hundredfold-${s.code}`}
                  idKey={s.code}
                  d={s.geo.path}
                  label={hundredfoldTitle(s.name)}
                />
              ) : null
            )}
            {/* THE BOOK RING (Oct 28, 2026; vine green since Nov 4, 2026) — drawn last, over
                the lights it honors: a soft vine-green ring traced
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
                      stroke="#94c64a"
                      strokeWidth="3.4"
                      strokeOpacity="0.22"
                    />
                    <path
                      d={c.geo.path}
                      fill="none"
                      stroke="#94c64a"
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
                      stroke="#94c64a"
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
                    stroke="#94c64a"
                    strokeWidth="3.4"
                    strokeOpacity="0.22"
                  />
                  <path
                    d={s.geo.path}
                    fill="none"
                    stroke="#94c64a"
                    strokeWidth="1.5"
                    strokeOpacity="0.9"
                  />
                </g>
              ) : null
            )}
            {/* PRAYER ANSWERED (Nov 2, 2026) — drawn last,
                over the lights it celebrates, as the ivory
                rings are drawn over theirs: on the first day
                the Philippines records chapter activity, the
                candle gives way to this wide, radiant mark
                for that day alone — far larger and brighter
                than any ordinary light, so an answered prayer
                can never be mistaken for one more read. From
                the next day, only the ordinary marks remain. */}
            {prayerAnsweredToday && phGeo ? (
              <PrayerAnsweredMark
                d={phGeo.path}
                cx={phGeo.cx}
                cy={phGeo.cy}
                label={prayerAnsweredTitle}
              />
            ) : null}
            </g>
            {/* THE LEGEND (Oct 29, 2026, Jason's crown — built
                first ON the disc, riding the Pacific water of the
                upper-left quadrant; MOVED the same night to a
                deep-sea strip directly beneath the disc, at
                Jason's word, when the fifth meaning — kindling —
                made five honest rows outgrow the ocean). The
                water was re-proven before the move: sampled
                against every country and subdivision path
                (MAP_SCALE applied, on a 2-unit grid), the largest
                empty rectangle in that patch runs ~260x256 units
                (the long way, ~304x204), while five rows at the
                legend's own 22-unit type with honest air between
                them need ~284 wide x ~320 tall — and the kindled
                line alone measures 289 wide at 22 units. On the
                disc the rows had to squeeze (two lines were set
                with textLength, a horizontal crush), and Jason,
                looking at his phone, saw the words crowd and
                overlap. So the key now stands under the disc at
                full map-column width — same deep-sea panel (its
                ground follows the sea's rim; #174a73 since the
                Nov 1, 2026 lighter-sea pass), same
                gold border — where every meaning gets its own
                line at full size and nothing is crushed. The
                disc's prose and aria label carry these meanings
                too, so the legend is reinforcement, not the sole
                carrier. */}
          </svg>
          <figcaption className="mt-2 text-center text-sm text-sage-300">
            {gathering ? (
              "Gathering today's count — the lights kindle as the count comes in."
            ) : browsedDay ? (
              shownCount > 0 ? (
                <>
                  {fmt(shownCount)}{" "}
                  {shownCount === 1 ? "chapter" : "chapters"} read or heard
                  on {longDate(browsedDay.date)}
                  {shownPlaces > 0 && (
                    <>
                      {" "}
                      in {fmt(shownPlaces)}{" "}
                      {shownPlaces === 1 ? "place" : "places"}
                    </>
                  )}
                  {shownBooks > 0 && (
                    <>
                      {" "}
                      — and {fmt(shownBooks)} whole{" "}
                      {shownBooks === 1 ? "book" : "books"} finished
                    </>
                  )}{" "}
                  —{" "}
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
                today, {longDate(today.date)}
                {shownPlaces > 0 && (
                  <>
                    {" "}
                    in {fmt(shownPlaces)}{" "}
                    {shownPlaces === 1 ? "place" : "places"}
                  </>
                )}
                {shownBooks > 0 && (
                  <>
                    {" "}
                    — and {fmt(shownBooks)} whole{" "}
                    {shownBooks === 1 ? "book" : "books"} finished
                  </>
                )}{" "}
                — each light on the map, a neighbor.
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
              ? " A green ring — book finished here today."
              : ""}
            {anyHundredfold
              ? ` A gold ring — the hundredfold: 100 chapters read or heard here ${shownWhen}.`
              : ""}
            {anyStillKnocking
              ? ` A purple glow — still knocking: 100 visits here ${shownWhen}.`
              : ""}
            {prayerAnsweredToday
              ? " A wide, radiant light marks the Philippines — a prayer answered: the Word was opened there today, after prayer."
              : ""}
            {prayerLightOn
              ? " A warm, candle-like light rests on the Philippines — praying for you: it marks prayer, not a count."
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

        {/* THE LEGEND STRIP (Oct 29, 2026) — the map's key,
            standing in its own deep-sea panel directly beneath
            the disc (moved off the disc the same night it gained
            its fifth row; see the note inside the SVG above for
            the proven geometry). The meanings — five from
            Oct 29, 2026, a sixth, the hundredfold's gold ring,
            from Oct 30, 2026, and a seventh, still knocking's
            purple glow, from later that same night — each on
            its own line at full size, in a tidy grid that
            wraps with the column — no squeezed lines, no
            overlap at any width. The swatches are the marks
            themselves in miniature: the golden light with its
            bright heart, the steady ember, the ivory ring's
            double stroke, the same double stroke in the
            lights' gold for the hundredfold, a soft purple
            glow for still knocking, the ember turned warm red
            for kindling, and a small outline wearing its own
            blue inner trace. Still knocking stands beside
            kindled — the two visit marks together, the
            seeking family's two thresholds (75 and 100).
            (Nov 2, 2026: an eighth and ninth row — the
            prayer light's candle and the answered prayer's
            radiant burst — the map's first marks that are
            not counts at all: a prayer kept, and a prayer
            answered. They close the key, in the order the
            story itself runs.)
            (Nov 1, 2026, the lighter-sea pass: the panel
            follows the sea's rim as it was designed to —
            #0b2836 → #174a73 — and the strip takes the
            figure's own size treatment, -mx-4 on phones and
            max-w-3xl from sm up, so the key still stands at
            the map column's full width under the disc.) */}
        <div
          className="-mx-4 mt-6 rounded-2xl border border-gold-500/25 px-5 py-5 sm:mx-auto sm:max-w-3xl sm:px-6"
          style={{ backgroundColor: "#174a73" }}
        >
          <h3 className="text-base font-semibold text-[#e8d9ae]">
            How to read this map:
          </h3>
          <ul className="mt-4 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
            <li className="flex items-center gap-3">
              <svg
                viewBox="0 0 26 26"
                aria-hidden="true"
                focusable="false"
                className="h-[26px] w-[26px] shrink-0"
              >
                <circle cx="13" cy="13" r="10" fill="#e4b95c" fillOpacity="0.55" stroke="#ffe1a1" strokeWidth="1" strokeOpacity="0.6" />
                <circle cx="13" cy="13" r="3.8" fill="#fff3c4" />
              </svg>
              <span className="text-[15px] leading-snug text-[#f6efdb]">
                Word read or heard here
              </span>
            </li>
            <li className="flex items-center gap-3">
              <svg
                viewBox="0 0 26 26"
                aria-hidden="true"
                focusable="false"
                className="h-[26px] w-[26px] shrink-0"
              >
                <circle cx="13" cy="13" r="10" fill="#e4b95c" fillOpacity="0.18" stroke="#ffe1a1" strokeWidth="1.2" strokeOpacity="0.68" />
              </svg>
              <span className="text-[15px] leading-snug text-[#f6efdb]">
                App opened here — brightens with visits
              </span>
            </li>
            <li className="flex items-center gap-3">
              <svg
                viewBox="0 0 26 26"
                aria-hidden="true"
                focusable="false"
                className="h-[26px] w-[26px] shrink-0"
              >
                <circle cx="13" cy="13" r="9.5" fill="none" stroke="#94c64a" strokeWidth="3.4" strokeOpacity="0.22" />
                <circle cx="13" cy="13" r="9.5" fill="none" stroke="#94c64a" strokeWidth="1.7" strokeOpacity="0.9" />
              </svg>
              <span className="text-[15px] leading-snug text-[#f6efdb]">
                Book finished here today
              </span>
            </li>
            <li className="flex items-center gap-3">
              <svg
                viewBox="0 0 26 26"
                aria-hidden="true"
                focusable="false"
                className="h-[26px] w-[26px] shrink-0"
              >
                <circle cx="13" cy="13" r="9.5" fill="none" stroke="#e4b95c" strokeWidth="3.4" strokeOpacity="0.2" />
                <circle cx="13" cy="13" r="9.5" fill="none" stroke="#e4b95c" strokeWidth="1.7" strokeOpacity="0.9" />
              </svg>
              <span className="text-[15px] leading-snug text-[#f6efdb]">
                Hundredfold — 100 chapters in a day
              </span>
            </li>
            <li className="flex items-center gap-3">
              <svg
                viewBox="0 0 26 26"
                aria-hidden="true"
                focusable="false"
                className="h-[26px] w-[26px] shrink-0"
              >
                <circle cx="13" cy="13" r="10.5" fill="#a855f7" fillOpacity="0.22" />
                <circle cx="13" cy="13" r="7" fill="#a855f7" fillOpacity="0.5" stroke="#c084fc" strokeWidth="1.2" strokeOpacity="0.9" />
              </svg>
              <span className="text-[15px] leading-snug text-[#f6efdb]">
                Still Knocking — 100 visits in a day
              </span>
            </li>
            <li className="flex items-center gap-3">
              <svg
                viewBox="0 0 26 26"
                aria-hidden="true"
                focusable="false"
                className="h-[26px] w-[26px] shrink-0"
              >
                <circle cx="13" cy="13" r="10" fill="#d9482f" fillOpacity="0.35" stroke="#f0664a" strokeWidth="1.4" strokeOpacity="0.94" />
              </svg>
              <span className="text-[15px] leading-snug text-[#f6efdb]">
                Kindled — 75 visits in a day
              </span>
            </li>
            <li className="flex items-center gap-3">
              <svg
                viewBox="0 0 26 26"
                aria-hidden="true"
                focusable="false"
                className="h-[26px] w-[26px] shrink-0"
              >
                <rect x="3" y="3" width="20" height="20" rx="4" fill="none" stroke="#e8d9ae" strokeWidth="1.4" strokeOpacity="0.8" />
                <rect x="6" y="6" width="14" height="14" rx="3" fill="none" stroke="#8fd8ff" strokeWidth="1.8" />
              </svg>
              <span className="text-[15px] leading-snug text-[#f6efdb]">
                Video watched
              </span>
            </li>
            <li className="flex items-center gap-3">
              <svg
                viewBox="0 0 26 26"
                aria-hidden="true"
                focusable="false"
                className="h-[26px] w-[26px] shrink-0"
              >
                <circle cx="13" cy="13" r="10.5" fill="#ffab4a" fillOpacity="0.3" />
                <circle cx="13" cy="13" r="6.5" fill="#ffab4a" fillOpacity="0.5" />
                <PrayingHandsGlyph x={13} y={12.7} scale={0.51} />
              </svg>
              <span className="text-[15px] leading-snug text-[#f6efdb]">
                Praying for you — a place we're praying will open the Word with us
              </span>
            </li>
            <li className="flex items-center gap-3">
              <svg
                viewBox="0 0 26 26"
                aria-hidden="true"
                focusable="false"
                className="h-[26px] w-[26px] shrink-0"
              >
                <g stroke="#ffe9a8" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9">
                  <line x1="13" y1="3.5" x2="13" y2="0.7" />
                  <line x1="13" y1="22.5" x2="13" y2="25.3" />
                  <line x1="3.5" y1="13" x2="0.7" y2="13" />
                  <line x1="22.5" y1="13" x2="25.3" y2="13" />
                  <line x1="19.7" y1="6.3" x2="21.7" y2="4.3" />
                  <line x1="19.7" y1="19.7" x2="21.7" y2="21.7" />
                  <line x1="6.3" y1="19.7" x2="4.3" y2="21.7" />
                  <line x1="6.3" y1="6.3" x2="4.3" y2="4.3" />
                </g>
                <circle cx="13" cy="13" r="8.5" fill="none" stroke="#fff3c4" strokeWidth="3" strokeOpacity="0.22" />
                <circle cx="13" cy="13" r="8.5" fill="none" stroke="#fff3c4" strokeWidth="1.6" strokeOpacity="0.95" />
                <circle cx="13" cy="13" r="3.6" fill="#fff8dc" />
              </svg>
              <span className="text-[15px] leading-snug text-[#f6efdb]">
                Prayer answered — the Word opened here after prayer
              </span>
            </li>
          </ul>
        </div>

        {/* A CLOSER LOOK (Oct 29, 2026, Jason's crown — see
            US_PANEL_VIEWBOX above): the United States enlarged
            and horizontal in its own deep-sea panel directly
            under the disc, carrying the shown day's own marks —
            the same rows, the same treatments, the same helpers
            as the disc (full golden light with its bright core,
            the opens-only ember with its graduated rim, the blue
            inner trace, the ivory ring, the hundredfold's gold
            ring, the still-knocking purple glow), so stepping
            the day steps the panel too. The
            panel names data resolution
            as its only reason; it carries no flag and no
            patriotic dressing (Jason's hard rule).
            (Nov 1, 2026: the panel's deep-sea ground follows
            the sea's rim, #0b2836 → #174a73, per the
            lighter-sea pass — panel and rim stay one color.
            Third pass, later Nov 1, 2026 — Jason, loving the
            new ocean: "maybe change the color of it on the
            United States one down below": the panel's MAP now
            carries its own sea — the disc's very gradient
            (hb-sea-us, the same three stops in panel space)
            laid behind the states, so the water inside the
            map is the ocean itself, not the flat rim blue;
            the panel's surrounding ground stays the rim blue
            as crowned, and the gradient's own corners land on
            that same rim color, so the seam is invisible. The
            states wear the disc's new dark earth too — see
            the ground layer's dark-earth note.) */}
        <div
          className="mx-auto mt-10 max-w-3xl rounded-2xl border border-gold-500/25 px-4 py-6 sm:px-6"
          style={{ backgroundColor: "#174a73" }}
        >
          <h3 className="text-center font-display text-xl text-cream-50">
            A closer look: the United States
          </h3>
          <figure role="img" aria-label={closerLookLabel} className="mt-4">
            <svg
              viewBox={US_PANEL_VIEWBOX}
              aria-hidden="true"
              focusable="false"
              className="w-full"
            >
              <defs>
                <filter id="hb-soft-us" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="7" />
                </filter>
                {/* the panel's own sea (third pass, Nov 1,
                    2026): the disc's ocean gradient — the same
                    three stops, #2a7ab0 at the heart → #1f6395
                    → #174a73 at the rim — expressed in the
                    panel's own coordinates (userSpaceOnUse,
                    centered on the viewBox, r=94 so the corners
                    reach the rim stop and meet the panel's
                    rim-blue ground without a seam) */}
                <radialGradient id="hb-sea-us" gradientUnits="userSpaceOnUse" cx="345.5" cy="476" r="94">
                  <stop offset="0%" stopColor="#2a7ab0" />
                  <stop offset="55%" stopColor="#1f6395" />
                  <stop offset="100%" stopColor="#174a73" />
                </radialGradient>
              </defs>
              {/* the ocean inside the panel's map — an
                  unrotated rect in panel space behind the
                  rotated states (third pass, Nov 1, 2026) */}
              <rect x="267" y="426" width="157" height="100" fill="url(#hb-sea-us)" />
              <g transform={US_PANEL_TRANSFORM}>
                {/* every mainland state + DC, quiet — the same
                    dark earth the disc's land wears (third
                    pass, Nov 1, 2026: #5f5430 at 0.62, a touch
                    quieter than the disc's 0.78 as the panel's
                    base always sat a step under the disc's;
                    its state-vs-sea separation measured
                    ~21 ΔE, up from ~12 on the old flat ground,
                    and every panel mark re-proven over it —
                    see the ground layer's dark-earth note) */}
                {US_PANEL_STATES.map(({ code, geo }) => (
                  <g key={`us-base-${code}`}>
                    <title>{geo.name}</title>
                    <path
                      d={geo.path}
                      fill="#5f5430"
                      fillRule="evenodd"
                      fillOpacity="0.62"
                      stroke="#e8d9ae"
                      strokeWidth="0.6"
                      strokeOpacity="0.34"
                    />
                  </g>
                ))}
                {/* still knocking — the disc's purple glow,
                    under the panel's lights as on the disc:
                    a hundred or more visits in the shown day,
                    steady, in any chapter state. WITHIN
                    BORDERS here too (Oct 30, 2026, Jason's
                    ruling): the state's shape filled unblurred
                    under its light, and its purple inner trace
                    drawn above the lights in the layer below —
                    no halo, no spill past the state line. */}
                {usShownSubdivisions.map((s) =>
                  subStillKnockingOn(s) && s.geo ? (
                    <StillKnockingGlowMark
                      key={`us-knocking-${s.code}`}
                      d={s.geo.path}
                      withinBorders
                      label={stillKnockingTitle(s.name)}
                      filterId="hb-soft-us"
                    />
                  ) : null
                )}
                {/* the shown day's lit states — the disc's full
                    treatment at this larger scale: glow, golden
                    fill, breathing, and the bright core at the
                    state's own center */}
                {usShownSubdivisions.map((s, i) =>
                  s.geo && s.total > 0 ? (
                    <g
                      key={`us-sub-${s.code}`}
                      className="hb-glow"
                      style={{ animationDelay: `${((i + 2) % 5) * 0.9}s` }}
                    >
                      <title>
                        {subdivisionPhrase(s)}
                        {subHaloOn(s)
                          ? " — book finished here today; a green ring marks it"
                          : ""}
                        {subHundredfoldOn(s)
                          ? ` — the hundredfold: a hundred chapters read or heard here ${shownWhen}; a gold ring marks it`
                          : ""}
                        {stillKnockingClause(s)}
                        {watchTitle(s)}
                      </title>
                      <path
                        d={s.geo.path}
                        fill="#ffdf8a"
                        fillRule="evenodd"
                        opacity={subdivisionGlow(s.total)}
                        filter="url(#hb-soft-us)"
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
                      <circle cx={s.geo.cx} cy={s.geo.cy} r="6.5" fill="#ffdf8a" opacity="0.3" />
                      <circle cx={s.geo.cx} cy={s.geo.cy} r="2.6" fill="#fff3c4" />
                    </g>
                  ) : null
                )}
                {/* opens/watch-only states — the disc's ember:
                    faint and steady, its rim brightening with
                    visits; no glow, no breathing, no heart */}
                {usShownSubdivisions.map((s) =>
                  s.geo && s.total === 0 ? (
                    <g key={`us-ember-${s.code}`}>
                      <title>
                        {s.opens > 0
                          ? subdivisionOpenPhrase(s) + kindledClause(s) + stillKnockingClause(s) + watchTitle(s)
                          : `${s.name} — a video was watched here ${shownWhen}; it rests as a faint ember, glowing a little brighter with visits, its rim brightening too${kindledClause(s)}${stillKnockingClause(s)}`}
                      </title>
                      <path
                        d={s.geo.path}
                        fill={kindled(s) ? KINDLING_FILL : "#ffdf8a"}
                        fillRule="evenodd"
                        fillOpacity={
                          kindled(s)
                            ? KINDLING_FILL_OPACITY
                            : emberOpacityForOpens(allTimeOpensOfSubdivision(s))
                        }
                        stroke={kindled(s) ? KINDLING_RIM : "#ffe9b0"}
                        strokeWidth="1.0"
                        strokeOpacity={
                          kindled(s)
                            ? EMBER_STROKE_MAX_OPACITY
                            : emberStrokeForOpens(allTimeOpensOfSubdivision(s))
                        }
                      />
                    </g>
                  ) : null
                )}
                {/* STILL KNOCKING — THE PURPLE FILLS THE
                    STATE (Oct 31, 2026, Jason's ruling: "make
                    the still knocking fill the rest of the
                    state area with that purple"): above the
                    lights and embers, the knocking state's
                    whole area wears the purple as its body,
                    so the state reads purple at a glance.
                    Every honor keeps its seat ABOVE the fill:
                    the purple frame inside the border, the
                    blue watch trace, the gold hundredfold
                    ring, the ivory book ring. The under-light
                    glow fill still runs beneath as before;
                    this cap is what the eye meets. */}
                {usShownSubdivisions.map((s) =>
                  subStillKnockingOn(s) && s.geo ? (
                    <g key={`us-knocking-fill-${s.code}`}>
                      <title>{stillKnockingTitle(s.name)}</title>
                      <path
                        d={s.geo.path}
                        fill={STILL_KNOCKING_GLOW}
                        fillRule="evenodd"
                        fillOpacity="0.85"
                      />
                    </g>
                  ) : null
                )}
                {/* the still-knocking inner traces — the
                    disc's purple frame just inside the
                    border, above the panel's lights and
                    embers, below its traces and rings. The
                    panel shares the disc's world units, so
                    the frame keeps the same unit measure
                    there — and the panel is where it lives:
                    in a 157-unit viewBox across a phone's
                    width the band (visible 3→7 in: a
                    3-unit core at full strength, 1 unit of
                    graded shoulder) reads ~9–10px wide,
                    ~7px of it true purple — widened in the
                    fourth drawing (Oct 30) after the thin
                    trace read pale on Jason's phone. Blue
                    at the border, purple deeper in, the
                    two marks distinct where both are owed */}
                {usShownSubdivisions.map((s) =>
                  subStillKnockingOn(s) && s.geo ? (
                    <StillKnockingTraceMark
                      key={`us-knocking-trace-${s.code}`}
                      idKey={`panel-${s.code}`}
                      d={s.geo.path}
                    />
                  ) : null
                )}
                {/* the blue inner traces — the disc's own mark,
                    under its own clip ids for this panel */}
                {usShownSubdivisions.map((s) =>
                  s.watches > 0 && s.geo ? (
                    <WatchTraceMark
                      key={`us-watch-${s.code}`}
                      idKey={`panel-${s.code}`}
                      d={s.geo.path}
                      label={`${s.name} — a blue inner trace: a video was watched here ${shownWhen}`}
                    />
                  ) : null
                )}
                {/* THE HUNDREDFOLD ENCOMPASSES THE COUNTRY
                    (Jason, late Oct 31, 2026): when one of its
                    states bears the hundredfold, the gold ring
                    also outlines the whole United States down
                    here — the country's own border from the
                    same map geometry, drawn before the states'
                    own rings so each state keeps its crown
                    inside the country's. */}
                {usCountryRow?.geo && countryHundredfoldSignOn(usCountryRow) ? (
                  <HundredfoldRingMark
                    key="us-hundredfold-US"
                    idKey="panel-US"
                    d={usCountryRow.geo.path}
                    label={hundredfoldTitle(usCountryRow.name)}
                  />
                ) : null}
                {/* the hundredfold rings — the disc's gold ring,
                    drawn just before the ivory rings so the two
                    nest in the panel as they do on the disc:
                    ivory inside, gold outside */}
                {usShownSubdivisions.map((s) =>
                  subHundredfoldOn(s) && s.geo ? (
                    <HundredfoldRingMark
                      key={`us-hundredfold-${s.code}`}
                      idKey={`panel-${s.code}`}
                      d={s.geo.path}
                      label={hundredfoldTitle(s.name)}
                    />
                  ) : null
                )}
                {/* the ivory rings — the disc's double stroke,
                    resting outside the lights they honor */}
                {usShownSubdivisions.map((s) =>
                  subHaloOn(s) && s.geo ? (
                    <g key={`us-halo-${s.code}`}>
                      <title>{haloTitle(s.name)}</title>
                      <path
                        d={s.geo.path}
                        fill="none"
                        stroke="#94c64a"
                        strokeWidth="3.4"
                        strokeOpacity="0.22"
                      />
                      <path
                        d={s.geo.path}
                        fill="none"
                        stroke="#94c64a"
                        strokeWidth="1.5"
                        strokeOpacity="0.9"
                      />
                    </g>
                  ) : null
                )}
              </g>
            </svg>
            <figcaption className="mt-3 text-center text-sm text-sage-300">
              The same states, closer — recorded state by state.
            </figcaption>
          </figure>
        </div>

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
              {vineRows.map((c, i) => {
                // THE TWO-LINE CHIP (Oct 30, 2026, Jason's approved
                // fix): a chip carrying honor badges — book
                // finished, hundredfold, still knocking — sets its
                // stats on the first line and its honors on a line
                // of their own below, in their marks' own colors
                // (ivory for the book finished, the hundredfold
                // gold, the still-knocking purple). One line
                // holding all six segments
                // overflowed the phone's width and clipped the
                // place's own name — Florida, the first
                // hundredfold, read "lorida". Badgeless chips keep
                // the one-line form exactly; every line wraps
                // inside the pill and the name never shrinks, so
                // no chip can run off the edge again.
                const bookFinished = countryHaloOn(c);
                const hundredfoldSign = countryHundredfoldSignOn(c);
                const knockingSign = countryStillKnockingSignOn(c);
                const honored = bookFinished || hundredfoldSign || knockingSign;
                return (
                <li
                  key={c.code}
                  className={
                    honored
                      ? "flex max-w-full flex-col items-center gap-y-0.5 rounded-full border border-gold-500/25 bg-vineyard-950/60 px-3.5 py-1.5 text-sm text-cream-100"
                      : "inline-flex max-w-full items-center rounded-full border border-gold-500/25 bg-vineyard-950/60 px-3.5 py-1.5 text-sm text-cream-100"
                  }
                >
                  <span className="flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
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
                  <span className="shrink-0">{c.name}</span>
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
                  </span>
                  {honored && (
                    <span className="flex max-w-full flex-wrap items-center justify-center gap-x-2">
                      {bookFinished && (
                        <span className="text-[#94c64a]">
                          ·{" "}
                          {typeof c.books === "number" && c.books > 1
                            ? `${c.books} books finished`
                            : "book finished"}
                        </span>
                      )}
                      {hundredfoldSign && (
                        <span className="text-[#e4b95c]">· hundredfold</span>
                      )}
                      {knockingSign && (
                        <span className="text-[#a855f7]">· still knocking</span>
                      )}
                    </span>
                  )}
                </li>
                );
              })}
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
                    {rows.map((s, i) => {
                      // The two-line chip, as on the country chips
                      // above: honors on their own line below the
                      // stats, in their marks' own colors.
                      const bookFinished = subHaloOn(s);
                      const hundredfoldSign = subHundredfoldOn(s);
                      const knockingSign = subStillKnockingOn(s);
                      const honored = bookFinished || hundredfoldSign || knockingSign;
                      return (
                      <li
                        key={s.code}
                        className={
                          honored
                            ? "flex max-w-full flex-col items-center gap-y-0.5 rounded-full border border-gold-500/25 bg-vineyard-950/60 px-3.5 py-1.5 text-sm text-cream-100"
                            : "inline-flex max-w-full items-center rounded-full border border-gold-500/25 bg-vineyard-950/60 px-3.5 py-1.5 text-sm text-cream-100"
                        }
                      >
                        <span className="flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
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
                        <span className="shrink-0">{s.name}</span>
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
                        </span>
                        {honored && (
                          <span className="flex max-w-full flex-wrap items-center justify-center gap-x-2">
                            {bookFinished && (
                              <span className="text-[#94c64a]">
                                ·{" "}
                                {typeof s.books === "number" && s.books > 1
                                  ? `${s.books} books finished`
                                  : "book finished"}
                              </span>
                            )}
                            {hundredfoldSign && (
                              <span className="text-[#e4b95c]">· hundredfold</span>
                            )}
                            {knockingSign && (
                              <span className="text-[#a855f7]">· still knocking</span>
                            )}
                          </span>
                        )}
                      </li>
                      );
                    })}
                    {countryRow && unrecorded > 0 && (
                      <li
                        key={`${country}-not-recorded`}
                        className="max-w-full rounded-full border border-cream-100/15 bg-vineyard-950/40 px-3.5 py-1.5 text-sm text-cream-100/75"
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
                  className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-gold-500/25 bg-vineyard-950/60 px-3.5 py-1.5 text-sm text-cream-100"
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
