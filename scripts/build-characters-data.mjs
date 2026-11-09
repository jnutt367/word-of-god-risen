#!/usr/bin/env node
/**
 * Parses the whole-Bible character sheets into data/characters.ts.
 *
 * Source: ~/workspace/truvine-shorts/mark-full-book/character-sheets/
 * (The folder began as the Mark library; since Nov 9, 2026 it is the
 * whole-Bible sheet library — see cover-recreation/
 * CAST-SHEETS-WHOLE-BIBLE-PLAN-2026-11-09.md.)
 *
 * Taxonomy (roles, eras, appears-in books, relationships, first
 * appearance) is backfilled here from the Nov 9, 2026 plan inventory
 * (§1/§5 of the plan). The closed role set lives in ROLES below — do not
 * invent new roles per person; the set is amended once, for everyone,
 * by Jason's crown.
 *
 * Portraits: the crowned files already in public/images/characters/ are
 * canon and are NEVER overwritten by this script. The copy/convert path
 * below only fills a portrait that is missing from public/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const SHEETS = "/home/hatch/workspace/truvine-shorts/mark-full-book/character-sheets";
const CHAR_DIR = "/home/hatch/workspace/truvine-shorts/mark-full-book/characters";
const IMG_OUT = path.join(REPO, "public", "images", "characters");
const DATA_OUT = path.join(REPO, "data", "characters.ts");

// Legacy groupings — no longer shelves. They survive as sort order and
// as the old group field while the layout is book-first (plan §3).
const TWELVE = new Set([
  "peter", "andrew", "james-son-of-zebedee", "john-son-of-zebedee", "philip",
  "bartholomew", "matthew", "thomas", "james-son-of-alphaeus", "thaddaeus",
  "simon-the-zealot", "judas-iscariot",
]);
const KEY_FIGURES = new Set([
  "jesus", "mary-mother-of-jesus", "mary-magdalene", "john-the-baptist", "pontius-pilate", "paul",
]);

// The Heavenly Company — the only two angels Scripture names (added
// Oct 31, 2026 on Jason's direction: their own category on the app).
const HEAVENLY = new Set(["gabriel", "michael"]);

// Sheet written, but the portrait is an UNCROWNED candidate — the person
// stays off the app entirely until Jason crowns the portrait (plan §1).
const AWAITING_CROWN = new Set(["zechariah"]);

// NOTE (Nov 9, 2026): the old NOT_YET_ON_APP hold (Timothy, Apollos,
// Priscilla, Aquila — "held for the 1 Corinthians shelf") is RETIRED.
// Under the whole-Bible layout every book has its page, so the hold has
// no reason to exist; the four are live like everyone else.

// Where to read about the heavenly company (book reader routes).
const READINGS = {
  gabriel: [
    { label: "Daniel 8", href: "/book/daniel/7" },
    { label: "Daniel 9", href: "/book/daniel/8" },
    { label: "Luke 1", href: "/book/luke/0" },
  ],
  michael: [
    { label: "Daniel 10", href: "/book/daniel/9" },
    { label: "Daniel 12", href: "/book/daniel/11" },
    { label: "Jude", href: "/book/jude/0" },
    { label: "Revelation 12", href: "/book/revelation/11" },
  ],
};

// Scripture gives no name for these people — the "Unnamed" collection.
const UNNAMED = new Set([
  "gerasene-demoniac", "woman-with-issue-of-blood", "rich-young-ruler", "poor-widow",
  "young-man-fled", "paralytic-roof", "boy-evil-spirit", "deaf-mute-decapolis",
  "withered-hand", "scribe-greatest-commandment", "salome",
]);

const SUBTITLES = {
  peter: "Simon son of Jonah · The Rock",
  andrew: "Brother of Peter · The Connector",
  "james-son-of-zebedee": "Son of Zebedee · Son of Thunder",
  "john-son-of-zebedee": "Son of Zebedee · The Beloved Disciple",
  philip: "From Bethsaida · The Practical One",
  bartholomew: "Nathanael of Cana · No Deceit",
  matthew: "Levi the Tax Collector · The Writer",
  thomas: "Didymus the Twin · Honest Doubter",
  "james-son-of-alphaeus": "Son of Alphaeus · James the Less",
  thaddaeus: "Judas son of James · The Questioner",
  "simon-the-zealot": "The Zealot · Fire Redirected",
  "judas-iscariot": "Iscariot · The Tragedy",
  jesus: "The Son of God · The Suffering Servant",
  "mary-mother-of-jesus": "Mother of Jesus · The Servant",
  "mary-magdalene": "From Magdala · First Witness",
  "john-the-baptist": "The Voice in the Wilderness",
  "pontius-pilate": "Governor of Judea · The Compromise",
  "herod-antipas": "Tetrarch of Galilee · The Divided King",
  herodias: "The Grudge",
  salome: "Daughter of Herodias",
  "salome-wife-of-zebedee": "Wife of Zebedee · Mother of James and John",
  "gerasene-demoniac": "The Man from the Tombs · First Missionary",
  jairus: "Synagogue Leader · A Father's Plea",
  "woman-with-issue-of-blood": "Healed After Twelve Years",
  bartimaeus: "The Blind Beggar of Jericho",
  "rich-young-ruler": "The One Who Walked Away",
  "poor-widow": "Two Small Coins · The Greatest Gift",
  "simon-of-cyrene": "From Cyrene · He Carried the Cross",
  rufus: "Son of Simon of Cyrene · Chosen in the Lord",
  "joseph-of-arimathea": "Council Member · The Bold Burial",
  "syrophoenician-woman": "A Gentile Mother's Faith",
  barabbas: "The Prisoner Set Free",
  "centurion-at-cross": "The Soldier Who Saw",
  "young-man-fled": "Gethsemane · The One Who Ran",
  "paralytic-roof": "Lowered Through the Roof",
  "boy-evil-spirit": "The Boy at the Mountain's Foot",
  "deaf-mute-decapolis": "\u201cEphphatha\u201d — Be Opened",
  "withered-hand": "Healed on the Sabbath",
  "scribe-greatest-commandment": "\u201cNot Far from the Kingdom\u201d",
  gabriel: "The Messenger \u00b7 Who Stands in God\u2019s Presence",
  michael: "The Archangel \u00b7 Prince and Guardian",
  moses: "The Lawgiver \u00b7 Face to Face with God",
  elijah: "The Tishbite \u00b7 Prophet of Fire",
  paul: "Saul of Tarsus \u00b7 Apostle to the Gentiles",
  tertius: "The Scribe of Romans \u00b7 He Held the Pen",
  timothy: "Paul\u2019s True Child in the Faith",
  apollos: "Eloquent in the Scriptures \u00b7 He Watered",
  priscilla: "Fellow Worker \u00b7 The Teacher of Apollos",
  aquila: "Tentmaker of Pontus \u00b7 Fellow Worker",
};

/* ------------------------------------------------------------------ */
/* Whole-Bible taxonomy — backfilled from the plan inventory (Nov 9).  */
/* Book slugs match data/books.ts. Lists are in Bible order; the      */
/* first entry is the person's filing book (plan §3).                  */
/* ------------------------------------------------------------------ */

const GOSPELS_ACTS = ["matthew", "mark", "luke", "john", "acts"];
const GOSPELS = ["matthew", "mark", "luke", "john"];

const BOOKS_BY_SLUG = {
  jesus: [...GOSPELS, "acts", "hebrews", "revelation"],
  peter: [...GOSPELS_ACTS, "galatians", "peter-1", "peter-2"],
  andrew: [...GOSPELS_ACTS],
  "james-son-of-zebedee": [...GOSPELS_ACTS],
  "john-son-of-zebedee": [...GOSPELS_ACTS, "john-1", "john-2", "john-3", "revelation"],
  philip: [...GOSPELS_ACTS],
  bartholomew: [...GOSPELS_ACTS],
  matthew: [...GOSPELS_ACTS],
  thomas: [...GOSPELS_ACTS],
  "james-son-of-alphaeus": [...GOSPELS_ACTS],
  thaddaeus: [...GOSPELS_ACTS],
  "simon-the-zealot": [...GOSPELS_ACTS],
  "judas-iscariot": [...GOSPELS_ACTS],
  "john-the-baptist": [...GOSPELS],
  "mary-mother-of-jesus": [...GOSPELS, "acts"],
  "mary-magdalene": [...GOSPELS],
  "pontius-pilate": [...GOSPELS, "timothy-1"],
  "joseph-of-arimathea": [...GOSPELS],
  "herod-antipas": [...GOSPELS],
  herodias: ["matthew", "mark"],
  salome: ["matthew", "mark"],
  "salome-wife-of-zebedee": ["matthew", "mark"],
  barabbas: [...GOSPELS],
  // Moses: filed as a Gospel person (crowned Nov 9, 2026) — he appears
  // in person at the Transfiguration in the three Synoptics and is
  // named as a person in John (1:17; 5:45-47).
  moses: [...GOSPELS],
  // Elijah: filed as a Gospel person (crowned Nov 9, 2026) — he appears
  // in person at the Transfiguration in the three Synoptics and is
  // named as a person in John (1:21, by his Greek name Elias).
  elijah: [...GOSPELS],
  "simon-of-cyrene": ["matthew", "mark", "luke"],
  // Rufus is named again in Romans 16:13; the crowned layout preview
  // (Nov 9, 2026) files him under Mark with a Romans cast of five, so
  // his books list follows the crowned preview.
  rufus: ["mark"],
  jairus: ["mark", "luke"],
  bartimaeus: ["mark"],
  "gerasene-demoniac": ["mark", "luke"],
  "paralytic-roof": ["matthew", "mark", "luke"],
  "boy-evil-spirit": ["matthew", "mark", "luke"],
  "deaf-mute-decapolis": ["mark"],
  "syrophoenician-woman": ["matthew", "mark"],
  "woman-with-issue-of-blood": ["matthew", "mark", "luke"],
  "withered-hand": ["matthew", "mark", "luke"],
  "rich-young-ruler": ["matthew", "mark", "luke"],
  "poor-widow": ["mark", "luke"],
  "scribe-greatest-commandment": ["mark"],
  "young-man-fled": ["mark"],
  "centurion-at-cross": ["matthew", "mark", "luke"],
  gabriel: ["daniel", "luke"],
  michael: ["daniel", "jude", "revelation"],
  paul: [
    "acts", "romans", "corinthians-1", "corinthians-2", "galatians",
    "ephesians", "philippians", "colossians", "thessalonians-1",
    "thessalonians-2", "timothy-1", "timothy-2", "titus", "philemon",
  ],
  tertius: ["romans"],
  timothy: [
    "acts", "corinthians-1", "corinthians-2", "philippians", "colossians",
    "thessalonians-1", "thessalonians-2", "timothy-1", "timothy-2", "philemon",
  ],
  apollos: ["acts", "corinthians-1", "titus"],
  priscilla: ["acts", "romans", "corinthians-1", "timothy-2"],
  aquila: ["acts", "romans", "corinthians-1", "timothy-2"],
};

// The closed role set (plan §5B). Multi-tag where Scripture puts a
// person in two places (Pilate: ruler and opponent; Judas: apostle
// and opponent).
const WITNESS = ["Witness / Friend"];
const ROLES = {
  jesus: ["The Lord"],
  "judas-iscariot": ["Disciple / Apostle", "Opponent"],
  "john-the-baptist": ["Prophet"],
  moses: ["Prophet"],
  elijah: ["Prophet"],
  "mary-mother-of-jesus": ["Family of Jesus"],
  "pontius-pilate": ["King / Ruler", "Opponent"],
  "herod-antipas": ["King / Ruler", "Opponent"],
  herodias: ["Opponent"],
  salome: ["Opponent"],
  barabbas: ["Opponent"],
  gabriel: ["Angel"],
  michael: ["Angel"],
  paul: ["Disciple / Apostle"],
  tertius: ["Narrator / Scribe"],
};
for (const s of TWELVE) if (!ROLES[s]) ROLES[s] = ["Disciple / Apostle"];
for (const s of [
  "mary-magdalene", "joseph-of-arimathea", "salome-wife-of-zebedee",
  "simon-of-cyrene", "rufus", "jairus", "bartimaeus", "gerasene-demoniac",
  "paralytic-roof", "boy-evil-spirit", "deaf-mute-decapolis",
  "syrophoenician-woman", "woman-with-issue-of-blood", "withered-hand",
  "rich-young-ruler", "poor-widow", "scribe-greatest-commandment",
  "young-man-fled", "centurion-at-cross", "timothy", "apollos",
  "priscilla", "aquila",
]) ROLES[s] = WITNESS;

const ERAS = {
  gabriel: "Heavenly — outside the timeline",
  michael: "Heavenly — outside the timeline",
  paul: "The Early Church \u00b7 The Letters",
  tertius: "The Letters",
  timothy: "The Early Church",
  apollos: "The Early Church",
  priscilla: "The Early Church",
  aquila: "The Early Church",
};
const DEFAULT_ERA = "The Life of Jesus";

// First appearance where the preview or the sheets name it precisely;
// everyone else falls back to their first book's title at render time.
const FIRST_APPEARANCE = {
  paul: "Acts 7, as Saul",
  tertius: "Romans 16",
  gabriel: "Daniel 8",
  michael: "Daniel 10",
  moses: "Exodus 2",
  elijah: "1 Kings 17",
};

const RELATIONSHIPS = {
  jesus: [{ slug: "mary-mother-of-jesus", label: "his mother" }],
  "mary-mother-of-jesus": [{ slug: "jesus", label: "her Son" }],
  peter: [{ slug: "andrew", label: "his brother" }],
  andrew: [{ slug: "peter", label: "his brother" }],
  "james-son-of-zebedee": [
    { slug: "john-son-of-zebedee", label: "his brother" },
    { slug: "salome-wife-of-zebedee", label: "his mother" },
  ],
  "john-son-of-zebedee": [
    { slug: "james-son-of-zebedee", label: "his brother" },
    { slug: "salome-wife-of-zebedee", label: "his mother" },
  ],
  "salome-wife-of-zebedee": [
    { slug: "james-son-of-zebedee", label: "her son" },
    { slug: "john-son-of-zebedee", label: "her son" },
  ],
  "simon-of-cyrene": [{ slug: "rufus", label: "his son" }],
  rufus: [{ slug: "simon-of-cyrene", label: "his father" }],
  paul: [
    { slug: "tertius", label: "his scribe" },
    { slug: "timothy", label: "son in the faith" },
    { slug: "priscilla", label: "fellow worker" },
    { slug: "aquila", label: "fellow worker" },
  ],
  tertius: [{ slug: "paul", label: "the apostle whose words he wrote down" }],
  timothy: [{ slug: "paul", label: "his father in the faith" }],
  apollos: [
    { slug: "priscilla", label: "explained the way of God to him more adequately" },
    { slug: "aquila", label: "explained the way of God to him more adequately" },
  ],
  priscilla: [
    { slug: "aquila", label: "her husband" },
    { slug: "paul", label: "fellow worker" },
  ],
  aquila: [
    { slug: "priscilla", label: "his wife" },
    { slug: "paul", label: "fellow worker" },
  ],
};

// Age variants on ONE person record (plan §5B). Paul is the model:
// Saul → Awakened → Aged is one life in three portraits.
const VARIANTS = {
  paul: [
    {
      image: "/images/characters/saul-of-tarsus.jpg",
      label: "SAUL — before",
      sub: "The persecutor, Acts 7–8",
    },
    {
      image: "/images/characters/paul-awakened.jpg",
      label: "PAUL AWAKENED — the Damascus road",
      sub: "The turning, Acts 9",
    },
    {
      image: "/images/characters/paul.jpg",
      label: "PAUL THE APOSTLE — the letters",
      sub: "The aged apostle, Romans onward",
    },
  ],
};

// Sheet sections rendered as dossier rows on the person page, in order.
const DOSSIER_SECTIONS = [
  "Names", "Hometown", "Occupation", "Family", "His Turning",
  "Where He Stands", "Tradition",
];

// Display overrides that must survive regeneration. The Daughter of Herodias
// fix (commit 7f04abb) was originally a hand-edit to the generated data file;
// it lives here now so re-running this script never reverts it.
const OVERRIDES = {
  salome: {
    name: "Daughter of Herodias",
    subtitle: "Unnamed in Scripture",
    caption:
      "Scripture never names her — she is only \"the daughter of Herodias\" (Mark 6:22). The historian Josephus calls her Salome.",
  },
  // The sheet's title carries her formal name in parentheses.
  priscilla: { name: "Priscilla" },
};

function section(md, heading) {
  // Grab bullets under a ## heading until the next ## heading.
  const re = new RegExp(`^## ${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m");
  const m = md.match(re);
  if (!m) return [];
  const rest = md.slice(m.index + m[0].length);
  const end = rest.search(/^## /m);
  const body = end === -1 ? rest : rest.slice(0, end);
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim());
}

function cleanFact(text) {
  // Pull trailing (Mark 5:15) refs out into a separate field.
  let ref = "";
  const m = text.match(/\(([^()]*Mark[^()]*)\)\s*$/);
  if (m) {
    ref = m[1].trim();
    text = text.slice(0, m.index).trim();
  } else {
    const m2 = text.match(/\((Matt|Luke|John|Acts|Rom|1 Cor|2 Cor|Gal|Phil|Col|1 Thess|2 Thess|1 Tim|2 Tim|Heb|1 Pet|2 Pet|1 John|Dan|Rev|Tradition)[^()]*\)\s*$/);
    if (m2) {
      ref = m2[1] === "Tradition" ? "Tradition" : m2[0].slice(1, -1).trim();
      text = text.slice(0, m2.index).trim();
    }
  }
  return { text, ref };
}

function markChapters(facts) {
  const set = new Set();
  for (const f of facts) {
    const all = `${f.text} ${f.ref}`;
    for (const m of all.matchAll(/Mark (\d+)/g)) set.add(parseInt(m[1], 10));
  }
  return [...set].sort((a, b) => a - b);
}

// Versioned portrait addresses (Jason, Nov 9, 2026): when a crowned portrait
// is REPLACED at its long-standing URL, phones that cached the old file keep
// showing it (Gabriel healed on re-fetch; Michael did not). A versioned
// filename is a fresh address no cache can confuse with the old one. The
// un-versioned file stays in public/ untouched for any deep links.
const IMAGE_OVERRIDES = {
  michael: "michael-v2.jpg",
  gabriel: "gabriel-v2.jpg",
};

function existingPublicImage(slug) {
  // A versioned override wins when its file is present.
  const overrideFile = IMAGE_OVERRIDES[slug];
  if (overrideFile && fs.existsSync(path.join(IMG_OUT, overrideFile))) {
    return `/images/characters/${overrideFile}`;
  }
  // The crowned portrait already in public/ is canon — use it as-is.
  for (const ext of [".webp", ".jpg", ".png", ".jpeg"]) {
    if (fs.existsSync(path.join(IMG_OUT, `${slug}${ext}`))) {
      return `/images/characters/${slug}${ext}`;
    }
  }
  return null;
}

const files = fs
  .readdirSync(SHEETS)
  .filter((f) => f.endsWith(".md") && f !== "INDEX.md" && !AWAITING_CROWN.has(f.replace(/\.md$/, "")));
fs.mkdirSync(IMG_OUT, { recursive: true });
// Filled during parsing: { src, dest } pairs for PNG->JPG web optimization.
const pendingConversions = [];

const chars = [];
for (const file of files) {
  const slug = file.replace(/\.md$/, "");
  const md = fs.readFileSync(path.join(SHEETS, file), "utf8");

  const rawName = (md.match(/^# (.+)$/m) || ["", slug])[1].trim();
  // Strip sheet-specific suffixes like "— As Mark Reveals Him" for display.
  const name = rawName.replace(/\s*[—–-]\s*As Mark Reveals Him\s*$/i, "").trim() || rawName;
  const imgMatch = md.match(/!\[.*?\]\((sandbox:\/\/[^)]+)\)/);
  const imgFile = imgMatch ? path.basename(imgMatch[1]) : null;
  const captionMatch = md.match(/!\[[^\]]*\]\([^)]+\)\s*\n\s*\n\*([^*]+)\*/);
  const caption = captionMatch ? captionMatch[1].trim() : "";

  let facts = section(md, "Key Moments in Mark's Gospel");
  if (!facts.length) facts = section(md, "What Mark Reveals About Him");
  if (!facts.length) facts = section(md, "Key Moments in Scripture");
  const parsedFacts = facts.slice(0, 4).map(cleanFact);

  const personality = section(md, "Personality in Scripture").slice(0, 3).map((t) => {
    const c = cleanFact(t);
    return c.ref ? `${c.text} (${c.ref})` : c.text;
  });

  const dossier = [];
  for (const heading of DOSSIER_SECTIONS) {
    const items = section(md, heading);
    if (items.length) dossier.push({ label: heading, items });
  }

  // Portrait: a crowned file already in public/ wins and is never
  // overwritten. Only a missing portrait falls back to copying the
  // sheet's referenced file out of the sheet library.
  let img = existingPublicImage(slug);
  if (!img && imgFile && fs.existsSync(path.join(CHAR_DIR, imgFile))) {
    const srcPath = path.join(CHAR_DIR, imgFile);
    const ext = path.extname(imgFile).toLowerCase();
    if (ext === ".webp") {
      const outName = `${slug}.webp`;
      fs.copyFileSync(srcPath, path.join(IMG_OUT, outName));
      img = `/images/characters/${outName}`;
    } else {
      // Defer raster conversion to Python/PIL via a manifest the shell step consumes.
      const outName = `${slug}.jpg`;
      pendingConversions.push({ src: srcPath, dest: path.join(IMG_OUT, outName) });
      img = `/images/characters/${outName}`;
    }
  }

  const group = HEAVENLY.has(slug) ? "heavenly" : TWELVE.has(slug) ? "twelve" : KEY_FIGURES.has(slug) ? "key" : "faces";
  const books = BOOKS_BY_SLUG[slug] || [];

  const override = OVERRIDES[slug] || {};
  chars.push({
    slug,
    name: override.name || name,
    subtitle: override.subtitle || SUBTITLES[slug] || "",
    image: img,
    caption: override.caption || caption,
    group,
    unnamed: UNNAMED.has(slug),
    facts: parsedFacts,
    personality,
    dossier,
    chapters: markChapters(parsedFacts),
    readings: READINGS[slug] || [],
    roles: ROLES[slug] || [],
    era: ERAS[slug] || DEFAULT_ERA,
    books,
    firstBook: books[0] || "",
    firstAppearance: FIRST_APPEARANCE[slug] || "",
    relationships: RELATIONSHIPS[slug] || [],
    variants: VARIANTS[slug] || [],
    status: { portrait: "crowned", sheet: "written", page: "live" },
  });
}

// Sort: twelve in canonical order, then key figures, then faces alphabetically.
const twelveOrder = [...TWELVE];
const keyOrder = [...KEY_FIGURES];
chars.sort((a, b) => {
  const ga = a.group === "twelve" ? 0 : a.group === "key" ? 1 : a.group === "faces" ? 2 : 3;
  const gb = b.group === "twelve" ? 0 : b.group === "key" ? 1 : b.group === "faces" ? 2 : 3;
  if (ga !== gb) return ga - gb;
  if (ga === 0) return twelveOrder.indexOf(a.slug) - twelveOrder.indexOf(b.slug);
  if (ga === 1) return keyOrder.indexOf(a.slug) - keyOrder.indexOf(b.slug);
  return a.name.localeCompare(b.name);
});

const missing = chars.filter((c) => !c.image).map((c) => c.slug);
if (missing.length) console.warn("MISSING IMAGES:", missing.join(", "));
const noBooks = chars.filter((c) => !c.books.length).map((c) => c.slug);
if (noBooks.length) console.warn("NO BOOKS LIST:", noBooks.join(", "));
const noRoles = chars.filter((c) => !c.roles.length).map((c) => c.slug);
if (noRoles.length) console.warn("NO ROLES:", noRoles.join(", "));

const out = `// Auto-generated by scripts/build-characters-data.mjs from the whole-Bible character sheets.
// Do not edit by hand — re-run the script.
export type CharacterGroup = "twelve" | "key" | "faces" | "heavenly";

/** The closed role set (plan §5B, Nov 9, 2026) — amended only by crown, for everyone at once. */
export type CharacterRole =
  | "The Lord"
  | "Disciple / Apostle"
  | "Prophet"
  | "King / Ruler"
  | "Priest"
  | "Family of Jesus"
  | "Witness / Friend"
  | "Opponent"
  | "Angel"
  | "Narrator / Scribe"
  | "Background Believer";

export interface CharacterFact {
  text: string;
  ref: string;
}

export interface Character {
  slug: string;
  name: string;
  subtitle: string;
  image: string | null;
  caption: string;
  /** Legacy grouping (sort order only — the layout is book-first now). */
  group: CharacterGroup;
  /** Scripture gives this person no name. */
  unnamed: boolean;
  facts: CharacterFact[];
  personality: string[];
  /** Identity sections from the sheet (Names / Hometown / Occupation / …). */
  dossier: { label: string; items: string[] }[];
  /** Mark chapter numbers (1-based) referenced by this character. */
  chapters: number[];
  /** Reader links for figures whose story lives outside Mark. */
  readings: { label: string; href: string }[];
  /** Roles from the closed set — a person may carry more than one. */
  roles: CharacterRole[];
  /** Their main season (plan §5B era buckets). */
  era: string;
  /** Book slugs they appear, speak, or are named in — Bible order. */
  books: string[];
  /** The book they are filed under: their first book in Bible order. */
  firstBook: string;
  /** Precise first appearance where known (e.g. "Acts 7, as Saul"); empty falls back to the first book's title. */
  firstAppearance: string;
  relationships: { slug: string; label: string }[];
  /** Age variants on this one record (Paul: Saul → Awakened → Aged). */
  variants: { image: string; label: string; sub: string }[];
  status: { portrait: string; sheet: string; page: string };
}

export const CHARACTERS: Character[] = ${JSON.stringify(chars, null, 2)};

export const CHARACTER_GROUPS: { id: CharacterGroup; title: string; blurb: string }[] = [
  {
    id: "twelve",
    title: "The Twelve",
    blurb: "The men Jesus chose and sent — ordinary fishermen, a tax collector, a revolutionary, and one who would betray Him.",
  },
  {
    id: "key",
    title: "Key Figures",
    blurb: "The people at the center of Mark's Gospel — and those who stood in judgment over Him.",
  },
  {
    id: "faces",
    title: "Faces of Mark",
    blurb: "Everyone else Mark introduces — rulers and beggars, the healed and the hurting. Every one of them met Jesus.",
  },
  {
    id: "heavenly",
    title: "The Heavenly Company",
    blurb: "Only two angels are named in all of Scripture. One stands in God's presence and announces; the other contends for God's people. They are of one order — flames of fire, robed like lightning.",
  },
];

export function getCharacter(slug: string): Character | undefined {
  return CHARACTERS.find((c) => c.slug === slug);
}

export function unnamedCharacters(): Character[] {
  return CHARACTERS.filter((c) => c.unnamed);
}

/** Everyone whose books list includes the given book slug. */
export function charactersInBook(bookSlug: string): Character[] {
  return CHARACTERS.filter((c) => c.books.includes(bookSlug));
}
`;

fs.writeFileSync(DATA_OUT, out);
console.log(`Wrote ${chars.length} characters to ${DATA_OUT}`);
if (pendingConversions.length) {
  const manifest = path.join(REPO, "scripts", ".character-images-manifest.json");
  fs.writeFileSync(manifest, JSON.stringify(pendingConversions, null, 2));
  console.log(
    `Wrote ${pendingConversions.length} image conversions to ${manifest} — run scripts/optimize-character-images.py to apply.`
  );
}
console.log(`Groups: twelve=${chars.filter((c) => c.group === "twelve").length}, key=${chars.filter((c) => c.group === "key").length}, faces=${chars.filter((c) => c.group === "faces").length}, heavenly=${chars.filter((c) => c.group === "heavenly").length}`);
console.log(`Unnamed: ${chars.filter((c) => c.unnamed).length}`);
for (const b of ["matthew", "mark", "luke", "john", "acts", "romans", "corinthians-1"]) {
  console.log(`Cast of ${b}: ${chars.filter((c) => c.books.includes(b)).length}`);
}
