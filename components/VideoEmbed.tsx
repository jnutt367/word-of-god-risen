"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { beatWatch } from "@/lib/heartbeat";
import { setVideoOpen } from "@/lib/video-open";
import WatchPlayer from "./WatchPlayer";

/**
 * Polished click-to-play YouTube embed.
 *
 * Shows a branded thumbnail facade (maxres artwork, the app's one
 * gold play mark at the top right, brand chip) and only loads the
 * heavy YouTube iframe after the user taps play — faster page
 * loads and a much more professional look.
 *
 * The tap plays HERE, in this frame, and the watch counts on the
 * tap itself (Jason's ruling, Oct 31, 2026 — the click is the
 * intent; nobody is carried off to YouTube, and no choice gate
 * stands between the reader and the playing video).
 *
 * `brand` labels the video's source. Defaults to "TruVINE" for Jason's
 * own overviews; pass "BibleProject" only for the legacy placeholder
 * embeds that are still theirs (Judges, Ruth) until their TruVINE
 * overviews are produced.
 */
export default function VideoEmbed({
  videoId,
  title,
  brand = "TruVINE",
}: {
  videoId: string;
  title: string;
  brand?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [thumbSrc, setThumbSrc] = useState(
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
  );
  const facadeRef = useRef<HTMLButtonElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const startPlaying = useCallback(() => {
    // The watch counts from this tap (Jason, Oct 31, 2026).
    beatWatch(videoId);
    setPlaying(true);
  }, [videoId]);

  // When playback starts in place, land focus on the player so a
  // keyboard reader arrives where the video now lives.
  useEffect(() => {
    if (playing) playerRef.current?.focus();
  }, [playing]);

  // While the film plays here, the rest of the page rests — the
  // video-open signal (lib/video-open.ts, Nov 5, 2026), held for
  // exactly as long as the player stands in the facade's place.
  useEffect(() => {
    if (!playing) return;
    setVideoOpen(true);
    return () => setVideoOpen(false);
  }, [playing]);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-gold-500/50 via-gold-500/10 to-transparent p-px shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
      <div className="overflow-hidden rounded-[15px] bg-vineyard-950">
        <div ref={playerRef} tabIndex={-1} className="relative aspect-video w-full">
          {playing ? (
            // WatchPlayer, not a plain iframe, so the watch can be
            // counted — the video-watch heart (Oct 29, 2026) fires
            // from its PLAYING state.
            <WatchPlayer videoId={videoId} title={title} />
          ) : (
            <button
              type="button"
              ref={facadeRef}
              onClick={startPlaying}
              aria-label={`Watch here in the app: ${title}`}
              className="group absolute inset-0 h-full w-full cursor-pointer"
            >
              <img
                src={thumbSrc}
                onError={() =>
                  setThumbSrc(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)
                }
                alt=""
                loading="lazy"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-vineyard-950/85 via-vineyard-950/20 to-vineyard-950/30" />
              <span className="absolute left-4 top-4 rounded-full bg-vineyard-950/80 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold-300 backdrop-blur">
                {brand}
              </span>
              {/* The one play mark (Jason, Nov 2, 2026): the gold
                  glowing circle at the thumbnail's top right — the
                  WatchBubble treatment every video surface in the
                  app wears. It replaced this facade's centered gold
                  medallion: one mark, one place, gold and never
                  YouTube red, meaning "you can play it HERE,
                  inside the app." */}
              <span
                aria-hidden="true"
                className="watch-bubble-glow absolute top-3 right-3 grid h-11 w-11 place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 shadow-lg transition-transform duration-300 group-hover:scale-110"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-[22px] w-[22px] ml-0.5"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M8 5.5v13l11-6.5-11-6.5z"
                    fill="var(--color-gold-400)"
                  />
                </svg>
              </span>
              <span className="absolute inset-x-0 bottom-0 p-5 text-left">
                <span className="font-display text-lg text-cream-50 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                  {title}
                </span>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
