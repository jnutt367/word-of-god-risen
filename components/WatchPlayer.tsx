"use client";

import { useEffect, useRef } from "react";
import { beatWatch } from "@/lib/heartbeat";

/**
 * The app's video player — a YouTube player that can SAY when a
 * video actually plays (a plain iframe keeps that to itself).
 *
 * It exists for the video-watch heart (Jason, Oct 29, 2026): a
 * video watched in the app sets a gold heart on the watcher's
 * place on the Earth map. The beat (lib/heartbeat.ts `beatWatch`)
 * fires from the player's PLAYING state and nowhere else — never
 * on a page view, never on a door tap alone — and its dedupe
 * (once per browser session per video) lives in the beat itself,
 * so every surface that plays through here counts the same honest
 * way. Surfaces that merely link out after VideoChoice fire
 * nothing, exactly as before: the heart is for watching HERE.
 *
 * The player pattern is WelcomeFilm's, proven there Oct 29: the
 * IFrame API swaps its target element for the iframe, so it is
 * given a throwaway mount inside our host div and React's own
 * tree stays exactly as React left it.
 */

// The YouTube IFrame API, loaded once per page (module-level, so
// every player on the page shares the one load).
let ytApiPromise: Promise<void> | null = null;
export function loadYouTubeApi(): Promise<void> {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const w = window as unknown as {
      YT?: { Player: unknown };
      onYouTubeIframeAPIReady?: () => void;
    };
    if (w.YT && typeof w.YT.Player === "function") {
      resolve();
      return;
    }
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

interface YtPlayer {
  destroy: () => void;
  getIframe: () => HTMLIFrameElement;
}

export default function WatchPlayer({
  videoId,
  title,
  autoplay = true,
  onEnded,
}: {
  videoId: string;
  title: string;
  /** Doors that the reader just chose ("Watch here") autoplay, as
   *  they always have; players standing open on a page (the
   *  Parables films) wait for their own tap, as they always have. */
  autoplay?: boolean;
  onEnded?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const endedRef = useRef(onEnded);
  useEffect(() => {
    endedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    let player: YtPlayer | null = null;
    let mount: HTMLDivElement | null = null;
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current) return;
      const w = window as unknown as {
        YT: {
          Player: new (
            el: HTMLElement,
            opts: Record<string, unknown>
          ) => YtPlayer;
          PlayerState: { PLAYING: number; ENDED: number };
        };
      };
      mount = document.createElement("div");
      mount.className = "h-full w-full";
      hostRef.current.appendChild(mount);
      player = new w.YT.Player(mount, {
        width: "100%",
        height: "100%",
        videoId,
        playerVars: { autoplay: autoplay ? 1 : 0, rel: 0, playsinline: 1 },
        events: {
          onReady: (e: { target: YtPlayer }) => {
            // The API's iframe carries no title of its own; give
            // it the video's, so the player is named for everyone.
            try {
              e.target.getIframe().title = title;
            } catch {
              /* a title is a kindness, never a reason to break */
            }
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === w.YT.PlayerState.PLAYING) beatWatch(videoId);
            if (e.data === w.YT.PlayerState.ENDED) endedRef.current?.();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      player?.destroy();
      mount?.remove();
    };
  }, [videoId, title, autoplay]);

  return <div ref={hostRef} className="h-full w-full" />;
}
