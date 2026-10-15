import heartbeat from "@/data/heartbeat.json";

/**
 * "The Body, Reading" — the Bible Heartbeat visualization.
 *
 * Renders the aggregate snapshot in data/heartbeat.json (kept current by
 * scripts/heartbeat-rollup.mjs from the site's own Vercel Analytics
 * events). Everything shown is a total: chapters opened, chapters heard,
 * books finished. No names, no leaderboards, no invented activity — the
 * vine lights only for chapters actually counted, and when the count is
 * quiet, the page says so.
 */

interface HbTotals {
  chaptersRead: number;
  chaptersHeard: number;
  listensCompleted: number;
  booksFinished: number;
}

interface HbCountry {
  name: string;
  chaptersRead: number;
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
  recent: HbRecent[];
}

const hb = heartbeat as HeartbeatData;

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
 * Fruit-light positions along the vine's branches (viewBox 600×280),
 * laid out by hand so the lit ones fill the vine the way grapes cluster —
 * near the trunk first, out to the branch tips as the count grows.
 */
const LIGHTS: { x: number; y: number }[] = [
  { x: 300, y: 168 }, { x: 282, y: 156 }, { x: 318, y: 154 },
  { x: 264, y: 142 }, { x: 336, y: 140 }, { x: 246, y: 128 },
  { x: 354, y: 126 }, { x: 228, y: 116 }, { x: 372, y: 112 },
  { x: 210, y: 104 }, { x: 390, y: 100 }, { x: 192, y: 94 },
  { x: 408, y: 88 }, { x: 300, y: 128 }, { x: 276, y: 116 },
  { x: 324, y: 114 }, { x: 258, y: 100 }, { x: 342, y: 98 },
  { x: 174, y: 84 }, { x: 426, y: 78 }, { x: 156, y: 76 },
  { x: 444, y: 68 }, { x: 140, y: 66 }, { x: 460, y: 58 },
  { x: 216, y: 84 }, { x: 384, y: 82 }, { x: 240, y: 70 },
  { x: 360, y: 68 }, { x: 124, y: 54 }, { x: 476, y: 48 },
  { x: 108, y: 44 }, { x: 492, y: 40 }, { x: 266, y: 56 },
  { x: 334, y: 54 }, { x: 292, y: 44 }, { x: 312, y: 40 },
  { x: 88, y: 36 }, { x: 512, y: 32 }, { x: 70, y: 28 },
  { x: 530, y: 26 },
];

export default function BodyHeartbeat() {
  const { totals, library, today, countries, recent } = hb;
  const todayCount = today.chaptersRead + today.chaptersHeard;
  const lit = Math.min(todayCount, LIGHTS.length);
  const allQuiet = totals.chaptersRead + totals.chaptersHeard === 0;

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

        {/* The Vine — lights are chapters read or heard on the latest
            counted day. Unlit sockets are the vine at rest, not activity. */}
        <figure
          role="img"
          aria-label={
            lit > 0
              ? `A grapevine with ${lit} golden lights lit — one for each chapter read or heard on ${longDate(today.date)}.`
              : "A grapevine at rest in the early morning, its fruit not yet lit — the counting of chapters has only just begun."
          }
          className="mx-auto mt-6 max-w-2xl"
        >
          <svg
            viewBox="0 0 600 280"
            aria-hidden="true"
            focusable="false"
            className="w-full"
          >
            {/* ground */}
            <path
              d="M40 258 Q 300 244 560 258"
              fill="none"
              stroke="#1d4a2a"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* trunk */}
            <path
              d="M300 258 C 296 226 304 206 300 182 C 297 164 300 150 302 138"
              fill="none"
              stroke="#7a5a33"
              strokeWidth="11"
              strokeLinecap="round"
            />
            {/* main branches */}
            <g
              fill="none"
              stroke="#7a5a33"
              strokeWidth="6"
              strokeLinecap="round"
            >
              <path d="M301 190 C 258 176 214 158 168 128 C 138 108 112 84 92 52" />
              <path d="M301 190 C 344 176 388 158 434 128 C 464 108 490 84 510 52" />
              <path d="M301 168 C 272 150 244 132 224 104 C 208 82 196 62 188 40" />
              <path d="M301 168 C 330 150 358 132 378 104 C 394 82 406 62 414 40" />
            </g>
            <g
              fill="none"
              stroke="#7a5a33"
              strokeWidth="3.5"
              strokeLinecap="round"
            >
              <path d="M232 140 C 210 128 190 112 176 92" />
              <path d="M370 140 C 392 128 412 112 426 92" />
              <path d="M262 118 C 246 106 234 92 226 74" />
              <path d="M340 118 C 356 106 368 92 376 74" />
            </g>
            {/* leaves */}
            <g fill="#7fa088" opacity="0.55">
              <ellipse cx="150" cy="110" rx="13" ry="6" transform="rotate(-32 150 110)" />
              <ellipse cx="452" cy="110" rx="13" ry="6" transform="rotate(32 452 110)" />
              <ellipse cx="205" cy="66" rx="11" ry="5" transform="rotate(-18 205 66)" />
              <ellipse cx="397" cy="66" rx="11" ry="5" transform="rotate(18 397 66)" />
              <ellipse cx="118" cy="70" rx="10" ry="5" transform="rotate(-40 118 70)" />
              <ellipse cx="484" cy="70" rx="10" ry="5" transform="rotate(40 484 70)" />
            </g>
            {/* fruit lights */}
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
          </svg>
          <figcaption className="mt-2 text-center text-sm text-sage-300">
            {lit > 0 ? (
              <>
                {fmt(todayCount)}{" "}
                {todayCount === 1 ? "chapter" : "chapters"} read or heard on{" "}
                {longDate(today.date)} — each light, a neighbor.
              </>
            ) : (
              "The vine at rest — its lights kindle as neighbors read."
            )}
          </figcaption>
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

        {/* Country garland — only when the snapshot carries honestly
            sourced geography (see HEARTBEAT.md). */}
        {countries.length > 0 && (
          <div className="mx-auto mt-10 max-w-3xl">
            <h3 className="text-center font-display text-xl text-cream-50">
              Neighbors near and far
            </h3>
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {countries.map((c) => (
                <li
                  key={c.name}
                  className="rounded-full border border-gold-500/25 bg-vineyard-950/60 px-3.5 py-1.5 text-sm text-cream-100"
                >
                  {c.name}{" "}
                  <span className="text-gold-300">{fmt(c.chaptersRead)}</span>
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
