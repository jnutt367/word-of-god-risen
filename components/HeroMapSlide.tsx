"use client";

import worldMap from "@/lib/world-map.json";
import {
  EMBER_FILL_OPACITY,
  EMBER_STROKE_MAX_OPACITY,
  HUNDREDFOLD_RING,
  KINDLING_FILL,
  KINDLING_FILL_OPACITY,
  KINDLING_RIM,
  STILL_KNOCKING_DEEP_GLOW,
  STILL_KNOCKING_GLOW,
  bookHaloOn,
  countryBookHaloOn,
  countryHundredfoldOn,
  countryStillKnockingDeepOn,
  countryStillKnockingOn,
  emberOpacityForOpens,
  emberStrokeForOpens,
  hundredfold,
  kindled,
  lightModeForCountry,
  stillKnocking,
} from "@/lib/heartbeat-display";

/**
 * The live Earth map slide (Jason, Oct 31, 2026, 05:26–05:27 EDT —
 * "a polished version of the map that actually shows updates… but
 * looks a different kind of style"; clarified in his own words as
 * "almost Pixar-ish"). The tenth and last slide of the hero cycle.
 *
 * It is NOT a picture of the map. It is the map itself, drawn a
 * second time in a painterly dress: the same flat Earth-map disc
 * (Jason's term — never "globe"), the same vendored geography
 * (lib/world-map.json), the same live rows, and every mark decided
 * by the same pure functions in lib/heartbeat-display.ts that the
 * full map section below renders from — so this slide can never
 * disagree with the real map. What differs is only the tailoring:
 * a dawn-sea ground warmed toward the hero stills' family, softer
 * and wider glow passes, and NONE of the dashboard furniture —
 * no legend, no chips, no labels, no numbers. The full honest map
 * with its legend keeps its own section, untouched.
 *
 * THE DATA (honesty laws, absolute): HeroCycle fetches
 * GET /api/heartbeat once on mount — the same endpoint, the same
 * no-store fetch, the same validation BodyHeartbeat's loader uses
 * — and hands the payload here only when it is the LIVE record
 * (data.live === true). This component renders TODAY's rows
 * exactly as the API returned them: today's countries, today's
 * subdivisions, today's date for the ivory ring, and the history
 * sums for all-time ember brightness, each mirroring the real
 * map's own derivations line for line in spirit. If the fetch
 * failed or the payload was not the live record, HeroCycle never
 * renders this component at all — the cycle simply runs its nine
 * image slides. No invented lights, no snapshot dressed as today,
 * no cached yesterday. A live payload with no rows yet today is
 * still the truth, and renders as what it is: the Earth at rest,
 * unlit — the disc before dawn.
 *
 * THE MARKS, in the real map's own layer order: the unsaid deep
 * purple tier first (rendered, never written — no title, no text,
 * exactly as Jason ruled it), still-knocking glows under the
 * lights (a subdivision's within its own borders, its readable
 * sign the purple frame above the lights), ember and opens-only
 * places at their graduated faintness with kindling's warm red,
 * full golden lights breathing on the family's own .hb-glow (the
 * global class already rests under prefers-reduced-motion), the
 * hearts, the blue video-watch inner traces, the hundredfold gold
 * rings, and the ivory book-finished rings last, over all. The
 * small opacity curves and radii below are copied verbatim from
 * BodyHeartbeat's render treatment so the two surfaces grade a
 * light the same way; every DECISION — which place wears what —
 * comes from lib/heartbeat-display.ts alone.
 *
 * The breathing is the map's own and nothing more: the hero cycle
 * never even reaches this slide for a visitor who prefers reduced
 * motion (the tomb stands still instead), and while the slide is
 * up it fades on the cycle's own 8-second / 1.5-second rhythm.
 */

export interface HeroMapCountRow {
  code: string;
  read?: number;
  heard?: number;
  total?: number;
  opens?: number;
  watches?: number;
  bookFinishedOn?: string | null;
}

export interface HeroMapSubdivisionRow extends HeroMapCountRow {
  country: string;
  region?: string;
  name?: string;
}

export interface HeroMapDay {
  date: string;
  countries?: HeroMapCountRow[];
  subdivisions?: HeroMapSubdivisionRow[];
}

/** The slice of the GET /api/heartbeat payload this slide reads —
 *  the same LiveData shape BodyHeartbeat consumes, narrowed to
 *  what the disc needs. */
export interface HeroMapPayload {
  live: boolean;
  totals?: { chaptersRead?: number };
  today: { date: string };
  countries: HeroMapCountRow[];
  subdivisions?: HeroMapSubdivisionRow[];
  history?: HeroMapDay[];
}

interface WorldCountry {
  name: string;
  path: string;
  cx: number;
  cy: number;
}

const world = worldMap as {
  viewBox: string;
  land: string;
  countries: Record<string, WorldCountry>;
  extraCentroids?: Record<string, { name: string; cx: number; cy: number }>;
  subdivisions?: Record<string, WorldCountry>;
};

/* The render treatment — copied verbatim from BodyHeartbeat.tsx
 * (its silhouette warmth, glow and radius curves, and the map
 * group scale), so a light reads at the same strength here as on
 * the real map. Presentation only: the decisions are imported. */
function lightRadius(total: number): number {
  return Math.min(13, 4.5 + 2.6 * Math.log10(1 + total));
}
function silhouetteFill(total: number): number {
  return Math.min(0.62, 0.3 + 0.11 * Math.log10(1 + total));
}
function silhouetteGlow(total: number): number {
  return Math.min(0.3, 0.14 + 0.055 * Math.log10(1 + total));
}
function subdivisionFill(total: number): number {
  return Math.min(0.55, 0.26 + 0.12 * Math.log10(1 + total));
}
function subdivisionGlow(total: number): number {
  return Math.min(0.26, 0.12 + 0.05 * Math.log10(1 + total));
}
const MAP_SCALE = 1.06;

interface PlaceRow {
  code: string;
  total: number;
  opens: number;
  watches: number;
  bookFinishedOn: string | null;
}

interface CountryDisplay extends PlaceRow {
  geo: WorldCountry | null;
  centroid: { cx: number; cy: number } | null;
}

interface SubdivisionDisplay extends PlaceRow {
  country: string;
  geo: WorldCountry | null;
}

/** The video-watch inner trace (Jason's design, Oct 29, 2026) —
 *  BodyHeartbeat's WatchTraceMark, drawn the same way: a pale
 *  screen-blue stroke clipped inside the place's own border, or a
 *  ring around a centroid light. Voiceless here — the hero slide
 *  carries no titles; the real map below names every mark. */
function WatchTraceMark({
  idKey,
  d,
  cx,
  cy,
  fallbackR,
}: {
  idKey: string;
  d?: string;
  cx?: number;
  cy?: number;
  fallbackR?: number;
}) {
  if (!d) {
    if (cx === undefined || cy === undefined) return null;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={fallbackR ?? 10}
        fill="none"
        stroke="#8fd8ff"
        strokeWidth="1.6"
        strokeOpacity="0.95"
      />
    );
  }
  const clipId = `hero-watchtrace-${idKey.replace(/[^A-Za-z0-9-]/g, "")}`;
  return (
    <g>
      <clipPath id={clipId}>
        <path d={d} />
      </clipPath>
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

/** The hundredfold gold ring (Oct 30, 2026) — BodyHeartbeat's
 *  HundredfoldRingMark: outside the silhouette by even-odd clip,
 *  or a circle beyond a centroid light's ivory ring. */
function HundredfoldRingMark({
  idKey,
  d,
  cx,
  cy,
  r,
}: {
  idKey: string;
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
}) {
  if (!d) {
    if (cx === undefined || cy === undefined || r === undefined) return null;
    return (
      <g>
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
  const clipId = `hero-hundredfold-${idKey.replace(/[^A-Za-z0-9-]/g, "")}`;
  return (
    <g>
      <clipPath id={clipId}>
        <path d={`M-200 -200 H1200 V1200 H-200 Z ${d}`} clipRule="evenodd" />
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

/** The still-knocking purple glow (Oct 30, 2026) —
 *  BodyHeartbeat's StillKnockingGlowMark: a soft bloom for
 *  countries, an unblurred within-borders fill for subdivisions. */
function StillKnockingGlowMark({
  d,
  cx,
  cy,
  r,
  withinBorders,
  filterId,
}: {
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  withinBorders?: boolean;
  filterId: string;
}) {
  if (!d) {
    if (cx === undefined || cy === undefined || r === undefined) return null;
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={STILL_KNOCKING_GLOW} fillOpacity="0.18" />
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
    return (
      <path d={d} fill={STILL_KNOCKING_GLOW} fillRule="evenodd" fillOpacity="0.85" />
    );
  }
  return (
    <g>
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

/** The still-knocking inner frame (Oct 30, 2026, the fourth
 *  drawing, phone-first) — BodyHeartbeat's StillKnockingTraceMark:
 *  a graded purple frame just inside a subdivision's border,
 *  above its lights, sharing no ground with the blue watch trace
 *  or the rings outside. */
function StillKnockingTraceMark({ idKey, d }: { idKey: string; d: string }) {
  const clipId = `hero-knocking-${idKey.replace(/[^A-Za-z0-9-]/g, "")}`;
  const maskId = `hero-knockingmask-${idKey.replace(/[^A-Za-z0-9-]/g, "")}`;
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

/** The unsaid deep tier (Oct 30, 2026) — the still-knocking
 *  construction in the deeper purple, for a divided country at a
 *  thousand summed visits. Deliberately voiceless, here as there:
 *  rendered, never written. */
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

export default function HeroMapSlide({ data }: { data: HeroMapPayload }) {
  const todayDate = data.today.date;

  // Today's rows, normalized the way BodyHeartbeat normalizes
  // them: a place stands on ANY activity — chapters, opens alone
  // (an ember), or watches alone (its blue trace) — sorted with
  // the fullest lights first.
  const countries: CountryDisplay[] = (data.countries ?? [])
    .map((c) => {
      const code = (c.code || "").toUpperCase();
      const geo = world.countries[code] ?? null;
      const extra = geo ? null : world.extraCentroids?.[code] ?? null;
      return {
        code,
        total: c.total ?? (c.read ?? 0) + (c.heard ?? 0),
        opens: c.opens ?? 0,
        watches: c.watches ?? 0,
        bookFinishedOn: c.bookFinishedOn ?? null,
        geo,
        centroid: geo
          ? { cx: geo.cx, cy: geo.cy }
          : extra
            ? { cx: extra.cx, cy: extra.cy }
            : null,
      };
    })
    .filter(
      (c) => c.code && (c.total > 0 || c.opens > 0 || c.watches > 0) && (c.geo || c.centroid)
    )
    .sort((a, b) => b.total - a.total || b.opens - a.opens || b.watches - a.watches);

  const subdivisions: SubdivisionDisplay[] = (data.subdivisions ?? [])
    .map((s) => {
      const code = (s.code || "").toUpperCase();
      return {
        code,
        total: s.total ?? (s.read ?? 0) + (s.heard ?? 0),
        opens: s.opens ?? 0,
        watches: s.watches ?? 0,
        bookFinishedOn: s.bookFinishedOn ?? null,
        country: (s.country || code.split("-")[0] || "").toUpperCase(),
        geo: world.subdivisions?.[code] ?? null,
      };
    })
    .filter((s) => s.code && (s.total > 0 || s.opens > 0 || s.watches > 0))
    .sort((a, b) => b.total - a.total || b.opens - a.opens || b.watches - a.watches);

  // All-time opens per place — the sum of a place's opens across
  // every day in the payload's history (today included), exactly
  // the real map's derivation; it grades the ember treatment and
  // nothing else. Without a history, a row's own opens stand.
  const lifetimeOpensByCountry = new Map<string, number>();
  const lifetimeOpensBySubdivision = new Map<string, number>();
  if (data.history) {
    for (const d of data.history) {
      for (const c of d.countries ?? []) {
        const code = (c.code || "").toUpperCase();
        if (code)
          lifetimeOpensByCountry.set(
            code,
            (lifetimeOpensByCountry.get(code) ?? 0) + (c.opens ?? 0)
          );
      }
      for (const s of d.subdivisions ?? []) {
        const code = (s.code || "").toUpperCase();
        if (code)
          lifetimeOpensBySubdivision.set(
            code,
            (lifetimeOpensBySubdivision.get(code) ?? 0) + (s.opens ?? 0)
          );
      }
    }
  }
  const allTimeOpensOf = (c: PlaceRow): number =>
    Math.max(c.opens, lifetimeOpensByCountry.get(c.code) ?? 0);
  const allTimeOpensOfSubdivision = (s: PlaceRow): number =>
    Math.max(s.opens, lifetimeOpensBySubdivision.get(s.code) ?? 0);

  // The decisions — every one an imported pure function, read off
  // today's rows, in BodyHeartbeat's own arrangement (v3.1.1:
  // finest geography wins the light; a place with no chapters
  // wears the ember treatment whatever its activity).
  const modeOf = (code: string) => lightModeForCountry(subdivisions, code);
  const tierOf = (c: PlaceRow): "full" | "ember" | "open" =>
    c.total === 0 ? "open" : modeOf(c.code);
  const subHaloOn = (s: SubdivisionDisplay) => bookHaloOn(s, todayDate);
  const countryHaloOn = (c: CountryDisplay) =>
    countryBookHaloOn(c, subdivisions, todayDate);
  const subHundredfoldOn = (s: SubdivisionDisplay) => hundredfold(s);
  const countryHundredfoldSignOn = (c: CountryDisplay) =>
    countryHundredfoldOn(c, subdivisions);
  const subStillKnockingOn = (s: SubdivisionDisplay) => stillKnocking(s);
  const countryStillKnockingSignOn = (c: CountryDisplay) =>
    countryStillKnockingOn(c, subdivisions);
  const countryStillKnockingDeepSignOn = (c: CountryDisplay) =>
    countryStillKnockingDeepOn(c, subdivisions);
  const countryWatchOn = (c: CountryDisplay): boolean =>
    c.watches > 0 &&
    !subdivisions.some((s) => s.country === c.code && s.watches > 0);

  return (
    <div
      className="absolute inset-0"
      style={{
        // The dawn sea — the section map's own sea family
        // (#175263 → #10394a → #0b2836), warmed and lifted a step
        // toward the hero stills' first light, with a soft gold
        // bloom behind the disc's heart. The hero's scrim still
        // settles over it, as it settles over every slide.
        background:
          "radial-gradient(58% 46% at 50% 44%, rgba(228,185,92,0.20) 0%, rgba(228,185,92,0) 70%)," +
          "radial-gradient(130% 105% at 50% 38%, #1d6076 0%, #14455a 46%, #0e3449 78%, #0b2836 100%)",
      }}
    >
      <svg
        viewBox={world.viewBox}
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <filter id="hero-map-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id="hero-map-soft-lg" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          {/* the disc's face — the sea gradient of the real map,
              warmed one step at its center, as above */}
          <radialGradient id="hero-map-sea" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1c5f74" />
            <stop offset="55%" stopColor="#123e52" />
            <stop offset="100%" stopColor="#0b2836" />
          </radialGradient>
        </defs>
        {/* the disc, held in a soft gold rim light */}
        <circle cx="500" cy="500" r="497" fill="url(#hero-map-sea)" />
        <circle
          cx="500"
          cy="500"
          r="490"
          fill="none"
          stroke="#e8d9ae"
          strokeWidth="1"
          opacity="0.22"
        />
        <g
          transform={`translate(500 500) scale(${MAP_SCALE}) translate(-500 -500)`}
        >
          {/* the land — warm parchment, its edges softened by a
              wide blurred pass beneath the true one, so the world
              reads painted rather than printed */}
          <path
            d={world.land}
            fill="#e8d9ae"
            fillRule="evenodd"
            opacity="0.10"
            filter="url(#hero-map-soft-lg)"
          />
          <path
            d={world.land}
            fill="#e8d9ae"
            fillRule="evenodd"
            opacity="0.24"
            stroke="#e8d9ae"
            strokeWidth="0.6"
            strokeOpacity="0.22"
          />
          {/* the unsaid deep tier — first among the marks, under
              every light, voiceless as it is on the real map */}
          {countries.map((c) =>
            countryStillKnockingDeepSignOn(c) ? (
              c.geo ? (
                <StillKnockingDeepGlowMark
                  key={`knocking-deep-${c.code}`}
                  d={c.geo.path}
                  filterId="hero-map-soft"
                />
              ) : c.centroid ? (
                <StillKnockingDeepGlowMark
                  key={`knocking-deep-${c.code}`}
                  cx={c.centroid.cx}
                  cy={c.centroid.cy}
                  r={lightRadius(c.total) * 2.1 + 6}
                  filterId="hero-map-soft"
                />
              ) : null
            ) : null
          )}
          {/* still knocking — country glows bloom under the lights */}
          {countries.map((c) =>
            countryStillKnockingSignOn(c) ? (
              c.geo ? (
                <StillKnockingGlowMark
                  key={`knocking-${c.code}`}
                  d={c.geo.path}
                  filterId="hero-map-soft"
                />
              ) : c.centroid ? (
                <StillKnockingGlowMark
                  key={`knocking-${c.code}`}
                  cx={c.centroid.cx}
                  cy={c.centroid.cy}
                  r={lightRadius(c.total) * 2.1 + 6}
                  filterId="hero-map-soft"
                />
              ) : null
            ) : null
          )}
          {/* a subdivision's glow, within its borders only */}
          {subdivisions.map((s) =>
            subStillKnockingOn(s) && s.geo ? (
              <StillKnockingGlowMark
                key={`knocking-${s.code}`}
                d={s.geo.path}
                withinBorders
                filterId="hero-map-soft"
              />
            ) : null
          )}
          {/* country silhouettes — ember and opens-only places at
              their graduated faintness (kindling's red when it is
              earned); full lights breathing in gold */}
          {countries.map((c, i) =>
            c.geo ? (
              tierOf(c) !== "full" ? (
                <path
                  key={`sil-${c.code}`}
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
              ) : (
                <g
                  key={`sil-${c.code}`}
                  className="hb-glow"
                  style={{ animationDelay: `${(i % 5) * 0.9}s` }}
                >
                  {/* the painterly halo — a second, wider pass of
                      the light's own glow, so the gold blooms the
                      way lamplight blooms in the stills */}
                  <path
                    d={c.geo.path}
                    fill="#e4b95c"
                    fillRule="evenodd"
                    opacity={silhouetteGlow(c.total) * 0.8}
                    filter="url(#hero-map-soft-lg)"
                  />
                  <path
                    d={c.geo.path}
                    fill="#e4b95c"
                    fillRule="evenodd"
                    opacity={silhouetteGlow(c.total)}
                    filter="url(#hero-map-soft)"
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
          {/* subdivision silhouettes — the finest geography at full
              treatment; opens-only subdivisions as embers */}
          {subdivisions.map((s, i) =>
            s.geo ? (
              s.total > 0 ? (
                <g
                  key={`sub-${s.code}`}
                  className="hb-glow"
                  style={{ animationDelay: `${((i + 2) % 5) * 0.9}s` }}
                >
                  <path
                    d={s.geo.path}
                    fill="#ffdf8a"
                    fillRule="evenodd"
                    opacity={subdivisionGlow(s.total) * 0.8}
                    filter="url(#hero-map-soft-lg)"
                  />
                  <path
                    d={s.geo.path}
                    fill="#ffdf8a"
                    fillRule="evenodd"
                    opacity={subdivisionGlow(s.total)}
                    filter="url(#hero-map-soft)"
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
              ) : (
                <path
                  key={`sub-${s.code}`}
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
              )
            ) : null
          )}
          {/* the still-knocking frames, above the lights */}
          {subdivisions.map((s) =>
            subStillKnockingOn(s) && s.geo ? (
              <StillKnockingTraceMark key={`knocking-trace-${s.code}`} idKey={s.code} d={s.geo.path} />
            ) : null
          )}
          {/* country hearts — the bright core of each full light;
              an ember or opens-only place with no silhouette rests
              as its faint disc, heartless, as on the real map */}
          {countries.map((c, i) => {
            if (!c.centroid) return null;
            if (tierOf(c) !== "full") {
              if (c.geo) return null;
              return (
                <circle
                  key={`heart-${c.code}`}
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
              );
            }
            const r = lightRadius(c.total);
            return (
              <g
                key={`heart-${c.code}`}
                className="hb-glow"
                style={{ animationDelay: `${(i % 5) * 0.9}s` }}
              >
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
          {/* the blue video-watch inner traces */}
          {subdivisions.map((s) =>
            s.watches > 0 && s.geo ? (
              <WatchTraceMark key={`watch-${s.code}`} idKey={s.code} d={s.geo.path} />
            ) : null
          )}
          {countries.map((c) =>
            countryWatchOn(c) ? (
              c.geo ? (
                <WatchTraceMark key={`watch-${c.code}`} idKey={c.code} d={c.geo.path} />
              ) : c.centroid ? (
                <WatchTraceMark
                  key={`watch-${c.code}`}
                  idKey={c.code}
                  cx={c.centroid.cx}
                  cy={c.centroid.cy}
                  fallbackR={lightRadius(c.total) * 2.1 + 2}
                />
              ) : null
            ) : null
          )}
          {/* the hundredfold gold rings — just before the ivory,
              so the two nest as they do on the real map */}
          {countries.map((c) =>
            countryHundredfoldSignOn(c) ? (
              c.geo ? (
                <HundredfoldRingMark key={`hundredfold-${c.code}`} idKey={c.code} d={c.geo.path} />
              ) : c.centroid ? (
                <HundredfoldRingMark
                  key={`hundredfold-${c.code}`}
                  idKey={c.code}
                  cx={c.centroid.cx}
                  cy={c.centroid.cy}
                  r={lightRadius(c.total) * 2.1 + 10}
                />
              ) : null
            ) : null
          )}
          {subdivisions.map((s) =>
            subHundredfoldOn(s) && s.geo ? (
              <HundredfoldRingMark key={`hundredfold-${s.code}`} idKey={s.code} d={s.geo.path} />
            ) : null
          )}
          {/* the ivory book-finished rings — last, over all */}
          {countries.map((c) =>
            countryHaloOn(c) ? (
              c.geo ? (
                <g key={`halo-${c.code}`}>
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
                <circle
                  key={`halo-${c.code}`}
                  cx={c.centroid.cx}
                  cy={c.centroid.cy}
                  r={lightRadius(c.total) * 2.1 + 5}
                  fill="none"
                  stroke="#fffff0"
                  strokeWidth="1.5"
                  strokeOpacity="0.9"
                />
              ) : null
            ) : null
          )}
          {subdivisions.map((s) =>
            subHaloOn(s) && s.geo ? (
              <g key={`halo-${s.code}`}>
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
      </svg>
    </div>
  );
}
