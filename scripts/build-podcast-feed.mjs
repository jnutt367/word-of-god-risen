#!/usr/bin/env node
/**
 * build-podcast-feed.mjs — Word of God Risen podcast feed generator.
 *
 * Reads public/audio-manifest.json (every chapter Grandpa Teddy has read
 * aloud) and emits public/podcast.xml: an RSS 2.0 feed with the iTunes
 * namespace, one episode per chapter, in canonical Bible order
 * (Genesis -> Revelation), followed by the extra books carried by the app
 * and the parable readings.
 *
 * Enclosure byte sizes come from the local farm clone where the audio is
 * hosted there, otherwise from batched HEAD requests. Sizes are cached in
 * scripts/podcast-sizes.json so re-runs are fast; anything that cannot be
 * sized is logged and the run fails loudly rather than emitting a bad feed.
 *
 * Cost: $0. Static output, existing hosting, free directories.
 * Usage: node scripts/build-podcast-feed.mjs
 */
import { readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://word-of-god-risen.vercel.app';
const FARM_DIR = path.join(process.env.HOME, 'workspace/.build-share/truvine-repo/audio');
const FARM_PREFIX = 'https://jnutt367.github.io/truvine/audio/';
const CACHE_PATH = path.join(ROOT, 'scripts/podcast-sizes.json');
const OUT_PATH = path.join(ROOT, 'public/podcast.xml');

// Canonical order of the 66 books (manifest slug -> display title).
const CANON = [
  ['genesis', 'Genesis'], ['exodus', 'Exodus'], ['leviticus', 'Leviticus'],
  ['numbers', 'Numbers'], ['deuteronomy', 'Deuteronomy'], ['joshua', 'Joshua'],
  ['judges', 'Judges'], ['ruth', 'Ruth'], ['samuel-1', '1 Samuel'],
  ['samuel-2', '2 Samuel'], ['kings-1', '1 Kings'], ['kings-2', '2 Kings'],
  ['chronicles-1', '1 Chronicles'], ['chronicles-2', '2 Chronicles'],
  ['ezra', 'Ezra'], ['nehemiah', 'Nehemiah'], ['esther', 'Esther'],
  ['job', 'Job'], ['psalms', 'Psalms'], ['proverbs', 'Proverbs'],
  ['ecclesiastes', 'Ecclesiastes'], ['song', 'Song of Solomon'],
  ['isaiah', 'Isaiah'], ['jeremiah', 'Jeremiah'],
  ['lamentations', 'Lamentations'], ['ezekiel', 'Ezekiel'], ['daniel', 'Daniel'],
  ['hosea', 'Hosea'], ['joel', 'Joel'], ['amos', 'Amos'], ['obadiah', 'Obadiah'],
  ['jonah', 'Jonah'], ['micah', 'Micah'], ['nahum', 'Nahum'],
  ['habakkuk', 'Habakkuk'], ['zephaniah', 'Zephaniah'], ['haggai', 'Haggai'],
  ['zechariah', 'Zechariah'], ['malachi', 'Malachi'], ['matthew', 'Matthew'],
  ['mark', 'Mark'], ['luke', 'Luke'], ['john', 'John'], ['acts', 'Acts'],
  ['romans', 'Romans'], ['corinthians-1', '1 Corinthians'],
  ['corinthians-2', '2 Corinthians'], ['galatians', 'Galatians'],
  ['ephesians', 'Ephesians'], ['philippians', 'Philippians'],
  ['colossians', 'Colossians'], ['thessalonians-1', '1 Thessalonians'],
  ['thessalonians-2', '2 Thessalonians'], ['timothy-1', '1 Timothy'],
  ['timothy-2', '2 Timothy'], ['titus', 'Titus'], ['philemon', 'Philemon'],
  ['hebrews', 'Hebrews'], ['james', 'James'], ['peter-1', '1 Peter'],
  ['peter-2', '2 Peter'], ['john-1', '1 John'], ['john-2', '2 John'],
  ['john-3', '3 John'], ['jude', 'Jude'], ['revelation', 'Revelation'],
];

// Extra books the app carries, after Revelation (manifest slug -> title).
const EXTRAS = [
  ['tobit', 'Tobit'], ['judith', 'Judith'], ['wisdom', 'Wisdom of Solomon'],
  ['sirach', 'Sirach'], ['baruch', 'Baruch'], ['maccabees-1', '1 Maccabees'],
  ['maccabees-2', '2 Maccabees'], ['enoch-1', 'The Book of Enoch'],
  ['jasher', 'The Book of Jasher'], ['jubilees', 'The Book of Jubilees'],
];

// The parable readings (manifest keys are "parable:<slug>").
const PARABLES = {
  'good-samaritan': 'The Good Samaritan',
  'hidden-treasure': 'The Hidden Treasure',
  'lost-sheep': 'The Lost Sheep',
  'pearl-of-great-price': 'The Pearl of Great Price',
  'pharisee-and-tax-collector': 'The Pharisee and the Tax Collector',
  'prodigal-son': 'The Prodigal Son',
  'rich-fool': 'The Rich Fool',
  'rich-man-and-lazarus': 'The Rich Man and Lazarus',
  'shrewd-manager': 'The Shrewd Manager',
  'sower': 'The Sower',
  'talents': 'The Talents',
  'ten-virgins': 'The Ten Virgins',
  'unforgiving-servant': 'The Unforgiving Servant',
  'wedding-feast': 'The Wedding Feast',
  'wheat-and-tares': 'The Wheat and the Tares',
  'workers-in-the-vineyard': 'The Workers in the Vineyard',
};

const esc = (s) => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const rfc822 = (d) => d.toUTCString().replace('GMT', '+0000');

async function headSize(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
      });
      const len = Number(res.headers.get('content-length'));
      if (res.ok && Number.isFinite(len) && len > 0) return len;
    } catch { /* retry */ }
    // Fallback: a 1-byte ranged GET reports the total in Content-Range.
    try {
      const res = await fetch(url, {
        headers: { Range: 'bytes=0-0' },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
      });
      const m = /\/(\d+)$/.exec(res.headers.get('content-range') || '');
      if (m) return Number(m[1]);
    } catch { /* retry */ }
  }
  return null;
}

async function main() {
  const manifest = JSON.parse(await readFile(path.join(ROOT, 'public/audio-manifest.json'), 'utf8'));
  const cache = existsSync(CACHE_PATH)
    ? JSON.parse(await readFile(CACHE_PATH, 'utf8'))
    : {};

  // ---- Build episode list in canonical order -------------------------
  const episodes = [];
  const pushChapter = (slug, title, ch, url) => episodes.push({
    title: `${title} ${ch}`,
    description:
      `${title}, chapter ${ch} — the Word of God read aloud, word for word, ` +
      `by Grandpa Teddy. Hear and read the whole Bible free at Word of God ` +
      `Risen — no account, no password: ${SITE}/`,
    url,
  });
  const seenSlugs = new Set();
  for (const [slug, title] of [...CANON, ...EXTRAS]) {
    seenSlugs.add(slug);
    const chapters = Object.keys(manifest)
      .filter((k) => k.startsWith(`${slug}:`))
      .map((k) => Number(k.slice(slug.length + 1)))
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    for (const ch of chapters) pushChapter(slug, title, ch, manifest[`${slug}:${ch}`]);
  }
  // Any manifest slug not in our tables — never drop audio silently.
  for (const slug of new Set(Object.keys(manifest).map((k) => k.split(':')[0]))) {
    if (seenSlugs.has(slug) || slug === 'parable') continue;
    console.warn(`WARN: manifest slug not in order tables: ${slug}`);
    const chapters = Object.keys(manifest)
      .filter((k) => k.startsWith(`${slug}:`))
      .map((k) => Number(k.slice(slug.length + 1)))
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    for (const ch of chapters) pushChapter(slug, slug, ch, manifest[`${slug}:${ch}`]);
  }
  // Parable readings last.
  for (const key of Object.keys(manifest).filter((k) => k.startsWith('parable:')).sort()) {
    const name = PARABLES[key.slice('parable:'.length)] || key.slice('parable:'.length);
    episodes.push({
      title: `Parable: ${name}`,
      description:
        `The parable of ${name} — the Word of God read aloud, word for word, ` +
        `by Grandpa Teddy. Hear and read the whole Bible free at Word of God ` +
        `Risen — no account, no password: ${SITE}/`,
      url: manifest[key],
    });
  }
  console.log(`episodes: ${episodes.length}`);

  // ---- Resolve enclosure byte sizes ----------------------------------
  const missing = episodes.filter((e) => !cache[e.url]);
  console.log(`sizes to fetch: ${missing.length} (cached: ${episodes.length - missing.length})`);
  let cursor = 0;
  const CONCURRENCY = 24;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < missing.length) {
      const ep = missing[cursor++];
      if (ep.url.startsWith(FARM_PREFIX)) {
        const local = path.join(FARM_DIR, decodeURIComponent(ep.url.slice(FARM_PREFIX.length)));
        if (existsSync(local)) {
          cache[ep.url] = (await stat(local)).size;
          continue;
        }
      }
      const size = await headSize(ep.url);
      if (size) cache[ep.url] = size;
      else console.error(`UNSIZED: ${ep.url}`);
    }
  }));
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 1) + '\n');
  const unsized = episodes.filter((e) => !cache[e.url]);
  if (unsized.length) {
    console.error(`FAILED: ${unsized.length} enclosures could not be sized; refusing to emit an invalid feed.`);
    process.exit(1);
  }

  // ---- Emit the feed ---------------------------------------------------
  const start = new Date();
  start.setUTCHours(12, 0, 0, 0);
  const items = episodes.map((ep, i) => {
    const d = new Date(start.getTime() - i * 86400000);
    return [
      '    <item>',
      `      <title>${esc(ep.title)}</title>`,
      `      <description>${esc(ep.description)}</description>`,
      `      <enclosure url="${esc(ep.url)}" length="${cache[ep.url]}" type="audio/mpeg"/>`,
      `      <guid isPermaLink="false">${esc(ep.url)}</guid>`,
      `      <pubDate>${rfc822(d)}</pubDate>`,
      '      <itunes:episodeType>full</itunes:episodeType>',
      '    </item>',
    ].join('\n');
  });

  const channelDescription =
    'The whole Bible, read out loud by Grandpa Teddy — every chapter, word ' +
    'for word, free. No account, no password: just God\'s Word, read the way ' +
    'a grandfather reads to the family. From Genesis to Revelation, plus the ' +
    'parables of Jesus. Read along in the app: ' + SITE + '/';

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"',
    '  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"',
    '  xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>Word of God Risen — The Bible Read Aloud</title>',
    `    <link>${SITE}/</link>`,
    `    <atom:link href="${SITE}/podcast.xml" rel="self" type="application/rss+xml"/>`,
    '    <language>en</language>',
    '    <copyright>Scripture read from the World English Bible (public domain). Recordings free to hear and share.</copyright>',
    `    <description>${esc(channelDescription)}</description>`,
    `    <lastBuildDate>${rfc822(new Date())}</lastBuildDate>`,
    '    <itunes:author>Grandpa Teddy · TruVINE</itunes:author>',
    `    <itunes:summary>${esc(channelDescription)}</itunes:summary>`,
    '    <itunes:type>episodic</itunes:type>',
    '    <itunes:explicit>false</itunes:explicit>',
    '    <itunes:owner>',
    '      <itunes:name>Jason Nutt · TruVINE</itunes:name>',
    '      <itunes:email>jnutt367@gmail.com</itunes:email>',
    '    </itunes:owner>',
    `    <itunes:image href="${SITE}/images/podcast-cover.jpg"/>`,
    '    <itunes:category text="Religion &amp; Spirituality">',
    '      <itunes:category text="Christianity"/>',
    '    </itunes:category>',
    '    <image>',
    `      <url>${SITE}/images/podcast-cover.jpg</url>`,
    '      <title>Word of God Risen — The Bible Read Aloud</title>',
    `      <link>${SITE}/</link>`,
    '    </image>',
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  await writeFile(OUT_PATH, xml);
  console.log(`wrote ${OUT_PATH} (${(xml.length / 1024).toFixed(0)} KB, ${episodes.length} episodes)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
