"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  chapterKey,
  loadProgress,
  saveProgress,
  readOnPage,
  lastRead,
  type ProgressMap,
} from "@/lib/progress";
import {
  listenedKey,
  loadListened,
  saveListened,
  loadWatched,
  saveWatched,
  listenedOnPage,
  type MediaMap,
} from "@/lib/media-progress";
import {
  highlightKey,
  loadHighlights,
  saveHighlights,
  upsertPhrase,
  phraseMarkId,
  DEFAULT_HIGHLIGHT_COLOR,
  type HighlightColorId,
  type HighlightEntry,
  type HighlightMap,
  type HighlightStore,
  type PhraseHighlight,
} from "@/lib/highlights";

interface ProgressCtx {
  map: ProgressMap;
  isRead: (slug: string, idx: number) => boolean;
  toggle: (slug: string, idx: number, title: string) => boolean;
  /** Mark read (no-op if already read). Used by reading plans. */
  markRead: (slug: string, idx: number, title: string) => void;
  readOnPage: (slug: string) => number[];
  totalRead: number;
  last: { slug: string; idx: number; title: string; at: number } | null;
  /** Chapters listened to (Teddy narration). */
  isListened: (slug: string, idx: number) => boolean;
  toggleListened: (slug: string, idx: number, title: string) => boolean;
  listenedOnPage: (slug: string) => number[];
  totalListened: number;
  /** Overview videos watched, keyed by YouTube video id. */
  isWatched: (videoId: string) => boolean;
  toggleWatched: (videoId: string, title: string) => boolean;
  totalWatched: number;
  /** Verse highlights — the reader's own marks, this device only.
   *  Keyed by book/chapter/verse, never by translation. */
  highlights: HighlightMap;
  getHighlight: (
    slug: string,
    idx: number,
    verse: number
  ) => HighlightEntry | undefined;
  /** Tap behavior: off → on in the default gold; on → off. Returns
   *  whether the verse is highlighted after the toggle. */
  toggleHighlight: (slug: string, idx: number, verse: number) => boolean;
  setHighlightColor: (
    slug: string,
    idx: number,
    verse: number,
    color: HighlightColorId
  ) => void;
  removeHighlight: (slug: string, idx: number, verse: number) => void;
  /** Word-exact marks — painted only in the translation they were
   *  made in, over the exact words they were made on. */
  phrases: PhraseHighlight[];
  getPhrases: (slug: string, idx: number, verse: number) => PhraseHighlight[];
  addPhrase: (mark: PhraseHighlight) => void;
  removePhrase: (id: string) => void;
  clearHighlights: () => void;
  /** Whole-verse marks + phrase marks — what the reader has kept. */
  totalHighlights: number;
}

const Ctx = createContext<ProgressCtx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<ProgressMap>({});
  const [listened, setListened] = useState<MediaMap>({});
  const [watched, setWatched] = useState<MediaMap>({});
  const [highlights, setHighlights] = useState<HighlightStore>({
    verses: {},
    phrases: [],
  });

  useEffect(() => {
    setMap(loadProgress());
    setListened(loadListened());
    setWatched(loadWatched());
    setHighlights(loadHighlights());
  }, []);

  const persist = useCallback((next: ProgressMap) => {
    setMap(next);
    saveProgress(next);
  }, []);

  const persistListened = useCallback((next: MediaMap) => {
    setListened(next);
    saveListened(next);
  }, []);

  const persistWatched = useCallback((next: MediaMap) => {
    setWatched(next);
    saveWatched(next);
  }, []);

  const persistHighlights = useCallback((next: HighlightStore) => {
    setHighlights(next);
    saveHighlights(next);
  }, []);

  const isRead = useCallback(
    (slug: string, idx: number) => Boolean(map[chapterKey(slug, idx)]),
    [map]
  );

  const toggle = useCallback(
    (slug: string, idx: number, title: string): boolean => {
      const key = chapterKey(slug, idx);
      const next = { ...map };
      let nowRead: boolean;
      if (next[key]) {
        delete next[key];
        nowRead = false;
      } else {
        next[key] = { title, at: Date.now() };
        nowRead = true;
      }
      persist(next);
      return nowRead;
    },
    [map, persist]
  );

  const isListened = useCallback(
    (slug: string, idx: number) =>
      Boolean(listened[listenedKey(slug, idx)]),
    [listened]
  );

  const toggleListened = useCallback(
    (slug: string, idx: number, title: string): boolean => {
      const key = listenedKey(slug, idx);
      const next = { ...listened };
      let nowListened: boolean;
      if (next[key]) {
        delete next[key];
        nowListened = false;
      } else {
        next[key] = { title, at: Date.now() };
        nowListened = true;
      }
      persistListened(next);
      return nowListened;
    },
    [listened, persistListened]
  );

  const getHighlight = useCallback(
    (slug: string, idx: number, verse: number) =>
      highlights.verses[highlightKey(slug, idx, verse)],
    [highlights]
  );

  const toggleHighlight = useCallback(
    (slug: string, idx: number, verse: number): boolean => {
      const key = highlightKey(slug, idx, verse);
      const nextVerses = { ...highlights.verses };
      let nowOn: boolean;
      if (nextVerses[key]) {
        delete nextVerses[key];
        nowOn = false;
      } else {
        nextVerses[key] = { color: DEFAULT_HIGHLIGHT_COLOR, at: Date.now() };
        nowOn = true;
      }
      persistHighlights({ ...highlights, verses: nextVerses });
      return nowOn;
    },
    [highlights, persistHighlights]
  );

  const setHighlightColor = useCallback(
    (slug: string, idx: number, verse: number, color: HighlightColorId) => {
      const key = highlightKey(slug, idx, verse);
      const existing = highlights.verses[key];
      persistHighlights({
        ...highlights,
        verses: {
          ...highlights.verses,
          [key]: { color, at: existing?.at ?? Date.now() },
        },
      });
    },
    [highlights, persistHighlights]
  );

  const removeHighlight = useCallback(
    (slug: string, idx: number, verse: number) => {
      const key = highlightKey(slug, idx, verse);
      if (!highlights.verses[key]) return;
      const nextVerses = { ...highlights.verses };
      delete nextVerses[key];
      persistHighlights({ ...highlights, verses: nextVerses });
    },
    [highlights, persistHighlights]
  );

  const getPhrases = useCallback(
    (slug: string, idx: number, verse: number) => {
      const key = highlightKey(slug, idx, verse);
      return highlights.phrases.filter((p) => p.key === key);
    },
    [highlights]
  );

  const addPhrase = useCallback(
    (mark: PhraseHighlight) => {
      persistHighlights({
        ...highlights,
        phrases: upsertPhrase(highlights.phrases, mark),
      });
    },
    [highlights, persistHighlights]
  );

  const removePhrase = useCallback(
    (id: string) => {
      persistHighlights({
        ...highlights,
        phrases: highlights.phrases.filter((p) => phraseMarkId(p) !== id),
      });
    },
    [highlights, persistHighlights]
  );

  const clearHighlights = useCallback(() => {
    persistHighlights({ verses: {}, phrases: [] });
  }, [persistHighlights]);

  const isWatched = useCallback(
    (videoId: string) => Boolean(watched[videoId]),
    [watched]
  );

  const toggleWatched = useCallback(
    (videoId: string, title: string): boolean => {
      const next = { ...watched };
      let nowWatched: boolean;
      if (next[videoId]) {
        delete next[videoId];
        nowWatched = false;
      } else {
        next[videoId] = { title, at: Date.now() };
        nowWatched = true;
      }
      persistWatched(next);
      return nowWatched;
    },
    [watched, persistWatched]
  );

  const value = useMemo<ProgressCtx>(
    () => ({
      map,
      isRead,
      toggle,
      markRead: (slug: string, idx: number, title: string) => {
        const key = chapterKey(slug, idx);
        if (map[key]) return;
        persist({ ...map, [key]: { title, at: Date.now() } });
      },
      readOnPage: (slug: string) => readOnPage(map, slug),
      totalRead: Object.keys(map).length,
      last: lastRead(map),
      isListened,
      toggleListened,
      listenedOnPage: (slug: string) => listenedOnPage(listened, slug),
      totalListened: Object.keys(listened).length,
      isWatched,
      toggleWatched,
      totalWatched: Object.keys(watched).length,
      highlights: highlights.verses,
      getHighlight,
      toggleHighlight,
      setHighlightColor,
      removeHighlight,
      phrases: highlights.phrases,
      getPhrases,
      addPhrase,
      removePhrase,
      clearHighlights,
      totalHighlights:
        Object.keys(highlights.verses).length + highlights.phrases.length,
    }),
    [
      map,
      isRead,
      toggle,
      persist,
      isListened,
      toggleListened,
      listened,
      isWatched,
      toggleWatched,
      watched,
      highlights,
      getHighlight,
      toggleHighlight,
      setHighlightColor,
      removeHighlight,
      getPhrases,
      addPhrase,
      removePhrase,
      clearHighlights,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
