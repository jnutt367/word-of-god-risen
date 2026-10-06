"use client";

import { useState } from "react";

/**
 * Polished click-to-play YouTube embed.
 *
 * Shows a branded thumbnail facade (maxres artwork, gold play button,
 * BibleProject chip) and only loads the heavy YouTube iframe after the
 * user taps play — faster page loads and a much more professional look.
 */
export default function VideoEmbed({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [thumbSrc, setThumbSrc] = useState(
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
  );

  return (
    <div className="rounded-2xl bg-gradient-to-br from-gold-500/50 via-gold-500/10 to-transparent p-px shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
      <div className="overflow-hidden rounded-[15px] bg-vineyard-950">
        <div className="relative aspect-video w-full">
          {playing ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play video: ${title}`}
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
                BibleProject
              </span>
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-400 text-vineyard-950 shadow-[0_8px_30px_rgba(0,0,0,0.5)] ring-4 ring-gold-200/30 transition-transform duration-300 group-hover:scale-110">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="ml-1 h-8 w-8"
                    aria-hidden="true"
                  >
                    <path d="M8 5.5v13l11-6.5-11-6.5z" />
                  </svg>
                </span>
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
