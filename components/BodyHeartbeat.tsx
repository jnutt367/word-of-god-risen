import heartbeat from "@/data/heartbeat.json";
import worldMap from "@/lib/world-map.json";

/**
 * "The Body, Reading" — the Bible Heartbeat visualization (v2).
 *
 * Renders the aggregate snapshot in data/heartbeat.json (kept current by
 * scripts/heartbeat-rollup.mjs from the site's own Vercel Analytics
 * events). Everything shown is a total: chapters opened, chapters heard,
 * books finished. No names, no leaderboards, no invented activity.
 *
 * The picture: a soft, translucent world map (Natural Earth, public
 * domain, vendored in lib/world-map.json — no tile services, no
 * trackers) with the Vine growing over it. The vine's fruit lights are
 * the latest counted day's chapters. When the snapshot carries honestly
 * sourced country rows, each lit country also gets a golden light at
 * its place on the map — and the labeled list below the map names every
 * one of them in plain text, so the map is never the only carrier of
 * meaning. Country rows come only from this app's own Vercel Web
 * Analytics geography (see HEARTBEAT.md); another property's audience
 * (e.g. the YouTube channel's) is never plotted here.
 */

interface HbTotals {
  chaptersRead: number;
  chaptersHeard: number;
  listensCompleted: number;
  booksFinished: number;
}

interface HbCountry {
  /** ISO 3166-1 alpha-2 — required for a map light; the list needs only a name. */
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
  countries: HbCountry[];
  countriesSource?: string;
  /** Window the country rows cover, e.g. "this week" / "all time". */
  countriesWindow?: string;
  recent: HbRecent[];
}

interface WorldCountry {
  name: string;
  path: string;
  cx: number;
  cy: number;
}

const hb = heartbeat as HeartbeatData;
const world = worldMap as {
  viewBox: string;
  land: string;
  countries: Record<string, WorldCountry>;
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

/**
 * Fruit-light positions along the vine's branches (viewBox 1000×500),
 * laid out by hand across the world map so the lit ones fill the vine
 * the way grapes cluster — near the trunk first, out along the arms as
 * the count grows.
 */
const LIGHTS: { x: number; y: number }[] = [
  { x: 500, y: 332 }, { x: 480, y: 318 }, { x: 520, y: 314 },
  { x: 462, y: 300 }, { x: 540, y: 296 }, { x: 450, y: 340 },
  { x: 560, y: 338 }, { x: 498, y: 262 }, { x: 503, y: 222 },
  { x: 506, y: 190 }, { x: 455, y: 268 }, { x: 552, y: 300 },
  { x: 572, y: 272 }, { x: 585, y: 235 }, { x: 420, y: 352 },
  { x: 372, y: 330 }, { x: 315, y: 300 }, { x: 262, y: 262 },
  { x: 205, y: 215 }, { x: 150, y: 175 }, { x: 178, y: 250 },
  { x: 240, y: 330 }, { x: 352, y: 398 }, { x: 300, y: 382 },
  { x: 262, y: 352 }, { x: 585, y: 352 }, { x: 640, y: 332 },
  { x: 700, y: 305 }, { x: 762, y: 262 }, { x: 828, y: 212 },
  { x: 872, y: 168 }, { x: 610, y: 300 }, { x: 668, y: 272 },
  { x: 700, y: 240 }, { x: 795, y: 300 }, { x: 640, y: 398 },
  { x: 716, y: 398 }, { x: 790, y: 378 }, { x: 852, y: 348 },
  { x: 892, y: 330 },
];

/** Gentle log-ish radius for a country light, capped — a big country of
 *  readers glows wider, never louder than the vine itself. */
function lightRadius(total: number): number {
  return Math.min(13, 4.5 + 2.6 * Math.log10(1 + total));
}

interface LitCountry {
  code: string;
  name: string;
  read: number;
  heard: number;
  total: number;
  geo: WorldCountry;
}

export default function BodyHeartbeat() {
  const { totals, library, today, countries, recent } = hb;
  const todayCount = today.chaptersRead + today.chaptersHeard;
  const lit = Math.min(todayCount, LIGHTS.length);
  const allQuiet = totals.chaptersRead + totals.chaptersHeard === 0;
  const windowLabel = (hb.countriesWindow || "").trim();

  // Normalize snapshot country rows; keep only honestly counted rows.
  const rows = countries
    .map((c) => {
      const read = c.read ?? c.chaptersRead ?? 0;
      const heard = c.heard ?? 0;
      return { code: (c.code || "").toUpperCase(), name: c.name, read, heard, total: read + heard };
    })
    .filter((c) => c.name && c.total > 0)
    .sort((a, b) => b.total - a.total);

  // A country lights the map only when its code resolves to vendored
  // geography; the labeled list below carries every row regardless.
  const litCountries: LitCountry[] = rows.flatMap((c) => {
    const geo = world.countries[c.code];
    return geo ? [{ ...c, geo }] : [];
  });

  const countryPhrase = (c: { name: string; total: number }) =>
    `${c.name} — ${fmt(c.total)} ${c.total === 1 ? "chapter" : "chapters"}${
      windowLabel ? ` ${windowLabel}` : ""
    }`;

  const figureLabel =
    litCountries.length > 0
      ? `A grapevine growing over a soft world map. ${lit} fruit lights are lit — one for each chapter read or heard on ${longDate(today.date)}. Golden lights also mark ${litCountries.length} ${litCountries.length === 1 ? "country" : "countries"} where the Word was opened: ${litCountries.map(countryPhrase).join("; ")}.`
      : lit > 0
        ? `A grapevine growing over a soft world map, with ${lit} golden fruit lights lit — one for each chapter read or heard on ${longDate(today.date)}. No country lights yet.`
        : "A grapevine growing over a soft world map, at rest in the early morning — the counting of chapters has only just begun, and no country lights are lit yet.";

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

        {/* The world + the Vine — the map is the ground; the vine's fruit
            lights are the latest counted day's chapters; golden country
            lights mark where the Word was opened (labeled in text below). */}
        <figure role="img" aria-label={figureLabel} className="mx-auto mt-6 max-w-4xl">
          <svg
            viewBox={world.viewBox}
            aria-hidden="true"
            focusable="false"
            className="w-full"
          >
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
            {/* lit countries rest a little warmer under their lights */}
            {litCountries.map((c) => (
              <path
                key={`land-${c.code}`}
                d={c.geo.path}
                fill="#e4b95c"
                fillRule="evenodd"
                opacity="0.20"
              />
            ))}
            {/* ground line */}
            <path
              d="M60 478 Q 500 462 940 478"
              fill="none"
              stroke="#1d4a2a"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* trunk — rooted low-center, growing over the world */}
            <path
              d="M500 478 C 496 440 504 420 500 386 C 497 360 500 345 501 330"
              fill="none"
              stroke="#7a5a33"
              strokeWidth="11"
              strokeLinecap="round"
            />
            {/* main branches reaching across the map */}
            <g fill="none" stroke="#7a5a33" strokeWidth="6" strokeLinecap="round">
              <path d="M500 408 C 428 384 338 350 262 300 C 206 264 158 220 128 168" />
              <path d="M500 396 C 566 372 648 346 724 302 C 794 262 850 214 880 162" />
              <path d="M499 380 C 492 322 494 258 504 196" />
              <path d="M500 392 C 528 348 552 306 574 258" />
            </g>
            <g fill="none" stroke="#7a5a33" strokeWidth="3.5" strokeLinecap="round">
              <path d="M500 420 C 428 430 360 420 302 384 C 276 368 258 352 244 334" />
              <path d="M500 414 C 592 428 684 420 762 388 C 818 366 856 348 886 324" />
              <path d="M386 330 C 340 306 300 282 268 250" />
              <path d="M640 330 C 690 306 736 282 776 248" />
            </g>
            {/* leaves */}
            <g fill="#7fa088" opacity="0.5">
              <ellipse cx="250" cy="240" rx="15" ry="7" transform="rotate(-30 250 240)" />
              <ellipse cx="760" cy="240" rx="15" ry="7" transform="rotate(30 760 240)" />
              <ellipse cx="505" cy="168" rx="13" ry="6" transform="rotate(-8 505 168)" />
              <ellipse cx="566" cy="292" rx="12" ry="6" transform="rotate(24 566 292)" />
              <ellipse cx="180" cy="192" rx="12" ry="6" transform="rotate(-38 180 192)" />
              <ellipse cx="845" cy="192" rx="12" ry="6" transform="rotate(38 845 192)" />
              <ellipse cx="330" cy="362" rx="12" ry="6" transform="rotate(-14 330 362)" />
              <ellipse cx="690" cy="362" rx="12" ry="6" transform="rotate(14 690 362)" />
            </g>
            {/* fruit lights — the latest counted day's chapters */}
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
            {/* country lights — a distinct, warmer layer (each one is
                named in the labeled list below; <title> gives the same
                name + count on hover/tap) */}
            {litCountries.map((c, i) => {
              const r = lightRadius(c.total);
              return (
                <g
                  key={`light-${c.code}`}
                  className="hb-glow"
                  style={{ animationDelay: `${(i % 5) * 0.9}s` }}
                >
                  <title>{countryPhrase(c)}</title>
                  <circle cx={c.geo.cx} cy={c.geo.cy} r={r * 2.1} fill="#e4b95c" opacity="0.16" />
                  <circle
                    cx={c.geo.cx}
                    cy={c.geo.cy}
                    r={r}
                    fill="#e4b95c"
                    fillOpacity="0.30"
                    stroke="#ffe1a1"
                    strokeWidth="1"
                    strokeOpacity="0.85"
                  />
                  <circle cx={c.geo.cx} cy={c.geo.cy} r={Math.max(2.2, r * 0.5)} fill="#f6d47c" />
                </g>
              );
            })}
          </svg>
          <figcaption className="mt-2 text-center text-sm text-sage-300">
            {lit > 0 ? (
              <>
                {fmt(todayCount)}{" "}
                {todayCount === 1 ? "chapter" : "chapters"} read or heard on{" "}
                {longDate(today.date)} — each light, a neighbor.
              </>
            ) : (
              "The vine at rest over the world — its lights kindle as neighbors read."
            )}
          </figcaption>
          <p className="mt-2 text-center text-sm text-cream-100/85">
            {litCountries.length > 0
              ? "Each light is a country where the Word was opened."
              : "Country lights join as our daily count gathers them — each light will mark a country where the Word was opened."}
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
            The counting has only just begun — the first chapters opened here
            will appear tomorrow morning, the way a farmer walks the rows and
            finds what grew in the night.
          </p>
        )}

        {/* Country garland — the labeled list that names every lit
            country in plain text, so the map never carries the meaning
            alone. Renders only when the snapshot carries honestly
            sourced geography (see HEARTBEAT.md). */}
        {rows.length > 0 && (
          <div className="mx-auto mt-10 max-w-3xl">
            <h3 className="text-center font-display text-xl text-cream-50">
              Neighbors near and far
            </h3>
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {rows.map((c) => (
                <li
                  key={c.code || c.name}
                  className="rounded-full border border-gold-500/25 bg-vineyard-950/60 px-3.5 py-1.5 text-sm text-cream-100"
                >
                  {c.name}{" "}
                  <span className="text-gold-300">
                    {fmt(c.total)} {c.total === 1 ? "chapter" : "chapters"}
                    {windowLabel ? ` ${windowLabel}` : ""}
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

        <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-sage-400">
          Counted with diligence since {longDate(hb.since)} · gathered gently
          and refreshed daily, through {longDate(hb.updatedThrough)}. Opening
          a chapter, listening, or finishing a book adds one anonymous beat —
          totals only, never names, never a leaderboard. Across this library
          live {library.books} books and {fmt(library.audioChapters)} chapters
          read aloud — every one of them free.
        </p>
      </div>
    </section>
  );
}
