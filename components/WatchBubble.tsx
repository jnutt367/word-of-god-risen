"use client";

import { useEffect, useState } from "react";
import WatchPlayer from "./WatchPlayer";

/**
 * The watch bubble on Start reading (Jason, Oct 31, 2026) — the
 * speaker bubble's twin. It began the morning as a link OUT to
 * YouTube; Jason corrected it within the hour: "it should be able
 * to play here." So the bubble is a button, and one tap opens the
 * Mark chapter 1 film in the app's own player, right on this page
 * — the visitor never leaves, and the watch counts the honest
 * in-app way (WatchPlayer's beatWatch, on PLAYING and nowhere
 * else). When the film ends, the door quietly closes behind it.
 *
 * The face is a little player in channel colors — a gold screen
 * with a vineyard play mark, never YouTube red (the app's standing
 * law: red belongs to the kindling mark alone).
 */
export default function WatchBubble() {
  const [open, setOpen] = useState(false);

  // Escape closes the door, the way the app's other dialogs do.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open ]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Start watching — the Mark chapter 1 film"
        title="Start watching — Mark 1, the film"
        className="absolute -top-2.5 -right-2.5 z-10 grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 shadow-lg transition-colors hover:border-gold-300 hover:bg-vineyard-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          aria-hidden="true"
          focusable="false"
        >
          <rect
            x="2.5"
            y="6"
            width="19"
            height="12"
            rx="3"
            fill="var(--color-gold-400)"
          />
          <path
            d="M10.4 9.4 L10.4 14.6 L15.1 12 Z"
            fill="var(--color-vineyard-950)"
          />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-vineyard-950/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mark chapter 1 — the film"
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-cream-100/15 bg-vineyard-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-3.5">
              <p className="text-left text-sm font-semibold text-cream-100">
                Mark chapter 1 — the film
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close the film"
                className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-cream-100/25 text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <WatchPlayer
                videoId="z9pwCVw7Rf0"
                title="Mark chapter 1 — Grandpa Teddy's film"
                autoplay
                onEnded={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
