"use client";

import { useCallback, useEffect, useState } from "react";
import heartbeat from "@/data/heartbeat.json";
import worldMap from "@/lib/world-map.json";

/**
 * "The Body, Reading" — the Bible Heartbeat visualization (v3).
 *
 * The picture: the world as a flat disc (azimuthal equidistant,
 * centered on the North Pole; Natural Earth geometry, public domain,
 * vendored in lib/world-map.json — no tile services, no trackers) with
 * the Vine rooted at its heart and branches spreading across it.
 *
 * The vine's fruit lights are today's chapters, read + heard. A country
 * that carries counts lights up in its own silhouette — its actual
 * shape filled with warm golden light, breathing gently — with a small
 * bright heart at its center; a counted country with no polygon in the
 * vendored geography falls back to a light at its centroid. Every lit
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
 * and another property's audience is never plotted here. See
 * HEARTBEAT.md for the full story.
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

interface LiveData {
  live: boolean;
  asOf: string | null;
  since: string;
  totals: HbTotals;
  today: { date: string; chaptersRead: number; chaptersHeard: number };
  countries: { code: string; read: number; heard: number; total: number }[];
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

/**
 * Fruit-light positions along the vine's branches on the disc
 * (viewBox 1000×1000), near the heart first, then out along the arms —
 * the lit ones fill the vine the way grapes cluster as the count grows.
 */
const LIGHTS: { x: number; y: number }[] = [
  { x: 500, y: 468 }, { x: 476, y: 512 }, { x: 524, y: 516 },
  { x: 484, y: 460 }, { x: 518, y: 466 }, { x: 466, y: 486 },
  { x: 536, y: 492 }, { x: 492, y: 538 }, { x: 514, y: 542 },
  { x: 456, y: 522 }, { x: 440, y: 494 }, { x: 392, y: 488 },
  { x: 348, y: 482 }, { x: 310, y: 476 }, { x: 452, y: 452 },
  { x: 404, y: 398 }, { x: 356, y: 348 }, { x: 466, y: 566 },
  { x: 436, y: 640 }, { x: 408, y: 706 }, { x: 506, y: 580 },
  { x: 508, y: 660 }, { x: 512, y: 724 }, { x: 560, y: 560 },
  { x: 622, y: 636 }, { x: 682, y: 712 }, { x: 580, y: 494 },
  { x: 660, y: 486 }, { x: 724, y: 474 }, { x: 560, y: 446 },
  { x: 624, y: 386 }, { x: 684, y: 330 }, { x: 518, y: 420 },
  { x: 532, y: 368 }, { x: 462, y: 592 }, { x: 556, y: 600 },
  { x: 428, y: 430 }, { x: 600, y: 300 }, { x: 268, y: 470 },
  { x: 760, y: 540 },
];

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

export default function BodyHeartbeat() {
  const [live, setLive] = useState<LiveData | null>(null);

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
  }, [load]);

  const liveActive = Boolean(live?.live);
  const totals = liveActive && live ? live.totals : hb.totals;
  const today = liveActive && live ? live.today : hb.today;
  const { library, recent } = hb;
  const todayCount = today.chaptersRead + today.chaptersHeard;
  const lit = Math.min(todayCount, LIGHTS.length);
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

  const figureLabel =
    mapRows.length > 0
      ? `A grapevine rooted at the heart of a soft world map drawn as a disc. ${lit} fruit lights are lit — one for each chapter read or heard today, ${longDate(today.date)}. ${mapRows.length} ${mapRows.length === 1 ? "country is" : "countries are"} lit in its own shape, where the Word was opened${mapSource === "live" ? " today" : ""}: ${mapRows.map(mapPhrase).join("; ")}.`
      : lit > 0
        ? `A grapevine rooted at the heart of a soft world map drawn as a disc, with ${lit} golden fruit lights lit — one for each chapter read or heard today, ${longDate(today.date)}. No country shapes are lit yet.`
        : "A grapevine rooted at the heart of a soft world map drawn as a disc, at rest in the early morning — the counting of chapters has only just begun, and no country shapes are lit yet.";

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

        {/* The world + the Vine — the disc is the ground; the vine's
            fruit lights are today's chapters; a counted country lights
            up in its own silhouette, named in the text below. */}
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
            {/* lit countries — the nation itself, in its own shape:
                a soft outer glow, then the golden fill, breathing */}
            {mapRows.map((c, i) =>
              c.geo ? (
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
              ) : null
            )}
            {/* the vine — rooted at the disc's heart, branches
                spreading across the world */}
            <g fill="none" stroke="#7a5a33" strokeLinecap="round">
              <path
                d="M500 500 C 496 524 505 542 500 562"
                strokeWidth="10"
              />
              <g strokeWidth="6">
                <path d="M500 500 C 440 492 380 486 318 478" />
                <path d="M500 500 C 452 448 396 392 340 336" />
                <path d="M500 500 C 462 572 424 648 398 726" />
                <path d="M500 500 C 508 586 506 668 512 752" />
                <path d="M500 500 C 566 566 636 644 700 730" />
                <path d="M500 500 C 584 492 664 482 748 468" />
                <path d="M500 500 C 566 442 636 382 700 318" />
              </g>
              <g strokeWidth="3.5">
                <path d="M500 500 C 512 452 528 402 540 356" />
                <path d="M430 492 C 396 462 366 440 330 424" />
                <path d="M584 492 C 620 462 652 442 690 428" />
                <path d="M500 500 C 470 540 452 590 448 646" />
                <path d="M500 500 C 540 545 566 596 580 652" />
              </g>
            </g>
            <circle cx="500" cy="500" r="10" fill="#7a5a33" />
            {/* leaves */}
            <g fill="#7fa088" opacity="0.5">
              <ellipse cx="392" cy="462" rx="14" ry="6.5" transform="rotate(-24 392 462)" />
              <ellipse cx="404" cy="392" rx="13" ry="6" transform="rotate(-48 404 392)" />
              <ellipse cx="440" cy="618" rx="13" ry="6" transform="rotate(52 440 618)" />
              <ellipse cx="528" cy="640" rx="13" ry="6" transform="rotate(6 528 640)" />
              <ellipse cx="622" cy="622" rx="13" ry="6" transform="rotate(48 622 622)" />
              <ellipse cx="640" cy="462" rx="14" ry="6.5" transform="rotate(-20 640 462)" />
              <ellipse cx="618" cy="392" rx="12" ry="6" transform="rotate(-42 618 392)" />
              <ellipse cx="556" cy="392" rx="11" ry="5.5" transform="rotate(-64 556 392)" />
              <ellipse cx="368" cy="540" rx="11" ry="5.5" transform="rotate(30 368 540)" />
              <ellipse cx="676" cy="556" rx="11" ry="5.5" transform="rotate(-30 676 556)" />
            </g>
            {/* fruit lights — today's chapters */}
            {LIGHTS.map((p, i) =>
              i < lit ? (
                <g key={i} className="hb-glow" style={{ animationDelay: `${(i % 7) * 0.6}s` }}>
                  <circle cx={p.x} cy={p.y} r="10" fill="#e4b95c" opacity="0.22" />
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#f0cd7e" />
                </g>
              ) : (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill="#b9cdc0"
                  opacity="0.28"
                />
              )
            )}
            {/* country hearts — a small bright core at each lit
                country's center; for a counted country with no
                polygon, the heart carries a fuller halo and ring
                (the centroid-light fallback) */}
            {mapRows.map((c, i) => {
              if (!c.centroid) return null;
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
            {lit > 0 ? (
              <>
                {fmt(todayCount)}{" "}
                {todayCount === 1 ? "chapter" : "chapters"} read or heard
                today, {longDate(today.date)} — each light, a neighbor.
              </>
            ) : (
              "The vine at rest over the world — its lights kindle as neighbors read."
            )}
          </figcaption>
          <p className="mt-2 text-center text-sm text-cream-100/85">
            {mapRows.length > 0
              ? "Each light is a country where the Word was opened."
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
              ? "The counting has only just begun — as the first neighbors open chapters, the vine will kindle here within about a minute."
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
              {liveRows.map((c) => (
                <li
                  key={c.code}
                  className="rounded-full border border-gold-500/25 bg-vineyard-950/60 px-3.5 py-1.5 text-sm text-cream-100"
                >
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
              {snapRows.map((c) => (
                <li
                  key={c.code || c.name}
                  className="rounded-full border border-gold-500/25 bg-vineyard-950/60 px-3.5 py-1.5 text-sm text-cream-100"
                >
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

        {liveActive ? (
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
