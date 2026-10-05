# Word of God Risen

A beautiful Bible reader with a unique feel — built as an extension of the
[TruVINE](https://www.youtube.com/@TruVINE365) faith community.

> "Thy word is a lamp unto my feet, and a light unto my path." — Psalm 119:105

## Features

- **Verse-by-verse reader** — full chapters parsed into numbered verses with
  gold verse numbers, in a calm reading view
- **Cross-references** — verses that echo other Scriptures carry a ✦ marker;
  tap it to open the referenced passages (10,000 verses, ~96k references from
  the Treasury of Scripture Knowledge)
- **Reading progress** — mark chapters as read, watch your progress grow per
  book, and pick up where you left off
- **Lamp / Night modes** — warm parchment glow or the deep vineyard dark
- **Full-text search** — across all 613 chapters
- **Verse of the day** — a fresh verse every day
- **Overview videos** — a BibleProject explainer for every book

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19 + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- Chapter content from JSON data files; progress persisted in `localStorage`
- Passage text via [bible-api.com](https://bible-api.com)

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
app/                  # Routes: home, book pages, chapter reader, search, about
components/           # UI: reader, cross-ref panel, progress, cards, widgets
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
- Overview videos by [BibleProject](https://bibleproject.com).

## Deploy

Designed for [Vercel](https://vercel.com): import the repo, keep every
setting on its default — framework detection and the build handle the rest.
