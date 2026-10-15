# The Bible Heartbeat — build note

*Added Oct 15, 2026, at Jason's word: "go ahead with that tracking
internally… let the readers see the heartbeat of the body, amen."*

## What it is

Aggregate, anonymous counting of the Body's reading on this app, shown on
the homepage as **"The Body, Reading — One Vine, many neighbors."**
Totals only: no reader identity, no per-person data, no cookies set by
the heartbeat, no leaderboards. Jason's line is the register: *"We keep
count out here — but not just numbers… neighbors."*

## What counts (internal — Vercel Analytics custom events)

Fired from `lib/heartbeat.ts`, durable in the site's own Vercel
Analytics (dashboard → Analytics → Events), and countable by the
heartbeat operator through the Vercel connector:

| Event | When | Dedup |
|---|---|---|
| `chapter_read` | A chapter opens in the reader, or is marked read | once per browser session per chapter |
| `chapter_listen_start` | Chapter playback begins (Teddy MP3 or device TTS), from idle | once per browser session per chapter |
| `chapter_listen_complete` | Playback reaches the chapter's end | — |
| `book_complete` | Marked-read chapters complete a whole book | once per device per book |

Instrumentation points: `components/ReaderView.tsx` (open, mark-read,
book completion), `components/ListenButton.tsx` (start/complete for both
the MP3 and TTS paths). Reading-plan check-offs that never open a
chapter page are not counted — the totals are a floor, not a census.

## Where the display numbers live

`data/heartbeat.json` (checked in), rendered by
`components/BodyHeartbeat.tsx`. It is refreshed **daily** by
`scripts/heartbeat-rollup.mjs`, run alongside the Field Report
heartbeat: the operator queries all-time event totals from Vercel
Analytics, feeds them to the script, and commits + pushes — the deploy
is the refresh. Copy on the page says exactly this ("gathered gently and
refreshed daily"), and the vine's breathing lights represent the latest
counted day's chapters — the visual pulses at the data's true cadence,
never a fake real-time.

*(v3: the vine now reads the live Blob counters first — see the v3
section — and this snapshot is both its fallback and the permanent
record it reconciles against.)*

## Displayed vs internal-only

- **Displayed:** chapters read · chapters heard · books finished ·
  chapters in the library (78 books; 1,503 audio chapters) · the latest
  counted day's read+heard total (the vine's lights).
- **Internal-only:** listen completions (collected; not displayed).
- **Country layer (v2):** the world map under the vine is always drawn;
  country lights and the labeled "Neighbors near and far" list render
  **only** when the snapshot carries `countries` rows with an honest
  source label and window. The app cannot see its own analytics
  geography at runtime, so the lights stay dark until a roll-up
  supplies verified geography — they are never guessed, and no other
  property's audience is ever plotted (see the v2 section below).
  *(v3: live country rows — today's, counted from the app's own
  reading — now light the map as silhouettes too; see the v3 section.
  The snapshot garland's rule is unchanged.)*
- **Recent-chapters river:** same rule — rendered only when the roll-up
  supplies aggregate recent rows (book + chapter + kind + day, no
  identity). Currently dark for the same reason: event detail rows live
  in the Analytics dashboard, not in an export the roll-up can read yet.

## v2 — the world under the vine (Oct 15, 2026)

Jason's critique of v1: the vine's dots didn't *say* "countries
reading" on their own — "maybe like a transparent map of the world."
He was right; v2 builds exactly that.

- **Ground layer.** A soft, translucent world map sits beneath the
  vine in the same figure: equirectangular landmasses in faint warm
  parchment at low opacity, TruVINE palette. The vine's trunk is rooted
  low-center and its branches reach across the map. The geometry is
  **Natural Earth 110m (public domain)**, vendored into the repo as
  `lib/world-map.json` by `scripts/build-world-map.mjs` — no external
  tile services, no map libraries, no trackers, nothing fetched at
  runtime. (Antarctica omitted; N. Cyprus, Somaliland, and Kosovo have
  no ISO code in the source data, so they are drawn in the land but can
  never carry a light.)
- **Country lights.** When the snapshot's `countries[]` carries a row
  whose `code` (ISO 3166-1 alpha-2) resolves in the vendored geography,
  that country gets a golden light at its approximate centroid —
  radius scaled gently (log) by its read+heard total, capped, breathing
  with the same `.hb-glow` motion as the fruit lights and fully still
  under `prefers-reduced-motion`. The country's land also rests a
  little warmer beneath its light. The vine's fruit lights remain a
  separate layer with their original meaning: the latest counted day's
  chapters.
- **Meaning made plain.** The figure's copy says it outright: "Each
  light is a country where the Word was opened." The labeled list
  ("Neighbors near and far") names **every** country row with its count
  and window — "Philippines — 32 chapters this week" — plus its
  read/heard split when both exist, so the map is never the only
  carrier of meaning. Hovering or tapping a light shows the same
  name + count via the light's `<title>`. The whole figure is a
  labelled `role="img"` whose summary names the lit countries; the
  counters and the list are real text.
- **Data path.** `data/heartbeat.json` countries rows are now
  `{ code, name, read, heard }`, with snapshot-level `countriesWindow`
  (the window the counts cover — printed on the page beside every
  count) and `countriesSource`. `scripts/heartbeat-rollup.mjs`
  normalizes and validates rows fed to it (legacy v1 `chaptersRead`
  rows are still accepted). The operator supplies rows from **this
  app's own Vercel Web Analytics geography** — country-level aggregates
  only, no cities, no IPs, no per-visitor rows, per the no-tracking
  posture. Sources never mix: the YouTube channel's audience geography
  is a different property's data and is **never** plotted here.
- **Honest empty state.** Until real country rows exist, the map
  renders as a quiet world under the resting vine, with the expectancy
  line: "Country lights join as our daily count gathers them — each
  light will mark a country where the Word was opened."

## Why not real-time counters in a database (v1–v2 — superseded by v3)

A durable runtime-writable store (Vercel Blob/KV) could not be
provisioned from the agent's Vercel connection: storage creation and
env management return 403 under the connector's scope (verified
Oct 15, 2026). The sanctioned fallback was used instead: Analytics
events (durable, in-stack, zero new services) + the checked-in snapshot
pattern this repo already uses for the Shorts feed.

**Upgrade path, when wanted:** Jason connects a Blob store to this
project in the Vercel dashboard (Storage → Create → Blob; it sets
`BLOB_READ_WRITE_TOKEN` automatically), and an `/api/heartbeat` route
can then increment counters per event and retire the daily roll-up.
The component and snapshot schema were shaped so that swap changes
only where the numbers come from, not what they mean.

*Update (Oct 15, 2026): Jason created the store the same afternoon and
asked for the counting minute-to-minute — v3 below is that upgrade,
live. The daily roll-up was NOT retired; it remains the permanent
record and reconciles the live counters by the merge rule.*

## v3 — real-time counting, the flat disc, country silhouettes (Oct 15, 2026)

Jason's words across one afternoon: "it would be cool to have minute
to minute" — then, of the v2 dots, "how do we get that dot
representation to be understood that that's different countries
reading the Bible? Maybe like a transparent map of the world"; the
map became a flat disc at his direction (built "without saying
anything" — the section's copy is unchanged in spirit: it speaks only
about the counting, never about the map's shape); and finally, "not
just a little dot but their actual silhouette."

### The store and the endpoints

Jason created the Blob store **word-of-god-risen-blob** (Private,
iad1) in the Vercel dashboard and connected it to this project;
`BLOB_STORE_ID` and `BLOB_READ_WRITE_TOKEN` (sensitive) were verified
present for production + preview by NAME only — values were never read
or printed. One JSON document, `heartbeat/counters.json`, holds the
live counters, owned by `lib/heartbeat-store.ts`:

```json
{
  "since": "2026-10-15",
  "totals": { "chaptersRead": 0, "chaptersHeard": 0,
              "listensCompleted": 0, "booksFinished": 0 },
  "days": [ { "date": "2026-10-15",            // UTC day bucket
              "chaptersRead": 0, "chaptersHeard": 0,
              "countries": { "PH": { "read": 0, "heard": 0 } } } ],
  "updatedAt": "2026-10-15T20:38:48.961Z"      // last counted beat
}
```

Day buckets are pruned to the last 14. The seed is the checked-in
snapshot's totals, so the live counters start from the permanent
record and never below it; pre-Blob day/country detail starts empty —
none is invented for beats that carried none.

- **POST /api/heartbeat** — one anonymous beat:
  `{ "type": "read" | "listen" | "listen_complete" | "book" }`. The
  body carries nothing else (no book, no chapter, no identity).
  `lib/heartbeat.ts` fires it alongside each Analytics event, behind
  the same dedupe gates, so both doors count the same beats.
- **GET /api/heartbeat** — `{ live, asOf, since, totals, today,
  countries }`: today's country rows with counts > 0. If the store is
  unconfigured or unreachable, GET serves the checked-in snapshot with
  `live: false` and the display falls back to it wholesale — the page
  never depends on the store.

**Country derivation (privacy).** A beat's country is derived
server-side from the request's `x-vercel-ip-country` header, which
Vercel's edge sets from the connection. Only the ISO alpha-2 code is
stored — never the IP, never anything finer than a country;
pseudo-codes (`XX`, non-alpha-2) are dropped. This is the v1 posture
extended, not changed: aggregate totals only, no reader identity.

**Writes and the known limit.** Increments are read-modify-write
against the Blob document, conditional on the ETag just read
(`ifMatch`), retrying up to 5 times on a lost race. Reads bypass the
CDN cache (`useCache: false`) so a GET always sees the latest count.
The residual limit, stated plainly: two beats landing in the exact
same instant can still, rarely, cost one increment (the retry window
is small but not zero), and Blob reads are eventually consistent —
the totals are a faithful floor, not a bank ledger, which is all this
count has ever claimed to be. A beat whose write ultimately fails is
dropped, never estimated — and the Analytics door still heard it, so
the daily roll-up restores it to the published record.

**The merge rule (how no counted chapter is lost or doubled).** The
roll-up now reconciles two records of the same beats. Published
snapshot totals are, field by field:

    published = max(analytics all-time totals, live Blob totals)

Analytics is the floor: it heard every beat since Oct 15 — including
beats from before the store existed. Jason's own John 15 read that
first afternoon went to Analytics only; at the first roll-up that
supplies the live JSON (saved from GET /api/heartbeat into the counts
file as `"live"`), the max carries it into the published totals.
Because both doors hear the same beats behind the same dedupe, taking
the max can never double-count. The same max applies to the "today"
bucket when the dates match. The rule is implemented and documented
in `scripts/heartbeat-rollup.mjs`; the daily roll-up + checked-in
snapshot remain the permanent record, exactly as before.

### The display

- **Live first.** `components/BodyHeartbeat.tsx` (now a client
  component) fetches GET /api/heartbeat on mount, refreshes about
  every 60 seconds and again whenever the tab becomes visible, and
  renders the live totals on success. Any failure leaves the snapshot
  rendering untouched. Copy, live mode: "Counted as the Body reads …
  this page listens again about every minute, and the latest beat
  landed *moments ago*" — the as-of is rendered in words from the
  counters' `updatedAt` (`asOfWords`). Fallback mode keeps the v1
  daily-cadence wording verbatim. The two records are never blurred:
  live country chips are headed "Today on the vine" and say "today";
  the snapshot garland keeps its own window label and source line.
- **The disc.** The ground layer is now an azimuthal equidistant
  projection centered on the North Pole: the world as a flat disc,
  land in the same faint parchment at 13% opacity, inside a soft rim
  ring. `scripts/build-world-map.mjs` re-projects the same Natural
  Earth 110m geometry and centroids (disc radius reaches 150° from
  the pole; longitude 0° toward the bottom of the disc), and the
  vendored `lib/world-map.json` now carries `viewBox: 0 0 1000 1000`,
  a `projection` note, and `extraCentroids` (see fallbacks below).
  The vine is redrawn for the disc: rooted at its heart (a knot at
  the center with a short root stem), seven main arms and five
  tendrils spreading across the continents; the 40 fruit lights lie
  along them, heart-first as before, and still mean today's chapters
  — now from the live today bucket when live, the snapshot's latest
  counted day otherwise. The section's prose was deliberately left
  speaking only about the counting ("Each light is a country where
  the Word was opened"); no copy was added about the map's shape in
  either direction.
- **Country silhouettes.** A counted country no longer gets only a
  dot: its actual Natural Earth polygon fills with warm golden light
  — a blurred outer-glow copy plus the fill copy, opacity scaled
  gently by count (fill `0.30 + 0.11·log10(1+total)`, capped 0.62;
  glow capped 0.30), breathing with the same `.hb-glow` cadence and
  frozen under `prefers-reduced-motion`. A small bright core (r 3
  with a soft halo) sits at the centroid — the heart of the glow.
  Each silhouette keeps its `<title>` (name + count) and its row in
  the text garland — today's chips for live rows, "Neighbors near
  and far" for the daily record — so the silhouette never carries
  meaning alone. Unlit countries stay at the quiet parchment 13%.
  The map draws ONE country set at a time: today's live set while
  live countries exist, otherwise the snapshot's set.
- **Centroid fallback + log.** A counted country whose code has no
  polygon in the vendored geography falls back to the v2 centroid
  light (halo, ring, core) at its `extraCentroids` position — 76
  centroid-only codes (small territories and the like) were emitted
  by the generator for exactly this. A code in neither table appears
  in the text garland only. **Fallback log:** as of go-live, no
  counted country has needed the fallback — the first live country
  row (US, from the verification beat below) has a polygon. When a
  fallback first occurs it will be noted here with its date and code.

### Go-live verification (Oct 15, 2026)

- Store + env verified before any code was written (names only).
- Local: ESLint clean on all touched files; production build clean;
  a local `next start` smoke test served the snapshot fallback
  (`live: false`), 503 on POST and 400 on a bad beat type with no
  store configured.
- Deployed as commit `a2a5df0` (push to `main`, Vercel auto-deploy).
  Production GET /api/heartbeat answered `live: true` with the seeded
  zeros; the live John 15 reader bundle
  (`/_next/static/immutable/chunks/2mhwnonil6zm4.js`) contains both
  `api/heartbeat` and `chapter_read` — both doors are in the shipped
  client code. The disc land path and the US polygon path are present
  verbatim in the served homepage.
- One sanctioned verification beat was then sent through the
  production endpoint — the exact POST the reader bundle makes
  (`{"type":"read"}`) — and a follow-up GET confirmed the increment:
  totals and today `chaptersRead` 0 → 1, `asOf` advanced, and the US
  country row (the operator machine's connection country) at read 1.
  That beat is the live counters' first, and it is counted honestly
  like any other. (The Blob store's `size`/`count` metadata lagged
  the write in the connector's reporting — the endpoint's own reads
  are the authoritative evidence.)

## v3.1 — subdivisions join the disc; lights are geography only (Oct 15, 2026)

Jason's decision (Oct 15, ~4:52pm): within a country, the count goes
one level closer — to the first-level subdivision (a US state) — as
an aggregate only, in his fence logic: "we're not gathering any
details about this person, only that they're in a state — and you
can't pinpoint that person even if you know there's only one."
**State-level aggregates only; nothing about any person is gathered
or stored.** Same posture as countries, one rung down.

**Generic ISO 3166-2 keying (architecture note, Jason, ~4:57pm).**
Subdivisions are going worldwide next (provinces, prefectures,
Länder — every country's own first-level divisions), so NOTHING in
v3.1 is US-shaped: a subdivision is always its full ISO 3166-2 code
("US-FL"), in the counters document (`days[].subdivisions`,
`subdivisionTotals`), the API (`subdivisions[]` rows carrying
`code`/`country`/`region`/`name`), the vendored geometry
(`lib/world-map.json` → `subdivisions`), and the component. The
worldwide admin-1 pass (v3.2) slots in by extending two registries
in `lib/subdivisions.ts` (per-country region sanitizers + name
tables) and the generator's sources — no schema change anywhere.

**Data.** When a beat's country has a registered sanitizer, the
route reads `x-vercel-ip-country-region` and records the sanitized
subdivision beside the country count (read/listen beats only, same
as countries). v3.1 registers the US only: accepted values are the
region part ("FL") or the full code ("US-FL"), normalized and
matched against the 50 states + DC (`^[A-Z]{2}$` after
normalization); territories (PR/GU/VI/AS/MP…), foreign subdivisions
on a US beat, and anything malformed are dropped silently — the
country count always stands. The raw header value is never stored;
no other header is read; the IP is never read (unchanged from v3).
`normalizeCounters` fills the new fields on pre-v3.1 documents, so
the stored counters carried forward untouched (verified live:
totals only grew through the deploy).

**Geometry.** `scripts/build-world-map.mjs` vendors admin-1
polygons from us-atlas `states-10m` (public-domain source data)
through the SAME azimuthal disc, simplified on the adaptive epsilon
ladder (DC survives at 0.02), keyed "US-AL"…"US-WY" + "US-DC".
`--subdivisions-only` rebuilds just that section and preserves the
shipped land/countries/extraCentroids byte-for-byte (verified).
Placement was verified two ways: formula ground-truth points
(Sacramento/Austin/Miami) land inside their state paths, and a
raster render shows the 51-state mosaic tiling the US silhouette's
disc position. Note the two sources differ in resolution — the
states are Census-detailed, the country outline is Natural Earth
110m — so state coastlines trace slightly MORE detail than the
national outline beneath them (most visible around the Great Lakes
and island coasts); centroids agree, and the overlay reads as one
nation. The state layer's own pixel footprint was diff-verified
against a no-state render (the differing region equals Florida's
disc bounding box exactly).

**Display.** When today's live rows include subdivisions, their
silhouettes render over their country's fill in a warmer gold
(`#ffdf8a`, log-scaled fill/glow, same breathing), the country heart
still renders on top — one nation, kindled closer in. The text list
groups them under their country ("United States — by state") in the
same chip style with read/heard breakdowns, and the figure's
aria-label names them. With no subdivision rows, the display is
exactly v3's.

**Director fixes (Jason, from photos of the live disc, ~5:01–
5:10pm) — landed in the same build.** The map's lights are
GEOGRAPHY ONLY: each person's read traces to their location (his
reads light Florida; his cousin's would light West Virginia). The
old fruit-dot layer — pale dots at every unlit position plus a lit
cluster at the disc's center — confused that meaning and is
REMOVED ENTIRELY: no unlit dots, no center dots, no data marks on
the vine at all. Today's chapter total rides as text in the
figcaption and the counters. The vine is soft root artwork only:
branches redrawn as thinner, gently bowed curves (widths 4/2.25,
trunk 7.5, opacity 0.85), drawn UNDER the land's lights so the
countries read first. Render QA on the production data shape (US
only): the disc's only lights are the US fill/glow/heart — no
circles at the center, nothing stray over oceans or unlit land.

**Verification (Oct 15, 2026).** Local only, with spoofed headers —
never against production: a vitest harness (in-memory Blob stub,
the real route + store + subdivisions modules) passed 7 tests:
US+"FL" and US+"US-FL" both count `US-FL`; PR dropped while the US
count stands; CA+"ON" earns no subdivision in v3.1; headerless and
garbage region values drop silently; the stored document is keyed
generically with no US-specific field names. ESLint clean;
production build clean. Deployed as commit `e1c575b`. Production
GET answers `live: true` with `subdivisions: []` — stated plainly:
**the array is empty until the first real US reader whose
connection carries a region signal arrives**; no production beat
was sent by this build, and the live counters (real reader
activity) were not reset or altered — they grew on their own during
the deploy window (US today 5 → 9 chapters).

## Accessibility & motion

- The figure (world map + vine, v2) is a labelled figure (`role="img"`
  + a plain-language summary that names any lit countries and their
  counts — v3.1: and any lit subdivisions within them); every number
  also exists as text, and the country list repeats the map's
  meaning in plain words beside it.
- The only motion is the lights' slow opacity breath
  (`.hb-glow` in `app/globals.css`), fully disabled under
  `prefers-reduced-motion: reduce`.
- Colors come from the existing vineyard/gold/sage palette; tile text
  pairs cream on vineyard-950 for contrast in both site themes.
