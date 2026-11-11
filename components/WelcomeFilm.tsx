"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVideoChoice, VideoChoiceModal } from "./VideoChoice";
import { loadYouTubeApi } from "./WatchPlayer";
import { beatWatch } from "@/lib/heartbeat";
import { setVideoOpen } from "@/lib/video-open";

/**
 * The welcome film, home at last (Jason blessed the release
 * Oct 29, 2026). "Welcome to the Farm" — the introduction that
 * tells what this app is — first lived in the Meet Grandpa Teddy
 * spot the old pre-package welcome video vacated on Oct 28.
 * On Nov 2, 2026 Jason corrected the film-first reorder: the
 * INTRODUCTION leads the page, directly under the hero, so a new
 * visitor's first play is the film that tells what the app is.
 * Its thumbnail carries the "this plays" signal exactly where
 * his eye expects it — the glowing gold circle at the top right,
 * the WatchBubble treatment (small gold-rimmed circle, breathing
 * gold halo, a plain gold play triangle — never YouTube's
 * rounded-rectangle brand shape; Jason, Nov 2, 2026).
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

// The film's anchor and its play line (Jason, Nov 2, 2026): the
// hero's gold play bubble scrolls the visitor to this anchor and
// fires this event, and the film below answers by playing in
// place. The anchor rides the film's own root so the landing is
// the film itself, scrolled clear of the sticky header.
export const WELCOME_FILM_ANCHOR = "welcome-film";
export const WELCOME_FILM_PLAY_EVENT = "wogr:play-welcome-film";

// The YouTube IFrame API is the only way to hear the film end (a
// plain iframe keeps that to itself). Its loader is shared now —
// components/WatchPlayer.tsx owns it, so every player on the page
// shares the one load.

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
          PlayerState: { ENDED: number; PLAYING: number };
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
            // The video-watch heart (Oct 29, 2026): the film
            // actually playing is a watch, counted in its own
            // beat — never as a chapter read or heard.
            if (e.data === w.YT.PlayerState.PLAYING) beatWatch(FILM_ID);
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
    // The tap itself counts the watch (Jason, Oct 31, 2026);
    // the player's PLAYING fire is the backstop, and the beat
    // dedupes the pair to one count per visit.
    beatWatch(FILM_ID);
    setEnded(false);
    setPlaying(true);
  }, []);

  // The hero's gold play bubble calls down on this line (Jason,
  // Nov 2, 2026): its tap scrolls the visitor here and fires the
  // event, and the film answers with the very same start as its
  // facade's "Watch here" tap — the film plays here in the app,
  // which is what the gold mark promises wherever it appears.
  useEffect(() => {
    const onPlayRequest = () => startPlaying();
    window.addEventListener(WELCOME_FILM_PLAY_EVENT, onPlayRequest);
    return () =>
      window.removeEventListener(WELCOME_FILM_PLAY_EVENT, onPlayRequest);
  }, [startPlaying]);

  // While the film plays here, the rest of the page rests — the
  // video-open signal (lib/video-open.ts, Nov 5, 2026), held for
  // exactly as long as the player stands in the facade's place.
  useEffect(() => {
    if (!playing) return;
    setVideoOpen(true);
    return () => setVideoOpen(false);
  }, [playing]);

  return (
    <div id={WELCOME_FILM_ANCHOR} className="scroll-mt-24">
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
            aria-label="Watch the welcome film here in the app — Welcome to the Farm"
            className="group absolute inset-0 block h-full w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
          >
            <Image
              src="/images/welcome-film-thumb.webp"
              alt="The welcome film's thumbnail: Grandpa Teddy on the farmhouse porch at dusk beneath the title Welcome to the Farm"
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {/* The play mark (Jason, Nov 2, 2026): not the old
                centered medallion — the WatchBubble treatment. A
                small glowing gold circle at the thumbnail's top
                right: gold-rimmed vineyard circle, breathing gold
                halo (watch-bubble-glow), and a plain gold play
                triangle for its face. It sits where his eye
                expects "this plays" to live. */}
            <span
              aria-hidden="true"
              className="watch-bubble-glow absolute top-3 right-3 grid h-10 w-10 place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 shadow-lg transition-transform duration-300 group-hover:scale-110"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 ml-0.5"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M8 5.5v13l11-6.5-11-6.5z"
                  fill="var(--color-gold-400)"
                />
              </svg>
            </span>
            {/* The frame's name tag (Jason, Nov 11, 2026, the
                name-tag audit): the picture IS the button, and a
                first-timer shouldn't have to guess that. A slim
                ribbon along the frame's dark lower edge says it
                plays, in the legend's quiet register — low over
                the porch boards, never across Teddy's face or
                the title baked above. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-vineyard-950/70 px-3 py-1.5 text-xs font-medium text-cream-100/90"
            >
              <span className="text-[10px] text-gold-300">▶</span>
              Watch — Welcome to the Farm
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
