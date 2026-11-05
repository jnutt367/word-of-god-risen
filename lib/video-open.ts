import { useSyncExternalStore } from "react";

/**
 * The video-open signal (Nov 5, 2026) — one shared word every
 * player surface speaks and every heavy motion on the page hears.
 *
 * Why it exists: on a small phone (Jason's moto g), a film playing
 * in the app was pausing and freezing while the same film played
 * fine in the YouTube app. The in-app player itself was never the
 * problem — the page BEHIND it was: the video dialog laid a
 * full-screen backdrop blur over the live home page, and the page
 * kept breathing under it — the Earth map's lights, the prayer
 * candle, the hero cycle walking its pictures, the hero map
 * walking its days, the heartbeat record polling. Blurring a
 * moving scene costs a little GPU every frame; on a low-end
 * phone the film starved.
 *
 * So while any video is open in the app, the page rests:
 *
 *   · Every player surface (VideoChoice's dialog, WatchBubble's
 *     dialog, VideoEmbed and WelcomeFilm playing in place) raises
 *     this signal on open and lowers it on close — every close,
 *     including Escape, backdrop tap and unmount (the surfaces'
 *     effect cleanups carry it, so it cannot be left raised).
 *   · <html> wears `data-video-open` while the count is above
 *     zero, and globals.css pauses the ambient CSS breathing
 *     under it (.hb-glow, .hb-prayer, .watch-bubble-glow).
 *   · HeroCycle hears it and rests its walk; the hero map's
 *     day-walk rests with it (it already obeys a `resting` prop).
 *   · BodyHeartbeat's minute poll skips its fetch while it is
 *     raised — the numbers simply stand during the film and the
 *     next tick after close refreshes them.
 *
 * The count is a count, not a flag: two surfaces can hold it at
 * once and the page wakes only when the last one lets go. The
 * dialog overlay itself no longer blurs (see VideoChoice) — the
 * plain dark veil is the same look without the per-frame cost.
 */

let openCount = 0;
const listeners = new Set<() => void>();

/** Raise (true) or lower (false) one hold on the signal. Holds
 *  nest: the page rests until every hold is released. */
export function setVideoOpen(open: boolean) {
  const next = Math.max(0, openCount + (open ? 1 : -1));
  if (next === openCount) return;
  openCount = next;
  if (typeof document !== "undefined") {
    if (openCount > 0) {
      document.documentElement.setAttribute("data-video-open", "");
    } else {
      document.documentElement.removeAttribute("data-video-open");
    }
  }
  for (const l of listeners) l();
}

/** The plain read, for callbacks that are not React renders
 *  (BodyHeartbeat's poll). */
export function isVideoOpen(): boolean {
  return openCount > 0;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** The React read, for components whose loops must rest while a
 *  video is open (HeroCycle). */
export function useVideoOpen(): boolean {
  return useSyncExternalStore(subscribe, isVideoOpen, () => false);
}
