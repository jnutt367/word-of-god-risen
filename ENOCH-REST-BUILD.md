# ENOCH-REST-BUILD.md — The Rest of 1 Enoch (Chapters 37–108), Text Build

**Date:** Monday, November 16, 2026
**Commission:** Jason, Nov 16, 2026 — after finishing the app's Enoch 36 (Book of the Watchers): "start with the rest of Enoch in order."
**Phase scope:** TEXT ONLY. No audio was generated or touched (TTS backend contaminated; Teddy audio for 37–108 phases in later under separate cover).

## What landed

- **Chapters 37–108 (72 chapters)** appended in order to `data/chapters/enoch-1_data.json`, after chapter 36:
  - The Parables (Second Book): 37–71
  - The Book of the Heavenly Luminaries: 72–82
  - The Dream Visions: 83–90
  - The Epistle of Enoch: 91–108
- **Translation:** R. H. Charles (1917, *The Apocrypha and Pseudepigrapha of the Old Testament*, SPCK/Clarendon) — the same translation and text stream as chapters 1–36.
- **Word count:** 29,374 words added; the complete book is now **37,046 words** across 108 chapters.
- **Schema:** identical to the existing 36 — `{title, image: "images/enoch.png", description (one line, verse numbers inline), link: "#"}`. Titles follow the app's established style ("Chapter <ROMAN>: <short phrase from the chapter's own words>").

## Sources and method

Two independent renderings of the Charles text were fetched and reconciled chapter by chapter before assembly:

- **Primary:** godrules.net (Charles, APOT) — cleaner text, fuller verse numbering.
- **Cross-check:** sermonindex.net full text — the same lineage the app's first 36 chapters were built from (calibration: app ch 1 matches it exactly, including its quirks).

Where the witnesses disagreed on a verse number's presence, the fuller witness won. Where both agreed — including a missing number — the text was left exactly as the received stream has it (the app's own chs 1–36 carry the same class of quirks).

## Editorial cleanliness (Jason's Nov 16 ruling)

Applied to all 72 chapters:

- **Cross-reference injections stripped** — the check source carries injected refs (e.g. "Isaiah 3:1-26", "Son_2:1-17", "Hebrews") standing where a plain word belongs; all removed, the plain word restored ("is").
- **Section/chapter headings excluded** — including "A Fragment of the Book of Noah" (ch 60's heading and ch 106's section title).
- **Editorial note removed** — ch 71's bracketed "[Lost passage wherein the Son of Man was described…]" is Charles describing missing text, not text; removed whole. The verse numbering jump 12 → 14 is kept.
- **Sub-verse letter tokens stripped whole** (digit+letter and lone subdivision letters, per the Nov 16 ch 5 precedent): ch 39 (6a, 7a, 6b, 7b), ch 51 (5a, 5b, c, d — printed transposed verse order kept), ch 89 (48b), ch 91 (14d, 14a, b, c), ch 97 (9c, 9d).
- **Bracketed restorations kept**, following the precedent of chs 1–36. One repair: ch 47 v2's bracket "[and praise," is unclosed in both witnesses; closed after "Lord of Spirits".
- **Table-set poetry rejoined** into flowing prose (notably ch 39).

## The Epistle dislocation (chs 91–93) — reassembled

Charles prints the Epistle in manuscript order: ch 92 first, then 91:1–10, a bracketed passage (91:11), 91:18–19, then 93:1–10 with a bracketed passage (93:11–14), then 91:12–17, then ch 94 onward. The app chapters are assembled logically:

- **Ch 91** = 91:1–10 + the bracketed v11 passage (brackets kept, unnumbered) + 91:12–17 (printed text order kept: 12, 13, 14d part, 14a part, 15, 16, 17; letter tokens stripped) + 91:18–19. V5 includes the clause "And all unrighteousness come to an end:" (present in the cross-check; the primary drops it).
- **Ch 92** = 92:1–5.
- **Ch 93** = 93:1–10 + the bracketed vv 11–14 passage (brackets kept).

## Glyph corrections toward the printed Charles text (complete list)

Stream-wide OCR corruptions, corrected and counted here — wording otherwise untouched:

- ch 49 v1 and ch 52 v1: printed "l" → "1"
- ch 67 v3: "sed" → "seed"
- ch 72 v7: "cast" → "east" (in "[those six portals in the east]")
- ch 74: "21,832" → "2,832" (arithmetic of the passage: 1,062 + 1,770 = 2,832); stray "17" removed from "all the days she falls behind in 8 years are 80"; a truncated "5" inside the v14 bracket removed; truncated "6" in "the days 16 in 8 years" completed to "16"
- ch 78: stray "s" removed ("it is transferred"); truncated waning-passage numbers completed: "5 light" → "15 light", "6 portal" → "16 portal"
- ch 90: "beer folded up" → "been folded up"
- ch 100 v9: "as wrought" → "has wrought"
- ch 102 v3: "commandst" → "commands"
- ch 103 v14: "And are complained" → "And we complained"
- ch 106: pronoun OCR "1" → "I" (two places)
- ch 108 v14: stray comma removed ("who were born in darkness")

## Verse numbers absent in BOTH witnesses (left as received — complete list)

39:11 · 51:5 (lettered parts only) · 54:5 · 60:24 (v23 ends with the printed ". . .") · 61:11 · 63:9 (numbering jumps 8 → 10) · 65:5 · 69:15 · 71:13 (jump 12 → 14) and 71:17 · 72:11, 19, 36 · 73:2–5 · 74:13, 14, 15, 17 · 76:11, 13, 14 · 78:5, 11, 14, 17, 18 · 85:3 (printed "1,2" combined) · 89:7, 11, 14, 15, 17, 54 · 90:12–18 (both witnesses flow 11 → 19 with identical wording — this is the received text, not a gap) · 91:11 (bracketed passage) and 91:14 (lettered parts only) · 93:5 · 98:14 · 104:5 · 106:13, 14, 15, 17, 18, 19 (the tail runs unnumbered except v16 in both witnesses) · 108:3, 4, 9.

Restored from the fuller witness where the other dropped them: 46:7's opening (cross-check), 48:9, 60:19, 62:5, 69:14 and 69:19 (kept intact), 82:11, 15, 17 (inserted at their verse starts — both fetched renders dropped them), 106:8.

## Surfaces updated

| Surface | Change |
|---|---|
| `data/chapters/enoch-1_data.json` | 36 → 108 chapters (72 appended) |
| `data/books.ts` | `enoch-1` entry: `chapters: 36` → `108` (BookCard display/progress, SearchClient bounds, ReaderView total, PickupBand all read this or the data) |
| `scripts/build-plans.mjs` | Enoch plan def: days 18 → 54, tagline "54 days · 2 chapters a day", description "…complete in fifty-four days." Plan **id kept as `enoch-18`** so existing user progress and links survive — see Open Items |
| `data/plans.json` | Regenerated: only the Enoch plan changed — 54 days / 108 chapters, day 54 = Enoch 107–108 |
| `public/search-index.json` | Regenerated: 1,508 → 1,580 entries (+72, all Enoch); every non-Enoch entry identical |

Chapter loading (`lib/bible.ts getChapters`) and `app/sitemap.ts` are data-driven and needed no change. `public/audio-manifest.json` unchanged (no audio this phase).

## Verification (all performed on the built result)

- Total chapters = **108**; JSON parses.
- **Chapters 1–36 byte-identical:** the merged file was built by appending to the original bytes; the original prefix is byte-for-byte unchanged (pre-change MD5 of the data file: `b78a4e6bf9515cb50f84d33397d81c6f`; parsed first-36 comparison also equal).
- Spot-checks against source by the builder: ch 1 (calibration), **37, 72, 83, 91** (first chapter of each of the five books) and **108** — openings, the ch 91 reassembly joints, ch 93's bracket close, and ch 108's final sentence all match the reconciled text. Additional checks: ch 46 v7, ch 51 order, ch 60 vv 19/25, ch 89 vv 62–63, ch 98 vv 12–16.
- Junk scan over all 72 new chapters: **zero** hits for cross-reference patterns (`Book N:N-N`, `Son_`), lettered sub-verse tokens (`\d+[a-z]`), "commandst", "beer", "21,832", standalone "sed", the ch 71 lost-passage note, and the Noah-fragment heading. No newlines or double spaces in any description.
- `npm run build` **passes**; the built sitemap contains exactly **108** `enoch-1/<n>` chapter URLs and the book page contains Chapter CVIII.

## Push status

Pushed via the GitHub connector snapshot route (`push_files`) to `jnutt367/word-of-god-risen`, branch `main`, as a single commit on top of remote head `9f91154c8bb15a3920aa26868a16430e7d27481c` (the Nov 16 Enoch restoration). Snapshot discipline followed: before pushing, the remote content of all five existing files at head was fetched and compared byte-for-byte against the pre-change local files — all matched exactly (zero divergence), and `ENOCH-REST-BUILD.md` was confirmed absent remotely. Files in the commit: `data/chapters/enoch-1_data.json`, `data/books.ts`, `scripts/build-plans.mjs`, `data/plans.json`, `public/search-index.json`, `ENOCH-REST-BUILD.md`. The resulting commit SHA is recorded in the adjacent sync record (`~/workspace/word-of-god-risen.muse-github-snapshot-sync.json`) and in the build handoff.

## Open items

- **Plan id wart:** the reading-plan id remains `enoch-18` although the plan is now 54 days. Renaming the id would orphan existing user progress keyed to it; the visible tagline/description are truthful. Rename only with a progress-migration plan.
- **Audio:** none exists for chs 37–108. When the TTS backend is clean, Teddy audio phases in chapter by chapter under separate cover (the Nov 16 Enoch delegation), and `public/audio-manifest.json` updates then.
- **Next in Jason's order (after 1 Enoch is whole):** 2 Enoch and 3 Enoch as their own books — not started.
