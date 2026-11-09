/**
 * Book documentation for the Characters book pages (plan §5A, Nov 9, 2026).
 *
 * Only VERIFIED fields live here. Chapters and cover come from
 * data/books.ts; audio status is read from the manifest at render time
 * (lib/book-audio.ts); the cast is derived from the character records.
 * Author / setting / theme / key verse are written book by book along
 * the cover road — a field that is not written here renders NOTHING on
 * the page, never a placeholder. Authorship is labeled Scripture or
 * Tradition exactly as the sources present it.
 */
import { charactersInBook } from "@/data/characters";

export interface BookDoc {
  slug: string;
  author?: string;
  written?: string;
  theme?: string;
  keyVerse?: { text: string; ref: string };
  coverStatus?: string;
  /** One line for the book's tile on the Characters index. */
  tileLine?: string;
}

/** The New Testament cover pass — all 27 crowned Nov 3, 2026 (plan §5A). */
const NT_COVER = "Canon — crowned in the New Testament cover pass, Nov 3, 2026";

export const BOOK_DOCS: Record<string, BookDoc> = {
  matthew: {
    slug: "matthew",
    author: "Tradition names Matthew the apostle — Levi the tax collector — as its author.",
    theme: "Jesus the promised King — the Messiah who fulfills the Law and the Prophets.",
    keyVerse: {
      text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.",
      ref: "Matthew 6:33",
    },
    coverStatus: NT_COVER,
    tileLine: "The company gathers here first — the Twelve, the two Marys, Pilate, and more.",
  },
  mark: {
    slug: "mark",
    author: "Tradition names John Mark, companion of Peter, as its author.",
    theme: "Jesus the suffering Servant — the Son of God who came not to be served, but to serve.",
    keyVerse: {
      text: "For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.",
      ref: "Mark 10:45",
    },
    coverStatus: NT_COVER,
    tileLine: "The company on the road — Bartimaeus, Rufus, the scribe, the young man who fled.",
  },
  luke: {
    slug: "luke",
    author: "Luke the beloved physician (Colossians 4:14) — named by the book's own companion volume (Luke 1:3; Acts 1:1).",
    theme: "Jesus the Savior of the lost — good news for the poor, the outcast, and the nations.",
    keyVerse: {
      text: "For the Son of Man came to seek and to save the lost.",
      ref: "Luke 19:10",
    },
    coverStatus: NT_COVER,
    tileLine: "Gabriel and Jairus stand here — and Zechariah's page waits on a portrait crown.",
  },
  john: {
    slug: "john",
    author: "Tradition names John the apostle — the beloved disciple — as its author.",
    theme: "Jesus the Word made flesh — believe, and have life in His name.",
    keyVerse: {
      text: "I am the way and the truth and the life. No one comes to the Father except through me.",
      ref: "John 14:6",
    },
    coverStatus: NT_COVER,
    tileLine: "The beloved disciple's Gospel — Jesus, Mary, Pilate, Joseph of Arimathea.",
  },
  acts: {
    slug: "acts",
    author: "Luke — the book opens by continuing his Gospel: \u201cThe first book I wrote, Theophilus\u201d (Acts 1:1).",
    theme: "The Spirit sends the gospel from Jerusalem to the ends of the earth.",
    keyVerse: {
      text: "You will be my witnesses in Jerusalem, in all Judea and Samaria, and to the uttermost parts of the earth.",
      ref: "Acts 1:8",
    },
    coverStatus: NT_COVER,
    tileLine: "The road turns — Saul becomes Paul; Timothy, Apollos, Priscilla and Aquila join.",
  },
  romans: {
    slug: "romans",
    author: "Paul the apostle — stated in the letter itself (Romans 1:1).",
    written: "About AD 57, from Corinth, on the third journey — the standard understanding.",
    theme: "The righteousness of God — the just shall live by faith.",
    keyVerse: { text: "But the righteous shall live by faith.", ref: "Romans 1:17" },
    coverStatus: "Canon — crowned Oct 30, 2026 (Paul dictating, Tertius writing).",
    tileLine: "Paul dictates the letter; Tertius holds the pen.",
  },
  "corinthians-1": {
    slug: "corinthians-1",
    author: "Paul — stated in the letter itself (1 Corinthians 1:1).",
    written: "From Ephesus (1 Corinthians 16:8), about AD 55 — the standard understanding.",
    theme: "Love, unity, and the resurrection — one body, many members.",
    keyVerse: { text: "The greatest of these is love.", ref: "1 Corinthians 13:13" },
    coverStatus: NT_COVER,
    tileLine: "Paul, Timothy, Apollos, Priscilla and Aquila — newly released from the hold.",
  },
  obadiah: {
    slug: "obadiah",
    author: "Obadiah — the book opens with his name: \u201cThe vision of Obadiah\u201d (Obadiah 1:1).",
    theme: "Pride goes before a fall — and the kingdom shall be the LORD's.",
    coverStatus: "Canon — crowned Nov 9, 2026.",
    tileLine: "Pride goes before a fall — and the kingdom shall be the LORD's. The prophet's vision, crowned Nov 9.",
  },
};

export function getBookDoc(slug: string): BookDoc | undefined {
  return BOOK_DOCS[slug];
}

/**
 * Named people of a book who have no crowned portrait and no person
 * page. They are shown on the book page by name only — never with an
 * invented face (plan §5C).
 */
export interface NameOnlyCastEntry {
  name: string;
  note: string;
}

export const NAME_ONLY_CAST: Record<string, NameOnlyCastEntry[]> = {
  romans: [
    {
      name: "Phoebe",
      note: "Commended, Romans 16:1–2 · no portrait yet — joins on Jason’s word",
    },
  ],
};

export function nameOnlyCast(bookSlug: string): NameOnlyCastEntry[] {
  return NAME_ONLY_CAST[bookSlug] || [];
}

/** Displayed cast count: crowned person pages + name-only entries. */
export function castCount(bookSlug: string): number {
  return charactersInBook(bookSlug).length + nameOnlyCast(bookSlug).length;
}

/**
 * Books whose honest cast line is that they carry no named cast at all
 * (plan §5C) — the page says what the book speaks in instead.
 */
export const NO_NAMED_CAST: Record<string, string> = {
  psalms: "songs",
  proverbs: "wisdom",
  ecclesiastes: "wisdom",
  "song-of-solomon": "song",
};
