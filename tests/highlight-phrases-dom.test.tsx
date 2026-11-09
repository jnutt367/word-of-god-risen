/* DOM-level test for word-exact highlighting, with the REAL
 * compiled components under jsdom: ProgressProvider +
 * VerseTextWithSelection + VerseText.
 *
 * Proves: a native selection inside a verse raises the chip;
 * choosing gold paints ONLY the selected words (a
 * [data-phrase-mark] span wraps exactly "ate", nothing else);
 * the mark survives unmount + remount in the same version;
 * switching to a different version's wording paints NOTHING;
 * and the shipped whole-verse tap still toggles exactly as
 * before. The one piece jsdom cannot do is geometry —
 * Range.getBoundingClientRect is stubbed to a fixed rect; the
 * clamp math itself is three lines and parent-verified visually. */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { ProgressProvider } from "../components/ProgressProvider";
import VerseText from "../components/VerseText";
import VerseTextWithSelection from "../components/VerseTextWithSelection";
import type { Verse } from "../lib/verses";

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

const WEB_TEXT = "They all ate and were filled.";
const KJV_TEXT = "They did all eat, and were filled.";
const verses: Verse[] = [{ n: 42, text: WEB_TEXT }];

function Reader({ version, text }: { version: string; text: string }) {
  return (
    <ProgressProvider>
      <VerseTextWithSelection slug="mark" chapterIdx={5} version={version}>
        <VerseText
          verses={[{ n: 42, text }]}
          bookTitle="Mark"
          chapterNum={6}
          crossRefs={{}}
          onOpenRefs={() => {}}
          slug="mark"
          chapterIdx={5}
          version={version}
        />
      </VerseTextWithSelection>
    </ProgressProvider>
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const render = async (el: React.ReactElement) => {
    await act(async () => {
      root.render(el);
    });
  };

  await render(<Reader version="web" text={WEB_TEXT} />);
  await sleep(30);

  const verseSpan = container.querySelector<HTMLElement>("[data-verse-text]");
  check("verse renders", !!verseSpan && verseSpan.textContent === WEB_TEXT);
  check("no phrase paint before any mark", !container.querySelector("[data-phrase-mark]"));

  // Select "ate" (chars 9..12) with the platform selection.
  const textNode = verseSpan!.firstChild as Text;
  const range = document.createRange();
  range.setStart(textNode, 9);
  range.setEnd(textNode, 12);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
  document.dispatchEvent(new window.Event("selectionchange"));
  await sleep(250); // the chip waits 120ms for the selection to settle

  const chip = container.querySelector<HTMLElement>('[role="dialog"]');
  check("selection raises the mark chip", !!chip);
  check(
    "chip names the selected words",
    !!chip && (chip.textContent ?? "").includes("ate")
  );

  const goldBtn = chip?.querySelector<HTMLButtonElement>(
    'button[aria-label*="gold"]'
  );
  check("chip offers the gold dot", !!goldBtn);
  await act(async () => {
    goldBtn!.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  });
  await sleep(30);

  const painted = container.querySelector<HTMLElement>("[data-phrase-mark]");
  check("chosen words are painted", !!painted);
  check("paint covers EXACTLY the selected words", painted?.textContent === "ate");
  const restSpan = container.querySelector<HTMLElement>("[data-verse-text]");
  check(
    "the verse itself carries no whole-verse wash from a phrase mark",
    !!restSpan && restSpan.style.backgroundColor === "transparent"
  );
  const stored = JSON.parse(
    window.localStorage.getItem("wogr_highlights_v1") || "{}"
  );
  check(
    "mark stored with version + offsets + text",
    Array.isArray(stored.phrases) &&
      stored.phrases.length === 1 &&
      stored.phrases[0].version === "web" &&
      stored.phrases[0].start === 9 &&
      stored.phrases[0].end === 12 &&
      stored.phrases[0].text === "ate"
  );

  // Remount in the same version: the paint is restored.
  await act(async () => {
    root.unmount();
  });
  const container2 = document.createElement("div");
  document.body.appendChild(container2);
  const root2 = createRoot(container2);
  await act(async () => {
    root2.render(<Reader version="web" text={WEB_TEXT} />);
  });
  await sleep(30);
  const restored = container2.querySelector<HTMLElement>("[data-phrase-mark]");
  check("remount restores the paint on the same words", restored?.textContent === "ate");

  // Same store, different version's wording: NO paint, silently.
  await act(async () => {
    root2.render(<Reader version="kjv" text={KJV_TEXT} />);
  });
  await sleep(30);
  check(
    "different version paints nothing",
    !container2.querySelector("[data-phrase-mark]")
  );

  // The shipped tap still toggles the whole verse.
  const tapSpan = container2.querySelector<HTMLElement>("[data-verse-text]");
  await act(async () => {
    tapSpan!.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  });
  await sleep(30);
  check(
    "tap still toggles the whole-verse mark on",
    tapSpan!.style.backgroundColor !== "transparent" &&
      tapSpan!.style.backgroundColor !== ""
  );
  const stored2 = JSON.parse(
    window.localStorage.getItem("wogr_highlights_v1") || "{}"
  );
  check(
    "whole-verse mark stored beside the phrase mark",
    !!stored2.verses?.["mark::5::42"] && stored2.phrases.length === 1
  );

  console.log(`\nphrase DOM: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
