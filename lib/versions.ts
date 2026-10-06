/* Bible version metadata — client-safe (no node imports).
 * Server code in lib/bible.ts re-exports these. */

export interface BibleVersion {
  id: string;
  label: string;
  name: string;
}

export const BIBLE_VERSIONS: BibleVersion[] = [
  { id: "web", label: "WEB", name: "World English Bible" },
  { id: "kjv", label: "KJV", name: "King James Version" },
];

export const DEFAULT_VERSION = "web";

export const VERSION_STORAGE_KEY = "wogr:bible-version";
