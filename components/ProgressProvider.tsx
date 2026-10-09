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
}

const Ctx = createContext<ProgressCtx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<ProgressMap>({});
  const [listened, setListened] = useState<MediaMap>({});
  const [watched, setWatched] = useState<MediaMap>({});

  useEffect(() => {
    setMap(loadProgress());
    setListened(loadListened());
    setWatched(loadWatched());
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
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
