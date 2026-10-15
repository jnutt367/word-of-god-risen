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

## Why not real-time counters in a database

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

## Accessibility & motion

- The figure (world map + vine, v2) is a labelled figure (`role="img"`
  + a plain-language summary that names any lit countries and their
  counts); every number also exists as text, and the country list
  repeats the map's meaning in plain words beside it.
- The only motion is the lights' slow opacity breath
  (`.hb-glow` in `app/globals.css`), fully disabled under
  `prefers-reduced-motion: reduce`.
- Colors come from the existing vineyard/gold/sage palette; tile text
  pairs cream on vineyard-950 for contrast in both site themes.
