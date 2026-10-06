/* Builds data/plans.json — curated reading plans generated from the
 * chapter data. Only chapters with real verse content ("readable") are
 * included; progress notes and fragments are skipped automatically.
 * Run via the `prebuild` npm script; the output is checked into git.
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const chaptersDir = path.join(root, "data", "chapters");
const outFile = path.join(root, "data", "plans.json");

const BOOK_TITLES = {
  genesis: "Genesis",
  exodus: "Exodus",
  matthew: "Matthew",
  mark: "Mark",
  luke: "Luke",
  john: "John",
  acts: "Acts",
  romans: "Romans",
};

/** Mirror of lib/verses.ts: count verses; readable = 3+. */
function countVerses(raw) {
  const text = (raw || "").replace(/\s+/g, " ").trim();
  if (!text) return 0;
  const candidates = [];
  const re = /(^|\s)(\d{1,3})\s/g;
  let m;
  while ((m = re.exec(text)) !== null && candidates.length < 500) {
    candidates.push(parseInt(m[2], 10));
  }
  if (!candidates.length) return 0;
  let expected;
  let startIdx = 0;
  let count = 0;
  const firstOne = candidates.indexOf(1);
  if (firstOne >= 0) {
    expected = 1;
    startIdx = firstOne;
  } else if (candidates[0] === 2 || candidates[0] === 3) {
    count = 1; // unnumbered prologue verse
    expected = candidates[0];
  } else {
    return 0;
  }
  for (let i = startIdx; i < candidates.length && count < 400; i++) {
    if (candidates[i] === expected) {
      count++;
      expected++;
    }
  }
  return count;
}

async function readableChapters(slug) {
  const data = JSON.parse(
    await fs.readFile(path.join(chaptersDir, `${slug}_data.json`), "utf-8")
  );
  const out = [];
  (data.books || []).forEach((b, i) => {
    const text = (b.description || "").trim();
    if (text && countVerses(text) >= 3) {
      out.push({
        slug,
        chapter: i,
        label: `${BOOK_TITLES[slug]} ${i + 1}`,
        title: (b.title || "").trim(),
      });
    }
  });
  return out;
}

/** Split readings into `days` groups as evenly as possible. */
function distribute(readings, days) {
  const groups = [];
  const base = Math.floor(readings.length / days);
  let extra = readings.length % days;
  let at = 0;
  for (let d = 0; d < days; d++) {
    const n = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    groups.push(readings.slice(at, at + n));
    at += n;
  }
  return groups.filter((g) => g.length > 0);
}

function dayLabel(readings) {
  if (readings.length === 1) return readings[0].label;
  const books = [...new Set(readings.map((r) => r.slug))];
  if (books.length === 1) {
    const t = BOOK_TITLES[readings[0].slug];
    return `${t} ${readings[0].chapter + 1}–${readings[readings.length - 1].chapter + 1}`;
  }
  return `${readings[0].label}, ${readings[readings.length - 1].label}`;
}

const PLAN_DEFS = [
  {
    id: "walk-with-jesus",
    title: "Walk with Jesus",
    tagline: "7 days · 1 chapter a day",
    description:
      "Meet Jesus in seven unforgettable chapters — who He is, what He taught, the mercy He showed, and what He did for you.",
    image: "/images/plan-walk-with-jesus.jpg",
    custom: [
      { day: 1, title: "The Word Became Flesh", readings: [["john", 0]] },
      { day: 2, title: "You Must Be Born Again", readings: [["john", 2]] },
      { day: 3, title: "The Sermon on the Mount", readings: [["matthew", 4]] },
      { day: 4, title: "Neither Do I Condemn You", readings: [["john", 7]] },
      { day: 5, title: "Teach Us to Pray", readings: [["matthew", 5]] },
      { day: 6, title: "The Cross", readings: [["matthew", 26]] },
      { day: 7, title: "He Is Risen", readings: [["matthew", 27]] },
    ],
  },
  {
    id: "gospels-30",
    title: "The Gospels in 30 Days",
    tagline: "30 days · about 2 chapters a day",
    description:
      "All four Gospels in a month — the life, teaching, death, and resurrection of Jesus, two chapters at a time.",
    image: "/images/plan-gospels.jpg",
    books: ["matthew", "mark", "luke", "john"],
    days: 30,
  },
  {
    id: "genesis-25",
    title: "Genesis: The Beginning",
    tagline: "25 days · 2 chapters a day",
    description:
      "Two chapters a day through Genesis — creation, the fall, the flood, and the birth of a nation.",
    image: "/images/plan-genesis.jpg",
    books: ["genesis"],
    days: 25,
  },
  {
    id: "acts-romans-28",
    title: "Acts & Romans",
    tagline: "28 days · 1 chapter a day",
    description:
      "One chapter a day through Acts and Romans — the birth of the church and the very heart of the gospel.",
    image: "/images/plan-acts-romans.jpg",
    books: ["acts", "romans"],
    days: 28,
  },
];

const chapterCache = {};
async function chapterInfo(slug, idx) {
  const key = `${slug}:${idx}`;
  if (!chapterCache[key]) {
    const data = JSON.parse(
      await fs.readFile(path.join(chaptersDir, `${slug}_data.json`), "utf-8")
    );
    const b = data.books[idx] || {};
    chapterCache[key] = {
      slug,
      chapter: idx,
      label: `${BOOK_TITLES[slug]} ${idx + 1}`,
      title: (b.title || "").trim(),
    };
  }
  return chapterCache[key];
}

const plans = [];
for (const def of PLAN_DEFS) {
  let days;
  if (def.custom) {
    days = [];
    for (const c of def.custom) {
      const readings = [];
      for (const [slug, idx] of c.readings) {
        readings.push(await chapterInfo(slug, idx));
      }
      days.push({ day: c.day, title: c.title, readings });
    }
  } else {
    let readings = [];
    for (const slug of def.books) {
      readings = readings.concat(await readableChapters(slug));
    }
    const groups = distribute(readings, def.days);
    days = groups.map((g, i) => ({
      day: i + 1,
      title: dayLabel(g),
      readings: g,
    }));
  }
  plans.push({
    id: def.id,
    title: def.title,
    tagline: def.tagline,
    description: def.description,
    image: def.image,
    totalDays: days.length,
    totalChapters: days.reduce((n, d) => n + d.readings.length, 0),
    days,
  });
}

await fs.writeFile(outFile, JSON.stringify({ plans }, null, 2));
console.log(
  `plans: ${plans.map((p) => `${p.id} (${p.totalDays}d/${p.totalChapters}ch)`).join(", ")}`
);
