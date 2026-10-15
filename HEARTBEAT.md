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
- **Country garland:** the component renders it **only** when the
  snapshot carries a `countries` array with an honest source label.
  The app cannot see its own analytics geography at runtime, so the
  garland stays dark until a roll-up supplies verified geography
  (e.g. Vercel Analytics visitor countries) — it is never guessed.
- **Recent-chapters river:** same rule — rendered only when the roll-up
  supplies aggregate recent rows (book + chapter + kind + day, no
  identity). Currently dark for the same reason: event detail rows live
  in the Analytics dashboard, not in an export the roll-up can read yet.

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

- The vine SVG is a labelled figure (`role="img"` + a plain-language
  summary); every number also exists as text.
- The only motion is the fruit lights' slow opacity breath
  (`.hb-glow` in `app/globals.css`), fully disabled under
  `prefers-reduced-motion: reduce`.
- Colors come from the existing vineyard/gold/sage palette; tile text
  pairs cream on vineyard-950 for contrast in both site themes.
