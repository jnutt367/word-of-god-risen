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
