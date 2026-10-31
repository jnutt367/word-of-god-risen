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
| `chapter_listen_complete` | The listener has heard the chapter **through**: accumulated genuinely played time crosses a multiple of 80% of the chapter (played seconds only — seeks never count — and repeats add, so a second listen-through counts again). Device TTS offers no played-proportion signal, so its completion stays the final utterance's end | once per 80% crossing per browser session per chapter (TTS: once per session per chapter) |
| `book_complete` | Marked-read chapters complete a whole book | once per device per book |
| `chapter_listened_marked` | The reader taps "✓ I listened to this chapter" — their own word, counted in its OWN total (`listensMarked`), never folded into the measured `chapter_listen_complete` count (see "The reader's own word") | once per browser session per chapter |
| `video_watched` | A video actually starts playing in the app — a book overview, a parable film, the welcome film, the featured film, a Short — fired from the shared player's PLAYING state, never on a page view or a door tap alone (see "The video-watch heart") | once per browser session per video |

Instrumentation points: `components/ReaderView.tsx` (open, mark-read,
book completion), `components/ListenButton.tsx` (start/complete for both
the MP3 and TTS paths), `components/WatchPlayer.tsx` (every in-app video
play — see "The video-watch heart"). Reading-plan check-offs that never open a
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
  "days": [ { "date": "2026-10-15",            // America/New_York day bucket
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

## v3.1.1 — finest geography wins the light (Oct 15, 2026)

Jason, watching the first state beats land: "the entire country is
still lit up… not state specific." He was right — the country-level
fill rendered at full glow whenever the country had beats, so a
Florida read lit the whole United States and the state specificity
he asked for drowned in it. The rule now, in his direction:

**A beat lights the FINEST geography recorded for it.**

- **Ember step-back.** When a country has subdivision rows in the
  shown set, its subdivisions glow at full treatment — glow layer,
  log-scaled fill, breathing, and (new) a bright heart at each
  subdivision's own centroid — while the country base fill drops to
  a **faint ember**: one fill at fixed opacity 0.12, no glow layer,
  no breathing, no country heart. The ember is labeled honestly
  everywhere it is described (`<title>`, aria summary, the caption
  copy): "reading recorded across the United States; divisions lit
  where recorded" — never as "lit."
- **The unrecorded remainder, named.** Beats counted in the
  country's totals but carrying no recorded subdivision (region
  signal absent, or pre-v3.1 legacy beats in today's bucket) are
  computed as country total − Σ subdivision totals and get their own
  quieter list row under the country's group: **"United States —
  state not recorded"** (generic: "{Country} — division not
  recorded"). Nothing is hidden, and nothing pretends to a precision
  it lacks — those chapters are not spread over the whole nation as
  if the whole nation had read.
- **No subdivisions, no change.** A country with no subdivision rows
  in the set glows exactly as in v3 (full fill, glow, heart) —
  worldwide countries without division support are untouched, and
  the snapshot set (which carries no subdivisions) renders as
  before. The step-back happens per country, only where subdivision
  data for that country exists in the set.
- **Implementation.** The decisions are pure functions in
  `lib/heartbeat-display.ts` (`lightModeForCountry`,
  `subdivisionsOfCountry`, `unrecordedChapters`,
  `notRecordedLabel`, `EMBER_FILL_OPACITY = 0.12`);
  `components/BodyHeartbeat.tsx` renders what they decide. Display
  only — the counters document, the POST/GET routes, and the store
  were not touched.

**Verification (Oct 15, 2026).** Fixture checks against the compiled
display logic: (a) US today (country total 11) with one Florida row
(total 2) → mode "ember", unrecorded = **9 — the legacy beats**,
label exactly "United States — state not recorded"; foreign rows
never dim another country; multi-state sums and the zero floor
hold. (b) A country with no subdivisions → mode "full", no group,
no not-recorded row — the v3 look. ESLint clean, `tsc --noEmit`
clean, production build clean; a local `next start` smoke test of
the snapshot path renders the section with zero ember language
present. Production GET /api/heartbeat before and after the deploy
returned the same live shape with the counters intact and growing
only by real beats (at capture: totals read 6 / heard 5, US today
11, and — the defect made visible — US-FL already at 2 under a
fully lit nation; after this build Florida carries that light and
the United States rests as its ember).

## v3.1.2 — the decorative leaves removed (Oct 15, 2026)

Jason, looking at the live disc: "some green dots… semi-transparent
like ovals that look like old leaves — not sure what they are." He
was right again: the vine artwork carried ten pale leaf ellipses
scattered along its branches — pure decoration, but they landed
over countries and open ocean and read as unexplained data marks.
His standing model for this map is that **every mark must mean
something**, and a leaf means nothing.

- The leaf glyph group is removed from `components/BodyHeartbeat.tsx`
  entirely. The vine is now its bare branches and root stem only —
  soft root artwork, nothing on it, nothing beside it.
- No leaf mentions existed in the aria summary or captions (the
  figure is described as "a grapevine rooted at the heart of a soft
  world map" — rooted branches, nothing more), so no copy changed.
- Display only, as ever: the counters document, the routes, the
  store, and every display decision in `lib/heartbeat-display.ts`
  are untouched. **After this build, every mark on the disc is
  data**: country fills and hearts, subdivision fills and hearts,
  and nothing else.

## v3.1.3 — the vine overlay deleted; list rows carry their light (Oct 15, 2026)

Jason, on the vine's branches: "If they stay they should look like
what they are — you call it." The call was delegated, with one
redesign attempt allowed under a hard gate: render the redesigned
vine against the production data and ask, honestly, "does this
read as a grapevine, or as rays/spokes?" Any doubt meant deletion,
with no second attempt.

- **The redesign was built**: the uniform strokes were replaced by
  tapered filled ribbons — a gnarled root stem at the disc's heart,
  six main branches of deliberately unequal length curving with
  natural bends, six forks splitting at irregular points, and four
  thin tendrils ending in curls; muted bark brown, low opacity,
  behind the country/state lights, as specified.
- **The gate render was inspected** (production-data fixture: US
  as ember, Florida lit with its heart). Verdict, honestly: the
  tapered ribbons read as **blades / a pinwheel** — broad curved
  petals radiating from the pole — not unmistakably as a grapevine.
  The tapering that was meant to suggest wood made leaves of the
  branches. Under the gate there was exactly one permitted answer.
- **The vine overlay is deleted.** `components/BodyHeartbeat.tsx`
  no longer draws any artwork over the world: the disc is a pure
  map — rim, parchment land, and the lights of places, nothing
  else. Copy that described the drawing was corrected to match
  (the figure's aria summary no longer speaks of a grapevine; the
  section's name, "One Vine, many neighbors," is unchanged — it
  names the Body, not the artwork). A pure-map fixture render was
  inspected in its place: quiet dark world, the United States
  resting as its faint ember, Florida's small bright shape and
  heart the only strong light. Every mark is a place; the picture
  can be read at a glance.
- **The side lists regained their light markers** — the design
  Jason confirmed at 4:31pm this same day, which the list had lost:
  every lit country row ("Today on the vine" and the "Neighbors
  near and far" garland) and every lit subdivision row now opens
  with a small gold dot, `aria-hidden`, breathing on the same
  `.hb-glow` 4.5s pulse as its silhouette (delay-matched to it) and
  frozen under `prefers-reduced-motion`. The "United States —
  state not recorded" row gets **no** dot: it has no light on the
  map, and the dot means a light. The list is the map's voice, and
  now it breathes in step with the shapes it names.
- Display only, as ever: the counters document, the routes, the
  store, and every display decision in `lib/heartbeat-display.ts`
  are untouched.

## Test view — preview a place's light (Oct 15, 2026)

Jason's wish (~6:21pm): "I wish there was some way to get a test
to see if someone's state lights up." Now there is: **/heartbeat-test**.

- **What it does.** A picker offers all 51 US subdivisions (the 50
  states + DC) plus every country in the vendored world data
  (polygon countries and centroid-only ones alike). Picking a place
  feeds the production `<BodyHeartbeat>` a **fixture** — an injected
  payload shaped exactly like a real GET answer carrying ONE
  chapter for exactly that place — and the section renders through
  the ordinary production code path: same silhouette fills, same
  hearts, same ember rule (a picked state lights at full treatment
  while the United States steps back to its ember), and the place's
  would-be side row (breathing dot + name + "1 chapter today")
  under "Today on the vine" / "United States — by state". A
  `?place=US-WV` deep link names the initial pick, so a QA check
  can point at one place. Its purpose is verification: any place's
  shape, position, and heart can be confirmed true on the disc
  before a real reader ever lights it.
- **The no-write guarantee.** The test view performs **no network
  calls at all**: the fixture is built in the browser from the
  vendored map data (`lib/heartbeat-test-places.ts` +
  `components/HeartbeatTestPicker.tsx`), and `BodyHeartbeat`'s
  fixture mode (the optional `fixture` prop) suppresses its fetch,
  its 60-second poll, and any write — the live counters are neither
  read nor written, and nothing is POSTed, ever. The fixture exists
  only in the page's memory. The component's own fine print says so
  in fixture mode, and the page carries a prominent banner: "TEST
  VIEW — this is not live data; nothing here is counted."
- **Not public.** The page sets `robots: noindex, nofollow` in its
  metadata, is linked from no navigation, and is absent from the
  sitemap (which is an explicit list — it was simply never added).
- **Homepage untouched, verified.** The only change to
  `components/BodyHeartbeat.tsx` is the optional prop, its
  useState seed, the effect's fixture early-return, and the
  fixture-mode fine print; with no fixture supplied, the homepage's
  server-rendered heartbeat section is byte-for-byte identical to
  before the change (75,346 bytes, compared directly).
- **Fixture QA (Oct 15, 2026).** Server-rendered checks against a
  local production build: US-WV / US-AK / US-HI / US-TX each render
  exactly their own subdivision path with its heart pair
  (r 6.5 halo + r 2.6 core) at the vendored centroid — WV (341.9,
  527.3) its small shape in the eastern US cluster; AK (450.3,
  421.4) broad up toward the pole, left of top-center; HI (408.4,
  298.9) its tiny island specks far up-disc; TX (318.7, 468.3) the
  large shape low in the US cluster — the United States behind
  each as the single 0.12 ember fill, no country heart, no
  "state not recorded" row, and no other state's path present.
  Kenya (KE) renders the full country treatment (fill + heart
  r 7/r 3 at 671.7, 719.7, lower right on the disc) with no ember
  anywhere — countries without subdivisions behave exactly as live.

## "Listened through" — the 80% played-time rule (Oct 20, 2026)

Jason's ruling: *"Having to listen to the entire thing just to count
as having listened is like saying that if we don't sit down and read
a whole chapter in one sitting it don't count"* — and, pressed for
the line: 80%, "not over liberal." The old rule fired
`chapter_listen_complete` only at the track's very last second; it
measured the file, not the listening. A listener who hears four
fifths of a chapter of John has heard the most important thing in
it — the count now says so.

**The rule.** A chapter counts as **listened through** when the
listener's genuinely played time reaches **80% of the chapter's
duration**. The measure is played time, never playhead position:
the player follows the playhead as one continuous segment in
`components/ListenButton.tsx` — while it advances at the speed of
real time it is genuinely sounding; a jump the clock cannot
explain is a seek, which closes the segment where the sound
stopped and starts a new one where it resumes, so a scrubbed-past
passage earns nothing. Closed segments feed `notePlayedSpan` in
`lib/heartbeat.ts`, which adds their seconds per chapter in
`sessionStorage` — so the total accumulates across player remounts
within the browser session — and fires the existing
`listen_complete` beat at the threshold. No server or schema
change: the beat kind, the counters, and the roll-up are exactly
as before; only the client-side trigger moved. The natural end
releases a threshold crossing the played time has reached but not
yet fired, and adds nothing of its own. The displayed name changed
to match the measure: the Field Report totals now read
**"listened through"** wherever they previously said "listens
finished."

**The correction — repeats count (Jason's ruling, later the same
day).** The first shipped version of this rule merged played spans
into a union, so it measured *coverage*: re-listening a stretch
never added time. Jason overruled it — *"if someone rereads the
passage it should count as a listen again."* The count measures
**listening**, not coverage. Played seconds now simply add,
repeats included: hearing a chapter's first half twice is a whole
chapter heard. Each time the accumulated total crosses a further
multiple of the 80% line (0.8×, 1.6×, 2.4× … of the duration) the
chapter counts once more — a full second listen-through in one
sitting is a second listen. The dedupe moved with the rule: it now
guards **each crossing** (keyed by crossing number), so no crossing
can ever fire twice, while crossings beyond the first are no
longer swallowed. (Span sets stored by the first shipped rule are
migrated on first read: their covered seconds carry over as played
time, and a chapter that build already counted keeps its crossing
marked as fired.)

**The TTS exception, stated plainly.** Device text-to-speech has
no played-proportion signal — `speechSynthesis` reports no elapsed
time or duration for its utterances — so no honest 80% measure
exists on that path. TTS completions therefore remain what they
were: the final utterance's end. Nothing was faked to make the two
paths look alike.

**The undercount fix (Oct 27, 2026).** Jason's own report: he
listens to whole chapters and NONE register as listened-through.
The 80% bar did not move (his Oct 20 ruling stands) and seeks
still earn nothing — the measurement itself was dropping genuine
listening in three places, all in `components/ListenButton.tsx`:

- **Playback rate.** The MP3 segment test compared playhead
  advance to wall-clock advance as if playback were always 1×
  (`dPos <= dWall*1.5 + 1`), so a listener above ~1.5× had every
  segment misread as a seek and banked ~0 forever. The test is
  now rate-aware: `dPos <= dWall * playbackRate * 1.5 + 1`. A
  real seek still fails it at any rate — the jump dwarfs the
  rate-scaled allowance.
- **Starved callbacks.** On a locked/backgrounded phone,
  `timeupdate` throttles or suspends while the audio keeps
  sounding, and the unreported stretch was lost. The player now
  reconciles against the audio element's **played TimeRanges**
  — the browser's own record of what actually sounded — on
  pause, on end, and when the page hides: the open segment
  extends to the end of its own continuous played range and
  banks it. A seek lives in a different range, so reconciliation
  cannot pull a jumped-over gap into the count, and the flush
  that closes a segment caps itself at its range's end.
- **TTS's single fragile callback.** Completion hung on the
  LAST utterance's `onend` alone; Android drops that signal
  (long queues, pause/resume, screen lock). Now every
  utterance's completion is counted as it arrives, and the
  chapter completes when the count reaches the final part
  under the current session. If the platform gives no reliable
  end at all, a watchdog fires the completion when the queue
  has drained (nothing speaking, nothing pending, the session
  still the playing one, and the session demonstrably ran) —
  never while paused, never for a stale session.

A node-side model of the exact acceptance rules passes 15/15:
the old rule discards the 2× backgrounded segment the new rule
banks; seeks of 30–60s are rejected at 1× and 2× alike; the
reconcile extends only within a continuous played range; TTS
fires on the counted final part, on the drain fallback when
the last `onend` is dropped, and never from a pause or a stale
session. What the fix cannot do, stated plainly: a phone that
kills the page's timers AND its audio element's ranges in deep
background may still under-report the final stretch (the ranges
themselves are the last witness), and a rate changed mid-segment
is judged at the rate in force when the callback lands.

## The reader's own word — "I listened" (Oct 20, 2026)

Jason's direction: *"give it a listened to if the person selects
that button saying they listened."* The measured count has a blind
spot and he named its remedy. Device TTS offers **no
played-proportion signal at all** — a listener can hear a whole
chapter read by their phone's voice and the 80% rule never knows.
Some listening also simply happens off the playhead's watch. So the
reader is trusted to say so, and their say-so is counted — as its
own thing, under the house honesty:

- **The button.** Every chapter page carries **"✓ I listened to
  this chapter"** (`components/ListenedMarkButton.tsx`, in the
  chapter-end actions under the Listen controls) — a full-size tap
  target in the reader's own styling. After the tap it rests in
  its counted state for the visit: **"✓ Counted — thank you."**
- **Its own beat, its own total.** The tap fires a new beat kind,
  **`listened_marked`** (Analytics door: `chapter_listened_marked`),
  counted in `totals.listensMarked` and the day bucket's
  `listensMarked` — **never folded into the measured
  `listensCompleted`**. A tap is a testimony, not a measurement;
  the two counts stand side by side and are never blended, exactly
  as site visitors and chapter reads are never blended on the Field
  Report. Like `listen_complete`, a marked beat attributes no
  geography — it records that a listener said they listened.
- **Same disciplines as every beat.** Dedupe: once per chapter per
  browser session. Aggregate only: totals and the day count, no
  identity, no IP. It flows through the same store increment path
  as every other beat — conditional writes, the Oct 20 rescue
  write, and a logged cause on any failure; a dropped marked beat
  is dropped loudly, never estimated. Counters documents written
  before this build normalize the new fields to 0 on first read —
  the live count carried forward untouched.
- **Not the place-keeper.** The chapter's "🎧 Mark as listened"
  button is unchanged: it keeps the reader's own place on their
  own phone, is undoable, and counts nothing. The new button
  speaks into the Body's shared count, once. Different jobs,
  different labels, side by side.
- **Where it shows.** GET /api/heartbeat exposes
  `totals.listensMarked` and `today.listensMarked`. The Field
  Report prints it beside the measured count — *"…listened
  through · N marked 'I listened'"* — the reader's word standing
  next to the measurement, each named for what it is. The homepage
  does not display it, and the Big Picture deck's totals remain
  the measured set.
- **Verified without touching the count.** A stubbed-store harness
  passed 29 checks (totals math, the two counts' separation, no
  geography, pre-existing-document normalization, the rescue path
  landing a marked beat exactly once under a total precondition
  deadlock, generic errors still propagating, and the client
  dedupe — one tap, one beat, per session per chapter); `tsc`
  clean, ESLint at the standing baseline, production build clean;
  a local no-store smoke test answered the new kind with 503
  (accepted, unconfigured) against 400 for a bogus kind, and the
  GET fallback carries the new fields at 0. **No synthetic beat
  was sent to production** — the first real marked count will be
  a real reader's tap.

## The frozen store — incident and repair (Oct 20, 2026)

**What happened.** The live Blob counters froze at
`updatedAt: 2026-10-18T15:55:25.755Z` (11:55am ET, Oct 18) with totals
32 read · 14 heard · 7 completed. For two days GET /api/heartbeat
kept answering `live: true` with that document, the Field Report
heartbeat faithfully republished the frozen totals, and no reader
beat landed — Jason caught it by testing on Oct 20: he read and
listened to a full chapter end to end, two Field Report runs
republished, and nothing moved. The client fires each beat
fire-and-forget (fail-soft by design, so the page never breaks), and
the route swallowed every failure into a bare 503 — a dead write
path was invisible from everywhere a reader or watcher could see.

**What the evidence showed.** Jason's catch was traced through the
whole chain. The client wiring (`ReaderView`/`ListenButton` → the
Oct 20 counter builds) is intact and unchanged in behavior; the
server store and route are byte-identical to the Oct 15 v3.1 build
that counted correctly for three days. The Blob store itself is
healthy (status available, billing active, quota not exceeded, one
1,014-byte document), and its three env vars stand exactly as
created on Oct 15 — never edited, token not expired. Reads never
failed: the frozen document was served fresh throughout. Only the
writes stopped, all of them, from one beat to the next. The exact
server-side error could not be read back: this team's plan/scope
returns 403 for runtime logs and 402 for Analytics custom-event
queries through the connector (the same scope wall noted at v1).
The failure shape — reads healthy, every conditional write failing
from a single moment onward, store and credentials provably sound —
fits a write precondition that can never match again (the ETag
optimistic-concurrency check deadlocking every increment into a
silently dropped beat), and the repair below is built to cure that
class outright rather than bet on one theory.

**The repair.** `incrementCounters` keeps its five conditional
attempts; if all of them lose their precondition, it now makes one
final rescue attempt — a fresh read and an unconditional write —
instead of dropping the beat, and the rescued document heals the
chain (later beats read the new document's ETag and conditional
writes work again). Every failure branch now logs its cause
(`console.error` in the store and in the route, including the
dropped-beat and snapshot-fallback paths), so a future failure is
never silent twice. Verified without touching the live count: a
stubbed-store harness passed 12 checks (normal write lands in one
conditional put; under a total precondition deadlock the rescue
lands the beat exactly once and the next beat writes conditionally
again; an unknown store error still propagates and writes nothing),
`tsc` clean, ESLint at the standing baseline, production build
clean. No synthetic beat was sent to production to test this — the
count is the public record. The write path's production proof is
the next real reader beat: a chapter opened or heard should move
`asOf` off Oct 18 within one homepage refresh (the display polls
about every minute).

**What is lost, stated plainly.** Beats that reached only the Blob
door between Oct 18, 11:55am ET and this repair are gone and cannot
be backfilled: the live counters never received them, and the
Analytics door's event totals cannot be queried from the operator's
connection on this plan (402), so the daily roll-up has nothing to
reconcile from for that window either. The checked-in snapshot was
never refreshed after Oct 15 for the same reason. As ever, the
totals are a faithful floor — this window is part of why that has
always been the honest description of them.

## Accessibility & motion

- The figure (the world map; the vine overlay was removed in
  v3.1.3) is a labelled figure (`role="img"`
  + a plain-language summary that names any lit countries and their
  counts — v3.1: and any lit subdivisions within them); every number
  also exists as text, and the country list repeats the map's
  meaning in plain words beside it.
- The only motion is the lights' slow opacity breath
  (`.hb-glow` in `app/globals.css`), fully disabled under
  `prefers-reduced-motion: reduce`.
- Colors come from the existing vineyard/gold/sage palette; tile text
  pairs cream on vineyard-950 for contrast in both site themes.

## Place-keeper relabel (Oct 20, 2026)

So the counted button and the on-device place-keeper can never be
confused, Jason approved renaming the place-keeper: "🎧 Mark as
listened" is now **"🎧 Mark as done — just for my place"** (resting
state: "🎧 Done, just for my place — tap to undo"). Same control,
same job — the reader's own place on their own phone, undoable,
counting nothing. Only the counted button speaks into the Body's
count.

## "Today" runs on the house's clock (Oct 20, 2026)

Jason spotted the live page saying "today, October 21, 2026" at
8:25 p.m. Eastern on October 20. The day bucket was derived from
UTC, so the heartbeat rolled over at 8 p.m. Eastern. The calendar
anchor is now **America/New_York** everywhere the Body Heartbeat
derives its current day: a single pure helper,
`lib/heartbeat-date.ts` (`heartbeatToday`), feeds the server's
beat bucketing and public "today" view in
`lib/heartbeat-store.ts` and the client fixture in
`components/HeartbeatTestPicker.tsx`. `updatedAt` remains an
instant timestamp; only the calendar-day key changed. No data
collection, copy, totals, or map behavior changed.

Stored history was **not** rewritten. Buckets written before the
fix were keyed by UTC day, so there is a one-time seam: the
pre-fix `2026-10-21` bucket may already hold beats from after
8 p.m. Eastern on October 20, and those counts will stand in that
date's bucket when the Eastern calendar reaches October 21. From
the deployment forward, new beats use the Eastern calendar day.

**Deployment verification.** Commit `b37d9eb` was pushed to
`main`; at 8:35 p.m. EDT on October 20 (already October 21 in
UTC), production `GET /api/heartbeat` answered `live: true` with
`today.date: "2026-10-20"`, 10 chapters read, 8 heard, and 6
marked for that Eastern day. The helper's boundary checks also
pass at Eastern midnight in both daylight and standard time.

## The Vine Is Growing — the day-by-day record goes public (Oct 21, 2026)

Jason's word, late on the ministry's biggest day so far: people should
be able to *see* yesterday, last week, last month — "so they can feel
like they're part of a growing family." The record already existed
(the store has kept per-day buckets since v3); this pass opens the
window onto it and makes sure the record endures.

- **Retention 14 → 400 days** (`lib/heartbeat-store.ts`): the day
  buckets no longer roll off after two weeks. Each bucket is small
  (counts + place rows), so a year-plus of days stays a modest
  document. The counting had run eight days when this landed, so
  nothing had yet been pruned — the public record begins whole,
  from October 15, 2026.
- **The public view gains `history`**: every stored day, ascending —
  its chaptersRead / chaptersHeard / listensMarked plus the country
  and subdivision rows that lit that day, in the same shapes as
  today's rows. Same privacy class as everything the view already
  exposed: a day's aggregates, never a person's anything.
- **The display** (`components/BodyHeartbeat.tsx`): a new section on
  the map's own card, "The Vine Is Growing" — rolling windows (last
  7 days, the 7 before, last 30 days, places lit), a two-week bar
  chart, and the full day-by-day numbers in a real table under a
  disclosure, so the chart never carries the meaning alone. The
  series is calendar-continuous: a day with no counted beat stands
  at zero rather than vanishing. Live history only — in snapshot
  fallback the section simply does not render, and sources never mix.

## v4 — the count-keeper moves house (Oct 23, 2026)

The Blob store ran out of month. On the evening of Oct 23 the
homepage card fell back to its resting snapshot and beats began
answering 503: the private Vercel Blob store holding both count
documents had reached the Hobby plan's **advanced-operations
ceiling (2,000/2,000)** — its per-beat ETag read-modify-write
counted one advanced operation for the read plus one for the write,
and the free month's allowance lasted eight days (Oct 15 → 23).
Vercel's own banner in Jason's dashboard: "Access resumes on
11/22/26." Waiting would only have re-broken the counter about
eight days after the reset, on exactly the same math. Jason's
ruling the same evening: **"Move the count-keeper to a free
home."**

- **The new home**: an Upstash Redis database, free tier — 500K
  commands/month, 250 MB, no credit card, and no hard lock at the
  edge (an over-limit free database is throttled and emailed about,
  never frozen for a month or billed). Reached over its REST API by
  `lib/redis-rest.ts` — no new package, no TCP from serverless.
  Credentials arrive as env vars (`UPSTASH_REDIS_REST_URL` /
  `UPSTASH_REDIS_REST_TOKEN`, or the `KV_REST_API_*` pair the
  Vercel integration sets).
- **The layout** (keys under `hb:` / `ar:`, detailed in the store
  files' headers): lifetime totals in a hash, the open day in its
  own hashes, closed days as JSON records in one hash. Every write
  is an **atomic increment** — a beat costs ≈3–5 commands, a read
  ≈7, flat at any history length (~50K commands/month at the
  October 2026 scale, a tenth of the free allowance). The
  whole-document read-modify-write is gone, and with it the
  frozen-store failure class: increments have no precondition to
  deadlock. `incrementCounters` / `incrementReports` keep their
  names, shapes, and error semantics; both routes are untouched;
  the public shapes are exactly v3.2's.
- **The seed**: the Blob document's last verified state (Oct 23,
  19:51 EDT — totals 163 read · 91 heard · 47 completed · 48
  marked · 2 books, the full day-by-day record Oct 15–23, the
  Bahamas' first light among them) is checked in as
  `data/heartbeat-seed.json`; the reports' record likewise, plus
  Jason's matthew:27 tap of ~19:49 EDT that evening (pre-lock,
  confirmed by Jason and the flag ledger — 9 chapters in all). An
  untouched store seeds itself from these on first touch, so the
  counters resume from the truth and never below it;
  `scripts/seed-count-store.mjs` is the operator's hand version,
  with `--verify`.
- **What the lock cost**: beats and report taps between the lock
  (~19:52 EDT Oct 23) and the cutover were dropped by the live
  door. The Analytics door heard the beats (it fires client-side,
  behind the same dedupe), so the window is restored afterwards by
  the merge rule below via `scripts/restore-outage-window.mjs` —
  totals and per-day rows by max(analytics, live), and geography
  by the same rule from this app's own Web Analytics geography for
  the window days. **Report taps left no second record** (the tap
  fires no Analytics event) and cannot be restored; said plainly.
- **Jason's place-lighting ruling (Oct 23, 2026)**: "if we know
  that there's someone reading in a state that hasn't lit up just
  turn that light on." A restoration — and a roll-up — that learns
  of reading in a place that has never lit **lights it in the
  record**, it does not wait for a live beat to re-prove it. The
  restore tool names every newly lit country and subdivision in
  its output, so the prayer-greeting rhythm can welcome them.
  Going forward this is the roll-up's rule too: known reading =
  light on.

## The open — any open lights the map, as an ember (Oct 27, 2026)

Jason's ruling: "We should really have something to show anytime
someone engages" — and, refined the same evening, an open alone
wears the EMBER, because the full light "reads not as true" for a
mere open: the full golden light has always meant the Word was
read or heard in a place; an open is a knock on the door.

- **The beat**: a new kind, `open` (Analytics event `app_open`),
  fired once per browser session by `beatOpen()` in
  lib/heartbeat.ts — the same sessionStorage dedupe as every beat
  — from `components/AppOpenBeat`, mounted in the root layout so
  any entry page counts. The one exception: /heartbeat-test,
  whose no-write guarantee stands (the component skips it).
- **The store**: opens count in their own fields everywhere —
  `totals.opens`, the day's `opens`, and per-place `opens` beside
  read/heard in the day geo hashes (`c:US:opens`, `s:US-FL:opens`)
  and lifetime subdivision subtotals. Never folded into
  read/heard: a row's `total` stays chapters only, and the public
  view now keeps a row whose only activity is opens
  (`total + opens > 0`), so an opens-only place exists in the
  data the map and the place-watches read. Records written before
  this section normalize `opens` to 0 on read; no migration.
- **The map**: tiers are `full` and `ember` as v3.1.1 settled
  them, plus `open` — a place whose shown activity is opens only
  renders with the ember treatment (the same `EMBER_FILL_OPACITY`
  fill in its own shape; no glow layer, no breathing, no heart;
  a centroid-only place leaves the same faint disc an ember
  country leaves). An opens-only subdivision renders as an ember
  in its own shape the same way, and does not by itself step its
  country back — the step-back still keys on chapters alone. Any
  chapter at all outranks the opens: a place with opens AND a
  read/heard renders exactly as it always has. Every text surface
  names the count plainly — the chips carry a terse "· N visits"
  suffix beside the chapter counts (Jason's copy ruling, Oct 27,
  2026: "visits," never "opened N times" and never "N opens" —
  display copy only; the API fields and the `open` beat kind keep
  their names), the titles and the aria
  description say the app was opened and the place rests as a
  faint ember, and a zero-chapter day with embers on it says so
  in the caption instead of claiming the world is at rest.
- **Same-day prayer**: whether an ember-only first light calls
  for the new-place prayer is Jason's pending choice; the watches
  read the same place rows either way.

### The ember brightens with visits (Oct 27, 2026 — Phase 2.5)

Jason: "it should glow a little brighter each 10 visits." The
opens-only ember is no longer one flat opacity:

- **Graduated by all-time opens.** `emberOpacityForOpens` in
  `lib/heartbeat-display.ts` (pure, like every display decision):
  the flat ember 0.12 below 10 visits, then +0.03 at each 10-visit
  threshold (10 → 0.15, 20 → 0.18, 30 → 0.21, …), **capped at
  0.30** — about half the full chapter light's presence (country
  fills run 0.30–0.62). The cap is the fence: no number of visits
  makes a mere open read as the Word opened.
- **Never the full light's marks.** At every brightness an ember
  stays steady: no glow layer, no breathing (`.hb-glow`), no
  heart. Those belong to a chapter opened, and only to that. A
  place with any chapter activity renders exactly as before —
  this touches opens-only places only (their silhouette fill,
  their centroid disc, and their steady list dot). The v3.1.1
  step-back ember (a country behind its lit subdivisions) is a
  different ember and stays flat at 0.12.
- **Which opens count.** The public view's per-place rows are
  per-day; the component sums a place's `opens` across every day
  in the payload's `history` (which includes today) — the richest
  all-time per-place figure the API gives. (The store keeps
  lifetime subdivision subtotals internally, but the public view
  does not expose them per place, and countries keep no separate
  lifetime geo total; the history sum is the honest all-time
  figure within the record's 400-day keeping.) Fixture and
  snapshot payloads carry no history, so the row's own opens
  stand as the fallback there.
- **Wording.** The opens-only titles and the figure's aria
  description now name the all-time count as "N visits" and say
  the ember is "glowing a little brighter with visits"; the aria
  description says plainly, once, that the Word has not been
  opened there yet. Chips stay terse — a "· N visits" suffix.
  Opens are still never described as chapters or as lit.
- **The rim brightens too (Jason's rim rule, Oct 27, 2026).**
  Jason, watching California rest as an ember at 36 visits: "36
  visits should get you a good light rim." The fill was fine —
  the place's shape didn't trace on a phone. So an opens-only
  place's OUTLINE now brightens with visits alongside its fill:
  `emberStrokeForOpens` in `lib/heartbeat-display.ts` gives a
  steady stroke opacity of 0.55 for 1–9 all-time visits, +0.13
  at each 10-visit step (10 → 0.68, 20 → 0.81, 30+ → the 0.94
  cap), drawn a touch wider (countries 1.1, subdivisions 1.0,
  centroid rings 1.2). The rim is the honest half of the sign:
  the fill is the claim (still an ember, still capped), the rim
  only says someone is here, looking — so it may trace the
  shape clearly without ever reading as a light. Steady at
  every brightness: no glow layer, no breathing, no heart.
  This touches opens-only places only; the v3.1.1 step-back
  ember's outline stays flat and faint exactly as before, and
  the opens-only titles now say "its rim brightening too"
  beside the fill's brightening.

## The ivory ring — book finished (Oct 28, 2026)

Jason's question in the morning chat — "What can we do for
showing someone finished a book of the Bible — on the map — or
should we even?" — and his ruling on the offered shape: when a
whole book of the Bible is finished in a place, that place
wears a **soft ivory-white halo for the rest of that day**, then
settles back to its ordinary light. No names, no counts,
nothing permanent — a ring for the day, in the map's existing
language of light. (Philippians 2:3 governs the copy: the ring
celebrates a neighbor's walk through a book, and keeps no
score.)

- **The finish gains a place.** Until today the `book` beat
  carried no geography at all: it moved only the lifetime
  `booksFinished` total, so no record existed of WHERE a book
  was finished. The beat now records its place exactly the way
  read/listen/open beats do — a fourth field kind, `books`,
  in the day's geo counts (`c:US:books`, `s:US-FL:books`) and
  the lifetime subdivision subtotals — counted beside the
  chapters like opens, never inside them: a row's `total`
  stays chapters only, and the row-standing rule is unchanged
  (a finish alone still does not stand a place up in the
  rows). Records written before this field normalize it to 0;
  no migration, and finishes before Oct 28, 2026 have no place
  record — none is invented for them.
- **The payload.** `publicView` derives each place's last
  book-finish date from the day records — the latest day whose
  geo counts hold a finish for it — and carries it on the
  place's rows as `bookFinishedOn` (null when the place has no
  finish in the record). The day record stays the only source:
  a finish is never claimed for a place or a day the count
  does not hold.
- **The ring.** The decisions are pure functions in
  `lib/heartbeat-display.ts` (`bookHaloOn`,
  `countryBookHaloOn`): the ring is on when the place's last
  finish date is today AND the place carries chapters in the
  shown set — a finish is a book read or heard through, so
  the ring always rests on a full light, never on an
  opens-only ember. A subdivision's ring steps its country's
  own ring back, the finest geography carrying the sign
  exactly as it carries the light (v3.1.1); a finish recorded
  with no subdivision keeps the country's ring. The component
  draws the ring last, over the lights it honors — traced
  around a silhouette (a wide faint stroke under a narrower
  clear one, `#fffff0`), or as a circle around a centroid
  light — and it is STEADY: no `.hb-glow`, no breathing, no
  flare. The sign belongs to today: at the live default only,
  never while day browsing. Every text surface names it in
  the same voice: the legend gains "A white ring — book
  finished here today" on days a ring is worn; the place
  chips carry "· book finished"; the ring's `<title>` and
  the figure's aria summary say it too.
- **The first ring is Jason's own, seeded honestly.** Jason
  told us in chat that same morning, "I just finished one" —
  he finished a book today, from Florida. Per-place finish
  dates did not exist anywhere before this build, so nothing
  in the system could already hold it; Florida's
  last-book-finish date is therefore seeded as 2026-10-28 in
  the day's geo counts (`c:US:books` and `s:US-FL:books`, +1
  each, plus the US-FL subtotal) FROM JASON'S OWN STATEMENT —
  a seed from his report, not telemetry. The lifetime
  `booksFinished` total is NOT touched by the seed: his real
  beat, if it landed, already stands in it, and the seed
  claims only the place and the day he himself named. No
  other place's date is seeded. **Status at ship time:** the
  seed write itself waits on the store credentials, which
  reach operator scripts only through the Secure Vault route
  (the Vercel connector returns these integration-managed
  secrets undecrypted — the same standing wall the
  outage-window restoration waits behind). The seed stands
  prepared and idempotent as
  `seed-florida-book-finish-2026-10-28.mjs` in the goal's
  hidden_files, ready to run the moment the credentials are
  in hand; until it runs, the payload honestly reads
  Florida's `bookFinishedOn` as null and no ring is worn.
  (An earlier draft of this section spoke of the seed in the
  past tense before it had run; corrected the same day —
  the record says what is true.)
- **Same-day amendments (Oct 28, 2026, afternoon).** (1) THE
  SEED NEVER RAN — IT DIDN'T NEED TO: a real Florida book
  beat landed in the app after this build shipped, and the
  payload now carries `bookFinishedOn` 2026-10-28 for US-FL
  and US from the record itself (lifetime `booksFinished`
  reads 4). Florida wears its ring from the true beat; the
  prepared seed script stands unused, and the Secure Vault
  console pass is closed. (2) THE COLOR: the ring shipped
  gold (`#ffd977`); Jason, seeing it live, ruled the same
  day that gold already belongs to the visit lights (a
  well-visited place glows gold too) — a finished book gets
  its own color: **ivory-white, `#fffff0`**, visits keeping
  the gold glow. (3) THE WORDS, shortened at Jason's word:
  the place chips read "· book finished" and the legend
  "A white ring — book finished here today" (the ring's
  `<title>` and aria voices match).
- **Verification (Oct 28, 2026).** `tsc --noEmit` clean,
  ESLint clean on the touched files, production build clean.
  Fixture checks against the compiled display logic pass
  (ring on for a finish today with chapters; off for an
  earlier finish, an opens-only place, a null date, and
  while browsing; the country's ring stepping back to its
  subdivision's and standing for an unrecorded-division
  finish). A stubbed-store harness (in-memory Redis REST)
  drove the real store code: a book beat lands its country
  and subdivision finish counts and its subtotal, leaves the
  chapter counts untouched, and `publicView` derives
  `bookFinishedOn` = today from it; a country-only finish
  lands with no subdivision and does not stand a row up.
  Production verification — the payload carrying the new
  field on every row, and the served client chunk containing
  the ring rendering and its copy — is recorded in the build
  record under the goal's hidden_files; Florida's ring date
  itself verifies there once the seed above has run.

## The video-watch heart (Oct 29, 2026)

Jason, in the evening voice call: "We don't have anything for
showing if somebody watched an overview on the app… or watch
the terrible video… parable. I can't believe we didn't think
about that" — and "I think there's a lot of people watching
them." He was right: every video in the app played in silence
as far as the count was concerned — the book overviews carried
only a local "mark as watched" check on the visitor's own
phone (`lib/media-progress.ts`), and no beat existed for any
film. His design, settled the same night: a watch puts a
**gold heart on the watcher's place** on the Earth map; **no
visible count words anywhere** (no tile, chip, or list row —
"that would clutter things up"); the ocean legend carries the
only words. Gold first; never red (red is reserved for a
kindling mark not yet built).

- **The beat.** A new kind, `watch`, beside the others: fired
  by `beatWatch(videoId)` in `lib/heartbeat.ts` (the
  `video_watched` Analytics event carries the video id; the
  live POST body stays `{type}` only, like every beat) when a
  video **actually starts playing** — the YouTube player's
  PLAYING state, never a page view, never a door tap alone.
  Dedup: once per browser session **per video**, keyed
  `hb:watch:<videoId>` in sessionStorage. The player is one
  shared component, `components/WatchPlayer.tsx` (the YT
  IFrame API loader and the throwaway-mount-div pattern moved
  out of `WelcomeFilm.tsx`, which now imports both from it),
  and every in-app video surface rides it: `VideoEmbed`
  (book overviews), `VideoChoice`'s modal stage (the featured
  film, the Shorts shelf, and every other ask-first door),
  `WelcomeFilm` itself, and the Parables page (its intro and
  each film). `VideoChoice`'s ask-first law is untouched —
  the beat fires only after the visitor's own tap plays.
- **The store.** Watches are counted exactly the way opens
  and finishes are: beside the chapters, never inside them.
  A fifth field kind, `watches`, in the day's geo counts
  (`c:US:watches`, `s:US-FL:watches`) and the lifetime
  subdivision subtotals; `totals.videosWatched` and the day's
  `videosWatched` walk beside `opens`. `publicView` carries
  `watches` on the country, subdivision, today, and history
  rows (history carries it, so a heart is worn while day
  browsing too, for any day the record holds). A row's
  `total` stays read+heard only — **a watch is never chapter
  activity**: it cannot light a place, cannot finish a book,
  and cannot trigger the new-place prayer. The one row-rule
  change: a row now also stands on watches alone (the map
  must see the row to draw its heart). Records written before
  this field normalize it to 0; no migration.
- **The heart.** In `components/BodyHeartbeat.tsx`: a heart
  *shape* in the lights' gold (`#e4b95c`, rimmed `#ffe1a1`),
  steady — no breathing — drawn beside the place's center.
  The full light's bright core is a small round dot and stays
  exactly as it was; the two marks never merge: a lit place
  with watches wears its glow *and* a heart glyph offset from
  its centroid; an unwatched-chapters place with watches
  keeps its ember (or its quiet land) and wears the heart
  alone. Tier law: a place with no chapters wears the ember
  treatment whatever its activity. The finest geography
  carries the heart, as it carries the light and the ring:
  a subdivision's heart stands for its country's watches.
  Place chips carry no watch words (a watches-only chip is a
  name and a steady ember dot, nothing more); the heart's
  meaning is spoken in `<title>`s and the figure's aria
  summary, and shown in the ocean legend's fourth row —
  a gold heart swatch, "Video watched" — added inside the
  legend's existing verified ocean rect (x 140–398,
  y 166–400) by tightening the rows' spacing; the panel did
  not grow, so the zero-land survey of that patch stands.
- **The honest edges.** The daily roll-up does not reconcile
  `videosWatched` into the checked-in snapshot (`data/
  heartbeat.json` predates the field; the route's fallback
  defaults it to 0) — the live store is the count's record,
  like opens. Before this build, no watch was ever counted:
  hearts begin with the first plays after it ships, and no
  earlier watching is invented. Verification at ship time is
  by code, typecheck, lint, production build, and the
  deployed payload's shape — no test beats are fired into the
  live counters (a sandbox beat carries no geography anyway).

## The hundredfold — a hundred chapters in a day (Oct 30, 2026)

Jason, in the evening, with Florida's day still climbing:
"I never thought I'd have to ask this but I'm so grateful
that I do — we need another map marker that signifies 100
chapters read, because that's about to happen." Florida
stood at 97 chapters that day when he asked. The mark he
crowned is named for the good soil of Matthew 13, which
bore a hundredfold: the ring speaks of the soil receiving
the Word deeply, and keeps no score (Philippians 2:3
governs the copy, as with every mark on this map).

- **The rule.** When a place's SHOWN day brings a hundred
  or more chapters, the place wears a **steady gold ring**
  for the day. The decisions are pure functions in
  `lib/heartbeat-display.ts` (`hundredfold`,
  `countryHundredfoldOn`, the threshold named as
  `HUNDREDFOLD_TOTAL_THRESHOLD` = 100, beside `kindled`'s
  75): the count is the row's `total` and nothing else —
  chapters read or heard only. A watch never counts toward
  it (a watch is its own count, never folded into read or
  heard) and an open never counts; rows already keep both
  out of `total`, so no new counting exists anywhere — the
  mark reads what the record already holds. A kindled place
  can never wear it: kindling needs a total of zero.
- **Shown-day, not today-only.** The ivory ring belongs to
  today alone (it reads a finish DATE); the gold ring reads
  the shown rows themselves, and shown rows are always their
  own day's — so day browsing and the `?day=` deep-link show
  a past day's hundredfold exactly as it stood that day.
- **The ring.** The ivory ring's own construction — a wide,
  faint pass under a narrower, clearer one — in the lights'
  own gold (`#e4b95c`, the country fill's gold; red stays
  kindling's alone), nested OUTSIDE the ivory ring when a
  place has earned both: around a silhouette it is clipped
  to the shape's outside, the mirror of the watch trace's
  inside clip, at doubled widths so the visible band stands
  beyond the border the ivory ring rests on; around a
  centroid light it is a circle beyond the ivory ring's own
  radius. Drawn on the disc and in the closer-look panel,
  just before the ivory rings so the two nest, and STEADY —
  no breathing, no flare. The finest geography carries it,
  as it carries the light and the ivory ring: a subdivision's
  ring steps its country's own ring back. Every text surface
  names it in the same voice: the legend's sixth row, placed
  with the ivory row — a gold double-stroke swatch,
  "Hundredfold — 100 chapters in a day" (one short row, the
  kindled row's own weight — Jason's ask); the place chips
  carry "· hundredfold"; the ring's `<title>`, the figure's
  aria summary, and the closer-look label say it too.
- **The first wearer is Florida, the night it was crowned.**
  Florida crossed the hundred before the build shipped and
  stood at 105 chapters (58 read, 47 heard) at the last live
  check, with a book finished there the same day — so the
  first gold ring stands nested outside an ivory one, and
  the United States' own ring (115) steps back to Florida's,
  as its light already does.
- **Verification (Oct 30, 2026).** `tsc --noEmit` clean,
  ESLint clean on the touched files, production build clean.
  Fixture checks against the compiled display logic pass:
  total 99 wears no ring, 100 and 101 wear it; a kindled row
  (75 opens, no chapters) is not hundredfold; a row with a
  book finished today at 101 chapters satisfies both ring
  decisions at once; the country's ring steps back to its
  subdivision's and stands when no subdivision wears one.
  Production: the served homepage was polled until the new
  build answered — the legend text "Hundredfold — 100
  chapters in a day" is present in the served app (the ring
  rendering ships in the same component, commit, and build;
  the served JS chunk was not separately grepped — the
  sandbox fetch does not surface the chunk references).

## Still knocking — a hundred visits in a day (Oct 30, 2026)

Jason, later that same night, watching the day's counts
climb: "I think 100 visits should get you something too
then maybe not red but what other color is there out there
LOL purple." He asked for one or two words around knocking
or seeking, weighed "Knocking" against "Still Knocking",
and crowned STILL KNOCKING — the friend at midnight in
Luke 11, who received the bread "because of his
persistence": a hundred visits in a day is not one knock;
it is a place that kept coming back. (Philippians 2:3
governs the copy, as with every mark on this map.)

- **The rule.** When a place's SHOWN day brings a hundred
  or more VISITS (opens), the place wears a **soft purple
  glow** for the day. The decisions are pure functions in
  `lib/heartbeat-display.ts` (`stillKnocking`,
  `countryStillKnockingOn`, the threshold named as
  `STILL_KNOCKING_OPENS_THRESHOLD` = 100, beside kindling's
  75 and the hundredfold's 100): the count is the row's
  `opens` and nothing else — visits only, in ANY chapter
  state. A chapter is never a visit and a visit is never a
  chapter; rows already keep the two apart, so no new
  counting exists anywhere — the mark reads what the
  record already holds.
- **Not a ring — a glow.** Rings belong to the Word's own
  feats (ivory for a book finished, gold for a hundred
  chapters); visits are the seeking family, so this sign
  lives in the glow. It is drawn under the lights
  themselves, on the disc and in the closer-look panel:
  the place's shape filled with the purple and passed
  through the map's own soft blur — gold keeps a place's
  inside, purple blooms past its border as a halo — and
  around a centroid light, a blurred purple circle wider
  than the light's own halo. STEADY — no breathing, no
  flare, a kept sign for the day.
- **The purple.** `#a855f7` (rim `#c084fc`), a clear royal
  purple — Lydia's trade in Acts 16, the chapter Jason
  studied that very morning (the door that opened because
  Asia's was shut), and a royal priesthood's color
  (1 Peter 2:9) — and a hue the map spends nowhere else:
  gold belongs to the lights, ivory to the finished book,
  pale blue (#8fd8ff) to the video trace, warm red to
  kindling.
- **It may coexist.** A kindled place (75+ opens, no
  chapters) at a hundred opens wears the red kindling AND
  the purple glow; a hundredfold place at a hundred opens
  wears its gold ring inside the purple glow. Different
  truths, both shown.
- **Shown-day, not today-only.** Like the gold ring, the
  glow reads the shown rows themselves: day browsing and
  the `?day=` deep-link show a past day's glow exactly as
  it stood that day.
- **State by state (as corrected the same night — see
  the amendment at this section's end).** As first
  shipped, the mark followed the rings' pattern: a
  subdivision's glow stepped its country's own glow back,
  and the country's glow stood on its summed count when
  no subdivision wore one. Jason's ruling replaced that
  within the hour: a country WITH recorded subdivisions
  never wears the glow at all — its states wear their
  own, or none — and only a country with no subdivisions
  in the record, a single place, wears it as a country.
  The country helper reads the subdivision rows for mere
  presence, not through the shared helper: that helper
  gathers a country's chapter-carrying divisions, and a
  knocking sign can stand on a division with no chapters
  at all — indeed, that is its likeliest wearer.
- **Every text surface names it in the same voice:** the
  legend's seventh row, standing beside the kindled row —
  the two visit marks together, the seeking family's two
  thresholds (the "Video watched" row moves to the last
  cell to make the pair) — a purple-glow swatch, "Still
  Knocking — 100 visits in a day"; the place chips carry
  "· still knocking" in the purple on the honors line, and
  a chip whose only honor it is takes the two-line form
  like any honored chip; the glow's `<title>`, the figure's
  aria summary, the caption under the disc, and the
  closer-look label say it too.
- **The first wearer — under the as-shipped rule, and
  the correction it caused.** At the last live check
  before this build shipped (9:06 PM ET, Oct 30), the
  United States' row stood at 102 visits for the day —
  the first row ever to reach a hundred — with no state's
  count near it (Florida, the nearest, at 57), so under
  the step-back as first built, the country's own glow
  stood: the nation glowed purple around Florida's gold
  hundredfold ring on the night both signs were born.
  Jason saw it and ruled state by state the same night
  (the amendment below): under the corrected rule that
  aggregate wearing never qualified, and the mark's true
  first wearer is still to come. California, the first
  place ever to kindle, peaked at 78 visits on its
  kindling night (Oct 29) — still knocking, not yet
  through.
- **Verification (Oct 30, 2026).** `tsc --noEmit` clean,
  ESLint clean on the touched files, production build
  clean. Fixture checks against the compiled display logic
  pass: opens 99 wears no glow, 100 wears it; a kindled
  row (100 opens, no chapters) satisfies kindling and
  still knocking at once; a hundredfold row (110 chapters,
  100 opens) satisfies both decisions at once; the
  country's glow steps back to a subdivision's — including
  an opens-only subdivision carrying no chapters — and
  stands when no subdivision wears one. Production: the
  served homepage was polled until the new build answered
  (third poll, inside the expected deploy lag) — the
  legend text "Still Knocking — 100 visits in a day" is
  present in the served app (the glow rendering ships in
  the same component, commit, and build; the served JS
  chunk was not separately grepped — the sandbox fetch
  does not surface the chunk references).
- **Amendment — state by state (Oct 30, 2026, later the
  same night).** Jason, seeing the shipped mark light on
  the United States' own row: "Oh wait I thought we were
  doing state by state" — and ruled it so. The
  correction: `countryStillKnockingOn` no longer steps
  back — a country with recorded subdivisions in the
  shown set never wears the glow at all, on any count,
  and a country with none wears it as the single place
  it is. The chips and every voice surface follow the
  corrected decisions: the United States' chip loses its
  "· still knocking" honor, and the country's titles and
  aria no longer speak the clause on summed visits;
  states keep the possibility on their own counts. The
  rings were NOT touched — kindling, the hundredfold,
  and the ivory ring keep their country step-back
  exactly as built; the stricter rule is the purple
  glow's alone. Production: the served homepage was
  polled until its asset set turned over to the
  correction's build (the legend row stands unchanged,
  as ruled), and the live heartbeat payload run through
  the corrected decisions agrees — the United States'
  row, past a hundred summed visits, earns no glow, and
  no place wears the mark tonight. Under the corrected
  rule the mark has had NO wearer yet: the closest
  approaches on record
  are California's 78 visits on its kindling night
  (Oct 29), and tonight, at the ruling, Florida at 57
  and California at 37 — the United States' summed 104
  stands in the
  record only as the aggregate that caused the ruling,
  never as a wearing. Verification of the correction:
  fixture checks against the compiled display logic
  pass — the United States' aggregate row (104 visits,
  no state at a hundred) earns no glow anywhere; a state
  at a hundred glows; an undivided country at a hundred
  glows; and the kindling, hundredfold, and book-halo
  fixtures from the earlier suites pass unchanged.
  `tsc --noEmit` clean, ESLint clean on the touched
  files, production build clean.
- **A held idea, recorded and NOT built (Oct 30, 2026).**
  Jason floated a deep-purple country tier at a thousand
  total United States visits, and ruled the same night:
  "we'll hold off for the thousand visits that's a bit
  much" — it is not built, and the legend does not carry
  it.
- **The hold lifted — the unsaid deep tier (Oct 30,
  2026, later still, the same night).** Jason returned
  to the idea within the hour and ruled it in, on one
  condition that defines it: "We can give the US a deep
  purple glow when it reaches a thousand visits but it
  doesn't have to go on the legend just unsaid." So the
  tier is built, and this internal book is its only
  record — no public surface names it. **The rule:**
  when a country WITH recorded subdivisions brings a
  thousand or more visits in its shown day — the whole
  country's summed knocks — its light on the disc wears
  a **deep purple glow**, `#7e22ce`, the still-knocking
  royal purple at a distinctly deeper register, drawn
  with the mark's own construction (the shape filled and
  passed through the soft blur, a rim pass over it),
  first among the disc's marks and under every light.
  STEADY, like its lighter sibling. The decisions are
  pure functions beside the others (`countryStill
  KnockingDeepOn`, the threshold named as `STILL_
  KNOCKING_COUNTRY_OPENS_THRESHOLD` = 1000).
  **What it is not:** the state-by-state correction
  stands untouched — a divided country NEVER wears the
  light glow (`#a855f7`) on summed visits, at 104 or at
  999; the deep tier is the only country-level form, and
  it asks ten times the count before it speaks at all.
  An undivided country is a single place and keeps only
  its own hundred-visit mark — a thousand visits there
  deepens nothing. The two glows are independent: on a
  thousand-visit day, a state at its own hundred wears
  the light glow inside the country's deep one, each on
  its own count. **Unsaid, in full:** no legend row (the
  legend still ends its visit marks with kindling and
  still knocking), no chip honor, no `<title>`, no aria,
  no caption — the glow mark itself renders without a
  title element, the only mark on the map with no voice
  at all. It belongs to the disc alone; the closer-look
  panel holds states, not the country. Shown-day, like
  every mark: a browsed past day wears it on that day's
  own thousand, exactly as it stood.
  **No wearer yet, and none close:** the United States'
  summed visits tonight stand near 116–120 — the count
  that caused the state-by-state ruling — a tenth of the
  threshold. The deep glow waits in the code for a day
  no place has come near; when it first stands, this
  book will record it, and nothing on the app will say
  a word.
- **Amendment — within borders (Oct 30, 2026, later
  still, the same night).** Florida became the mark's
  first true wearer under the corrected rule, crossing
  a hundred visits late in the evening (102 at the
  first sighting, 104 an hour on, 134 chapters beside
  them) — and the wearing exposed the rendering twice
  over. First, the glow as built — the state's shape
  filled and blurred under its light — showed NO
  visible purple at all: a small state's soft fringe
  under the map's brightest gold light, with the ivory
  and gold rings resting on its border, washed out
  entirely; Jason could read the honor in Florida's
  chip and see nothing on the map. The first repair
  gave a subdivision's glow a true halo — a soft purple
  disc at the state's centroid, sized to bloom past
  the outermost ring — and the purple stood at last,
  but as a round BLOB: Jason's own phone screenshot
  showed it spilling far past Florida's borders, over
  the Gulf, over the Atlantic, up toward Georgia,
  claiming ground Florida never earned. His ruling,
  in his words: "don't we want the purple inside the
  borders of Florida?" The map's honesty is geographic
  — a mark colors only the place that earned it. So
  the halo is REMOVED the same night, and a
  subdivision's glow is now a WITHIN-BORDERS treatment
  in two parts: the state's own shape filled with the
  purple UNBLURRED at 0.85 in the under-lights layer
  (the body tints, strongest where a light or an ember
  above it is thin), and — the part the eye reads — the
  state's exact border traced in the same purple,
  crisp (no blur), at 0.95, in its own layer ABOVE the
  gold light fills and BELOW the hundredfold and ivory
  rings: 4 units on the disc (about 1.6px at phone
  width), 1.2 units in the closer-look panel (about
  2.7px at phone width, in the family of the ivory
  ring's own clear pass there). Coastline, panhandle,
  peninsula — Florida itself wearing purple, and
  nothing purple outside its line. Countries keep the
  soft bloom exactly as built (a country with no
  subdivisions IS a single place, and the bloom is its
  own shape's softening); the deep tier stands
  untouched. Verification: fixture checks against the
  compiled display logic pass unchanged (23 checks —
  the decisions were never the flaw, only the
  drawing), `tsc --noEmit` clean, ESLint clean on the
  touched file, production build clean. **Ship record:**
  commit `4d1dc1b` is Vercel's live production
  deployment (READY, superseding the halo build
  `5b7dbfd`); the production build of that commit
  carries the border treatment (`withinBorders`,
  `knocking-border`) and no halo code. (The sandbox's
  direct line to the site broke mid-verification —
  TLS errors after the first fetches — so the served
  chunk was confirmed by its deployment and its build
  rather than by a byte-level grep of the served file;
  the pixel proof is the parent's live-browser pass.)
  Florida at ship time, from the live payload (Oct 30,
  10:43 PM ET): 110 visits, 134 chapters (76 read, 58
  heard), a book finished today, 2 watches — still
  knocking TRUE and hundredfold TRUE on its own rows;
  the United States' summed 176 visits earn it no glow
  (state by state) and no deep tier; California stands
  at 51 visits — still knocking, not yet through.
- **Amendment — the inner trace (Oct 30, 2026, the
  third drawing of the mark in one night).** Jason
  looked at the within-borders build on his phone and
  caught it twice more. (1) COLOR: the purple inside
  Florida read pale LAVENDER beside the legend's
  still-knocking swatch. It is the same `#a855f7` in
  the can — but the fill lies UNDER the gold light, and
  the gold washes it; and the centered border line hid
  under the ivory and gold rings resting on the border.
  On screen, they were not the same purple. (2) THE
  IVORY RING: asked whether a top-layer purple line
  would REPLACE the ivory book-finished ring, the
  answer settled with Jason is NO, never — ivory (a
  book finished) and gold (the hundredfold) keep their
  seats OUTSIDE a place's line, and this work does not
  touch the rings' code, geometry, or draw order.
  **The correction:** the centered border line is
  REMOVED, and a subdivision's still-knocking takes
  the INNER-TRACE treatment — the watch trace's own
  grammar (Jason's design: a crisp line just inside
  the place's border, the mark that reads perfectly in
  his screenshot). `StillKnockingTraceMark` strokes
  the state's path clipped to its silhouette, set
  DEEPER by a mask — the mask keeps the shape and
  erases a 6-wide band around the border, so the
  trace's visible bands begin 3 units inside the line:
  a soft pass (stroke 13 at 0.40, visible 3→6.5 in)
  under a core pass (stroke 9 at 0.95, visible 3→4.5
  in — the watch core's own 1.5-unit visible width).
  It is drawn ABOVE the gold light fills, so nothing
  washes over it: the purple on the map IS the legend's
  purple at full strength. The within-borders fill
  (0.85, under the lights) stands as shipped — now
  only the body tint; the trace carries the true
  color. **The two inner traces share no ground:** the
  blue watch trace hugs the border (core 0→1.5 in,
  skirt to 3); the purple stands deeper (core 3→4.5
  in) — where a place has earned both, as Florida has
  tonight, they read as two separate lines. On the
  disc the core reads ~0.6px at phone width and in the
  closer-look panel ~3.7px — the blue trace's own
  measure on each surface, since the trace keeps the
  watch family's unit widths on both. Countries and
  the deep tier stand untouched. Verification: fixture
  checks against the compiled display logic pass
  unchanged (23 checks — the decisions were never the
  flaw, only the drawing, a third time), `tsc
  --noEmit` clean, ESLint clean on the touched file,
  production build clean. Florida at verification,
  from the live payload (Oct 30, 10:53 PM ET): 115
  visits, 134 chapters (76 read, 58 heard), a book
  finished today, 2 watches — still knocking TRUE,
  hundredfold TRUE, the ivory ring owed, and BOTH
  inner traces owed (blue for the watches, purple for
  the knocking); the United States' summed 184 visits
  earn it no light glow (state by state) and no deep
  tier; California stands at 53 visits — still
  knocking, not yet through. (The ship record for
  this amendment follows in the commit itself.)
- **Amendment — the frame (Oct 30, 2026, the
  fourth drawing of the mark in one night).** The
  inner trace shipped; the parent's live-browser
  pass found its color true — saturated violet, the
  legend's own — its spill gone and the rings
  untouched. Then Jason looked on his PHONE (a
  390px-class Android) and ruled once more: "it's
  pretty pale still." His eye is the final grade,
  and the browser checks had passed too easily:
  they render wider than his screen, and at his
  width the third drawing's whole true-color core
  was 1.5 units — ~3.5px in the panel, next to
  nothing on the disc — while the state's body is
  dominated by the pale fill lying under the gold.
  **The correction is phone-first:**
  `StillKnockingTraceMark` is now a FRAME inside
  the border. The mask is unchanged — the visible
  band still begins 3 units inside the line, and
  the seats are unchanged: the blue watch trace
  keeps 0→1.5 in, the ivory and gold rings keep
  the outside, and the frame is drawn above the
  gold fills, so nothing washes over it. A
  shoulder pass (stroke 14 at 0.55, visible 3→7
  in) under a core pass (stroke 12 at 1.0 — full
  strength, no step down — visible 3→6 in): THREE
  units of `#a855f7` at full strength, exactly
  double the third drawing's core, then one unit
  of the shoulder's moderate violet (6→7 in)
  grading into the gold body. The whole visible
  band is 4 units — on a phone in the closer-look
  panel (157 units across ~370px, ~2.36px a unit)
  ~9–10px, ~7px of it true purple; on the disc
  (1000 units across the same width) ~1.5px,
  where the mark stays small by design: the panel
  is where this honor lives. THE PENINSULA,
  honestly: at ~8–10 units wide, each coast's
  frame — 3 masked units plus 4 of band — reaches
  past the middle, so the two frames MEET: the
  peninsula wears graded purple across its whole
  width, the full-strength cores joining at its
  center as a violet spine of TRUE color rather
  than the pale stripe of the third drawing; the
  panhandle is wide enough to keep a true frame
  with gold inside it. The within-borders fill
  stands as shipped (0.85, the body tint under the
  gold); the frame carries the color. Countries
  and the deep tier stand untouched. Verification:
  fixture checks against the compiled display
  logic pass unchanged (23 — the decisions were
  never the flaw, only the drawing, a fourth
  time), `tsc --noEmit` clean, ESLint clean on the
  touched file, production build clean. Florida
  at ship time, from the live payload (Oct 30,
  11:22 PM ET): 122 visits, 143 chapters (81 read,
  62 heard), a book finished today, 2 watches —
  still knocking TRUE, hundredfold TRUE, the ivory
  ring owed, and both inner traces owed; the
  United States' summed 194 visits earn it no
  light glow (state by state) and no deep tier;
  California stands at 55 visits — still knocking,
  not yet through. The phone verdict belongs to
  Jason's screenshot, as every drawing of this
  mark has ended: the geometry he should see is a
  true-purple frame ~9–10px wide inside Florida's
  border in the panel, the blue line outside it,
  the gold heart inside it, the rings outside the
  state untouched. (The ship record for this
  amendment follows in the commit itself.)

## Amendment — the day learns to count its books (Oct 31, 2026)
Jason finished a second book in a day (Acts, after one that morning) and found the app had nowhere that said "two books today": the store counted whole books per place per day all along, but the payload's day objects carried no book count and the honor chip only ever said "book finished." The telling was missing, not the counting. Now: each place row carries `books` (its finishes in the shown day), each day object (today + history) carries `booksFinished` (summed over country rows only — a beat increments country and subdivision both; subdivisions break the same finishes down, never add), and the honor chip counts: "· 2 books finished" when a place finishes more than one in a day. The ivory ring is unchanged.
