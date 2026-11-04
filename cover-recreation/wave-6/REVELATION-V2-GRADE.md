# Revelation v2 — Grade

**Status: FAIL — NOT BUILT (tool-level failure; no image returned).**

- **Authorization:** Exactly 1 image generation, Jason's chosen replacement concept (Nov 3, 2026).
- **Generations fired:** 1.
- **Retakes:** 0. Per the spend discipline, the failed call was not re-rolled.
- **Seed verified before firing:** `cover-recreation/cast-nt-ahead/john-aged.png` exists and was used as the crowned aged-John identity reference.
- **Intended output:** `cover-recreation/wave-6/cover-revelation-v2.webp`.
- **Actual output:** No `cover-revelation-v2.webp` image exists. The only artifact is the generation sidecar `media-generation-cover-revelation-v2-1793764380.json`, which records `integrity_check_failed` and contains no attachments.
- **Visual grade:** Not possible — no image was produced, so John's likeness, kneeling posture, the descending-city read, period truth, and crop safety could not be graded. No face-zoom sheet was made.
- **Concept briefed:** Aged John kneeling on a great high mountain, face in open three-quarter view, watching the New Jerusalem descend in glory-light (Revelation 21:2, 10); no Jesus figure, no Father figure, no angels, no modern skyline or objects, no text.
- **Other actions:** `wave-6/GRADE.md` was not edited. No composites, card crops, swaps, or commits were made.

A new attempt requires Jason's fresh word at a stated count of 1.

---

## REROLL — Jason's fresh word (Nov 3, 2026: "reroll")

**Status: PASS — crown candidate, with watches named.**

- **Authorization:** Exactly 1 generation (Jason's fresh word after the first attempt's refusal). **Generations fired: 1. Retakes: 0.**
- **Register change:** the brief was reframed in the house wonder/majesty register (dawn, awe, glory, descending light; no peril/judgment vocabulary) — the call landed first try.
- **Seed:** crowned `cast-nt-ahead/john-aged.png` verified on disk and used as the identity reference.
- **Output:** `cover-recreation/wave-6/cover-revelation-v2.webp` (2048×1152, already true 16:9), saved from the returned raw (media-generation-cover-revelation-v2-0-605df390….webp). Evidence sheets: `revelation-v2-face-zoom.png` (seed vs cover side-by-side), `revelation-v2-city-zoom.png`, `revelation-v2-citytop-zoom.png`.
- **Likeness (face zoom):** the same man as the crowned portrait — long flowing silver-white wavy hair, full white beard and mustache, the green-hazel eye lit in three-quarter view, brow and forehead structure carried, upturned in open-mouthed wonder. A card crop on his face is clean and large. Mild watch: the cover face is a touch smoother and rosier-cheeked than the deeply lined portrait — the same softening the 1/2/3 John covers show.
- **Scene truth:** John kneels on both knees on a rocky mountaintop, hands open in worship, robe pooled naturally — posture physically plausible. The radiant city descends through golden cloud with glory-light streaming beneath it and sparkles cascading toward the green valley below; it reads as arriving in glory, not a parked skyline. NO Jesus figure, NO Father figure. No text anywhere in the frame (checked at zoom). No modern object in any sightline — valley is hills, river, olives; the mountain is rock and scrub.
- **WATCH 1 (the one for Jason's eye):** inside the glowing city, at speck scale, a few tiny dark upright silhouettes stand on a gate terrace and on the steps below a gate (see `revelation-v2-city-zoom.png`). They claim nobody — no faces, no wings, no identity — and read as distant inhabitants/statues of the city at postcard scale, in the family of the unclaimed hillside company on the Jude cover. But the concept brief said no figures in the light, so they are named here rather than passed silently; Jason's eye rules.
- **WATCH 2 (style):** the city's architecture leans medieval-castle/cathedral in its towers and arches rather than ancient Near Eastern, and the landscape/city rendering is more painterly than the Pixar-clean John (the same mix as the Revelation v1 plate). Nothing modern, no domes, no sci-fi crystal — the all-golden-light treatment carries it as a heavenly city.
- **Other actions:** `wave-6/GRADE.md` was NOT edited. No composites, no card crop, no swap, no commit. Jason crowns before any install.
---

## CROWN + INSTALL — REVELATION (Nov 3, 2026)

**Jason's batch crown** (Nov 3, 2026, ~23:15 EST — "Crown all 13 — install them tonight") covered this book. The crown settles the book's named watches **as-is** — recorded in `cover-recreation/REVISIT-NOTES.md` (kept so any watch can be revisited and changed later; a crown means "installed with this known," never "forgotten"). Install followed the Luke/batch shape exactly (ZERO generations — crop + composite + repoint only), in the batch install commit `67c884d`, pushed.

- **Cover:** `public/images/cover-revelation-city.jpg` (1280×720; the v2 raw is already true 16:9 (2048×1152) — full frame resized to 1280×720, no band crop). The REAL TruVINE emblem master (`truvine-emblem-cleaned-transparent.png`) composited whole at true proportions, 104×74 at (26, 22), clear of every face.
- **Chapter card:** `public/images/revelation-city-card.png` (512×512) — crop from the same raw at (1260, 80)–(1780, 600): **John's face (v2's only face — NOT v1's Patmos frame)**.
- **Repoints:** `data/books.ts` → `/images/cover-revelation-city.jpg`; all 22 chapters in BOTH `data/chapters/revelation_data.json` and `data/chapters/revelation_kjv_data.json` → `images/revelation-city-card.png` (44 chapter entries). The old cover file (`public/images/cover-revelation.jpg`) **stays on disk** — replaced as the live pointer, not deleted; a grep of `data/` confirms no live reference to it remains.
- **Build:** `npm run build` (one full build for the whole 13-book batch) — ✓ Compiled successfully, TypeScript finished clean, all 148 static pages generated (the sandbox-only dynamic-font download warning appeared; pre-existing, unrelated).
- **Served verification (byte-identical, Romans/Acts/Luke standard):**
  - Live cover MD5 `bb044a181733cbde9697c69a6c92ef63` == installed ✅
  - Live card MD5 `d83fc6cf686d435271407967a86beb9d` == installed ✅
  - Live `/book/revelation` page references `cover-revelation-city.jpg` ✅
