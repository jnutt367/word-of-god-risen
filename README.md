# Word of God Risen

A production Bible reader and study app — built as an extension of the
[TruVINE](https://www.youtube.com/@TruVINE365) faith community.

**Live:** [word-of-god-risen.vercel.app](https://word-of-god-risen.vercel.app/)

> "Thy word is a lamp unto my feet, and a light unto my path." — Psalm 119:105

**Designed, built, and maintained solo by Jason Nutt** — software developer and
founder of TruVINE — this is a real product in daily use, not a tutorial
project: **78 books · two translations (WEB + KJV) · a complete 1,503-chapter
audio Bible · ~96,000 cross-references · reading plans · full-text search**,
with no login and no friction — just the Word.

## Features

- **Verse-by-verse reader** — full chapters parsed into numbered verses with
  gold verse numbers, in a calm reading view, in the World English Bible (WEB)
  and the King James Version (KJV)
- **Complete audio Bible** — all 1,503 chapters narrated in one warm
  grandfatherly voice ("Grandpa Teddy"), volume-normalized to a −16 LUFS
  delivery standard, organized per book alongside Teddy-narrated overview
  videos produced with each release
- **Cross-references** — verses that echo other Scriptures carry a ✦ marker;
  tap it to open the referenced passages (~96,000 references across 10,000
  verses, from the Treasury of Scripture Knowledge)
- **Full-text search** — across every chapter in the library, powered by a
  search index generated at build time by a `prebuild` script
- **Reading plans** — curated plans (Walk with Jesus, the Gospels in 30
  days, Genesis, Acts & Romans) with day-by-day checklists; finishing a
  day marks its chapters read
- **Reading progress** — mark chapters as read, watch your progress grow per
  book, and pick up where you left off (persisted in `localStorage`)
- **Ask Teddy** — a friendly on-site guide who helps visitors find books,
  plans, and features, and passes feature requests back to the builders
- **Parables & Shorts** — the TruVINE Farm Family Parables and Scripture
  Shorts live inside the app, tying the YouTube channel and the reader
  together
- **Verse of the day** — a fresh verse every day
- **Lamp / Night modes** — warm parchment glow or the deep vineyard dark
- **Accessibility as a standing rule** — descriptive alt text on imagery,
  aria-labels on icon-only controls, visible keyboard focus, and contrast
  checked in both themes

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19 + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- Chapter content from JSON data files; progress persisted in `localStorage`
- Passage text via [bible-api.com](https://bible-api.com)
- Deployed on [Vercel](https://vercel.com) with analytics enabled and Google
  Search Console verified

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The search index (`public/search-index.json`) is generated automatically by
the `prebuild` script from the chapter data.

## Project structure

```
app/                  # Routes: home, book/chapter reader, search, plans,
                      # parables, shorts, characters, milestones, about
components/           # UI: reader, cross-ref panel, progress, cards, Ask Teddy
lib/                  # Verse parser, progress store, data loading, cross-refs
data/
  books.ts            # Book catalog (generated from content, checked in)
  chapters/           # Chapter text per book (*_data.json)
  cross-refs.json     # Verse cross-reference map (TSK via openbible.info)
scripts/              # Build-time search index generator
public/images/        # Chapter artwork and covers
```

## Content notes

- Scripture text is presented for reading and study.
- Cross-reference data derives from the Treasury of Scripture Knowledge via
  [openbible.info](https://www.openbible.info) (CC-BY). Attribution is shown
  in the site footer.
- Overview videos and chapter narration are TruVINE's own productions,
  released book by book alongside the audio.

## Deploy

Designed for [Vercel](https://vercel.com): import the repo, keep every
setting on its default — framework detection and the build handle the rest.
