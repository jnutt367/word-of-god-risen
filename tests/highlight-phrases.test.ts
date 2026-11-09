/* Storage round-trip tests for word-exact (phrase) highlights —
 * run with tsx in a jsdom window. Covers: phrase save/reload,
 * mixed whole-verse + phrase stores, remove, clear-all, upsert
 * recolor (no twin stacking), the old flat-map shape migrating
 * with every mark intact, and the re-anchor law (phraseMarksFor
 * paints only on an exact version + words match). */
import { JSDOM } from "jsdom";
import {
  loadHighlights,
  saveHighlights,
  upsertPhrase,
  phraseMarkId,
  phraseMarksFor,
  type HighlightStore,
  type PhraseHighlight,
} from "../lib/highlights";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});
(globalThis as unknown as { window: unknown }).window = dom.window;

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  PASS ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}`);
  }
}

const KEY = "mark::5::42";
const VERSE = "They all ate and were filled.";
const phrase: PhraseHighlight = {
  key: KEY,
  color: "gold",
  at: 111,
  version: "web",
  start: 9,
  end: 12,
  text: "ate",
};

// 1. Phrase save → reload round-trip.
const store1: HighlightStore = {
  verses: { [KEY]: { color: "rose", at: 100 } },
  phrases: [phrase],
};
saveHighlights(store1);
const back1 = loadHighlights();
check("whole-verse mark survives beside phrases", back1.verses[KEY]?.color === "rose");
check("phrase survives the round-trip", back1.phrases.length === 1);
check(
  "phrase fields intact",
  back1.phrases[0].version === "web" &&
    back1.phrases[0].start === 9 &&
    back1.phrases[0].end === 12 &&
    back1.phrases[0].text === "ate" &&
    back1.phrases[0].color === "gold" &&
    back1.phrases[0].at === 111
);

// 2. Remove one phrase, keep the verse mark.
saveHighlights({ verses: back1.verses, phrases: [] });
const back2 = loadHighlights();
check("remove empties phrases only", back2.phrases.length === 0 && !!back2.verses[KEY]);

// 3. Clear-all clears both kinds.
saveHighlights({ verses: {}, phrases: [] });
const back3 = loadHighlights();
check("clear-all leaves an empty store", Object.keys(back3.verses).length === 0 && back3.phrases.length === 0);

// 4. Upsert: same span re-marked recolors in place, never stacks.
const once = upsertPhrase([], phrase);
const twice = upsertPhrase(once, { ...phrase, color: "blue" });
check("upsert adds once", once.length === 1);
check("upsert re-mark recolors without stacking", twice.length === 1 && twice[0].color === "blue");
check("phrase id is stable per span+version", phraseMarkId(phrase) === phraseMarkId(phrase));

// 5. The first night's flat map still loads — every mark intact.
window.localStorage.setItem(
  "wogr_highlights_v1",
  JSON.stringify({ [KEY]: { color: "green", at: 7 }, "john::0::16": { color: "gold", at: 8 } })
);
const migrated = loadHighlights();
check("old flat map: both verse marks kept", Object.keys(migrated.verses).length === 2);
check("old flat map: phrases start empty", migrated.phrases.length === 0);
check("old flat map: colors kept", migrated.verses[KEY].color === "green");

// 6. Corrupt phrase entries are dropped, never crash the load.
window.localStorage.setItem(
  "wogr_highlights_v1",
  JSON.stringify({
    verses: {},
    phrases: [
      phrase,
      { key: KEY, version: "web", start: 5, end: 5, text: "x" }, // empty span
      { key: "bogus", version: "web", start: 0, end: 2, text: "Th" }, // bad key
      { key: KEY, version: "web", start: 0, end: 2 }, // no text
      "garbage",
    ],
  })
);
const healed = loadHighlights();
check("corrupt phrases dropped, the good one kept", healed.phrases.length === 1 && healed.phrases[0].text === "ate");

// 7. The re-anchor law.
check(
  "paints in its own version over its own words",
  phraseMarksFor([phrase], KEY, "web", VERSE).length === 1
);
check(
  "does NOT paint in another version",
  phraseMarksFor([phrase], KEY, "kjv", "They did all eat, and were filled.").length === 0
);
check(
  "does NOT paint when the words at the offsets differ",
  phraseMarksFor([phrase], KEY, "web", "They all sat and were filled.").length === 0
);
check(
  "does NOT paint on a different verse",
  phraseMarksFor([phrase], "mark::5::43", "web", VERSE).length === 0
);

console.log(`\nphrase storage: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
