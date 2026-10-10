#!/usr/bin/env node
/**
 * Parses Mark character sheets into data/characters.ts and copies portraits
 * into public/images/characters/.
 *
 * Source: ~/workspace/truvine-shorts/mark-full-book/character-sheets/
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

const TWELVE = new Set([
  "peter", "andrew", "james-son-of-zebedee", "john-son-of-zebedee", "philip",
  "bartholomew", "matthew", "thomas", "james-son-of-alphaeus", "thaddaeus",
  "simon-the-zealot", "judas-iscariot",
]);
const KEY_FIGURES = new Set([
  "jesus", "mary-mother-of-jesus", "mary-magdalene", "john-the-baptist", "pontius-pilate",
]);

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
    const m2 = text.match(/\((Matt|Luke|John|Acts|Rom|1 Cor|2 Cor|Gal|1 Pet|2 Pet|1 John|Rev|Tradition)[^()]*\)\s*$/);
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

const files = fs.readdirSync(SHEETS).filter((f) => f.endsWith(".md") && f !== "INDEX.md");
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

  // Copy portrait (optimized for web: max 1024px, JPEG q82; WebP passes through)
  let img = null;
  if (imgFile && fs.existsSync(path.join(CHAR_DIR, imgFile))) {
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

  const group = TWELVE.has(slug) ? "twelve" : KEY_FIGURES.has(slug) ? "key" : "faces";

  chars.push({
    slug,
    name,
    subtitle: SUBTITLES[slug] || "",
    image: img,
    caption,
    group,
    unnamed: UNNAMED.has(slug),
    facts: parsedFacts,
    personality,
    chapters: markChapters(parsedFacts),
  });
}

// Sort: twelve in canonical order, then key figures, then faces alphabetically.
const twelveOrder = [...TWELVE];
chars.sort((a, b) => {
  const ga = a.group === "twelve" ? 0 : a.group === "key" ? 1 : 2;
  const gb = b.group === "twelve" ? 0 : b.group === "key" ? 1 : 2;
  if (ga !== gb) return ga - gb;
  if (ga === 0) return twelveOrder.indexOf(a.slug) - twelveOrder.indexOf(b.slug);
  if (ga === 1) return [...KEY_FIGURES].indexOf(a.slug) - [...KEY_FIGURES].indexOf(b.slug);
  return a.name.localeCompare(b.name);
});

const missing = chars.filter((c) => !c.image).map((c) => c.slug);
if (missing.length) console.warn("MISSING IMAGES:", missing.join(", "));

const out = `// Auto-generated by scripts/build-characters-data.mjs from the Mark character sheets.
// Do not edit by hand — re-run the script.
export type CharacterGroup = "twelve" | "key" | "faces";

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
  group: CharacterGroup;
  /** Scripture gives this person no name. */
  unnamed: boolean;
  facts: CharacterFact[];
  personality: string[];
  /** Mark chapter numbers (1-based) referenced by this character. */
  chapters: number[];
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
];

export function getCharacter(slug: string): Character | undefined {
  return CHARACTERS.find((c) => c.slug === slug);
}

export function unnamedCharacters(): Character[] {
  return CHARACTERS.filter((c) => c.unnamed);
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
console.log(`Groups: twelve=${chars.filter((c) => c.group === "twelve").length}, key=${chars.filter((c) => c.group === "key").length}, faces=${chars.filter((c) => c.group === "faces").length}`);
console.log(`Unnamed: ${chars.filter((c) => c.unnamed).length}`);
