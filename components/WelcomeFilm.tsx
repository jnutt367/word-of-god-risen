"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVideoChoice, VideoChoiceModal } from "./VideoChoice";

/**
 * The welcome film, home at last (Jason blessed the release
 * Oct 29, 2026). "Welcome to the Farm" lives in the Meet Grandpa
 * Teddy spot the old pre-package welcome video vacated on Oct 28 —
 * this is the new film, canon through and through.
 *
 * The tap asks first (VideoChoice, Jason's Oct 20 law): "Watch
 * here" plays it in place; "Open in YouTube" is there for readers
 * who'd rather go.
 *
 * Jason's end behavior (Oct 28, 2026): when the film ends, the
 * Mark chapter 1 reader opens right here — the film's own last
 * word is "begin with Mark, chapter one," so the ending hands the
 * reader that very door, with Listen exactly one tap beyond it
 * (a browser cannot start sound on its own). The same door rests
 * quietly under the player from the start, for anyone who doesn't
 * watch to the end.
 */

const FILM_ID = "n-1KCs0r2Bw";
const FILM_URL = `https://www.youtube.com/watch?v=${FILM_ID}`;
const FILM_TITLE = "Welcome to the Farm | Grandpa Teddy Reads the Bible Aloud";
const MARK1_HREF = "/book/mark/0";

// The YouTube IFrame API, loaded once per page. It is the only way
// to hear the film end (a plain iframe keeps that to itself).
let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
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

function FilmPlayer({ onEnded }: { onEnded: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const endedRef = useRef(onEnded);
  endedRef.current = onEnded;

  useEffect(() => {
    let player: { destroy: () => void } | null = null;
    let mount: HTMLDivElement | null = null;
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current) return;
      const w = window as unknown as {
        YT: {
          Player: new (
            el: HTMLElement,
            opts: Record<string, unknown>
          ) => { destroy: () => void };
          PlayerState: { ENDED: number };
        };
      };
      // The API swaps its target element for the iframe — give it a
      // throwaway mount inside our host so React's own tree stays
      // exactly as React left it.
      mount = document.createElement("div");
      mount.className = "h-full w-full";
      hostRef.current.appendChild(mount);
      player = new w.YT.Player(mount, {
        videoId: FILM_ID,
        playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
        events: {
          onStateChange: (e: { data: number }) => {
            if (e.data === w.YT.PlayerState.ENDED) endedRef.current();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      player?.destroy();
      mount?.remove();
    };
  }, []);

  return <div ref={hostRef} className="h-full w-full" />;
}

export default function WelcomeFilm() {
  const choice = useVideoChoice();
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);

  const startPlaying = useCallback(() => {
    setEnded(false);
    setPlaying(true);
  }, []);

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gold-500/20 bg-vineyard-950">
        {ended ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center">
            <Image
              src="/images/first_john_cards.png"
              alt=""
              width={72}
              height={72}
              className="h-16 w-16 rounded-full border border-gold-500/30 object-cover"
            />
            <p className="font-display text-lg leading-snug text-cream-50">
              Begin with Mark, chapter one
            </p>
            <p className="max-w-xs text-sm text-cream-100/80">
              The reader is open. Tap below, then tap Listen — and
              I&rsquo;ll read it to you.
            </p>
            <Link
              href={MARK1_HREF}
              className="mt-1 inline-block rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
            >
              Open Mark 1
            </Link>
            <button
              type="button"
              onClick={startPlaying}
              className="cursor-pointer text-sm text-sage-300 underline decoration-sage-300/40 underline-offset-4 transition-colors hover:text-gold-300"
            >
              Watch the welcome again
            </button>
          </div>
        ) : playing ? (
          <FilmPlayer onEnded={() => setEnded(true)} />
        ) : (
          <button
            type="button"
            onClick={choice.openChoice}
            aria-haspopup="dialog"
            aria-label="Watch the welcome film — Welcome to the Farm"
            className="group absolute inset-0 block h-full w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
          >
            <Image
              src="/images/welcome-film-thumb.webp"
              alt="The welcome film's thumbnail: Grandpa Teddy on the farmhouse porch at dusk beneath the title Welcome to the Farm"
              fill
              sizes="(max-width: 768px) 100vw, 560px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-400 text-vineyard-950 shadow-[0_8px_30px_rgba(0,0,0,0.5)] ring-4 ring-gold-200/30 transition-transform duration-300 group-hover:scale-110">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="ml-1 h-7 w-7"
                  aria-hidden="true"
                >
                  <path d="M8 5.5v13l11-6.5-11-6.5z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
      <p className="mt-3 text-center text-sm text-sage-300">
        New here?{" "}
        <Link
          href={MARK1_HREF}
          className="font-medium text-gold-300 underline decoration-gold-300/40 underline-offset-4 transition-colors hover:text-gold-200"
        >
          Begin with Mark, chapter one →
        </Link>
      </p>
      {choice.open && (
        <VideoChoiceModal
          onClose={choice.closeChoice}
          videoId={FILM_ID}
          title={FILM_TITLE}
          youtubeUrl={FILM_URL}
          onWatchHere={startPlaying}
        />
      )}
    </div>
  );
}
