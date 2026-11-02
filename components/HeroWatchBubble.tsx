"use client";

import {
  WELCOME_FILM_ANCHOR,
  WELCOME_FILM_PLAY_EVENT,
} from "./WelcomeFilm";

/**
 * The hero's gold play bubble (Jason, Nov 2, 2026) — the fourth
 * bubble in the hero's top corner, riding beside the book, the
 * speaker and the magnifier. It wears the app's gold play
 * standard whole: the gold-rimmed vineyard circle, the breathing
 * gold halo (watch-bubble-glow), and a plain gold play triangle
 * for its face — the mark that everywhere in this app means "it
 * plays HERE, inside the app" (Jason's gold play law, Nov 2,
 * 2026: never red, never YouTube's rounded-rectangle shape).
 *
 * Its job: carry the visitor down to the welcome film and start
 * it playing in place. The tap scrolls the film into view and
 * calls the film on its own event line; WelcomeFilm hears it and
 * starts exactly as its facade's "Watch here" tap starts it —
 * the same play state, the same watch beat. Nothing leaves the
 * app: the bubble promises a film here, and a film here is what
 * plays. It keeps the trio's own size (h-9 w-9) and the row's
 * gap, so the four bubbles ride as one family and the phone's
 * corner stays un-crowded.
 */
export default function HeroWatchBubble() {
  const onClick = () => {
    const film = document.getElementById(WELCOME_FILM_ANCHOR);
    if (film) {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      film.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }
    window.dispatchEvent(new Event(WELCOME_FILM_PLAY_EVENT));
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Watch here in the app — the welcome film, Welcome to the Farm"
      title="Watch here in the app — the welcome film"
      className="watch-bubble-glow grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 shadow-lg transition-colors hover:border-gold-300 hover:bg-vineyard-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
    >
      <svg
        viewBox="0 0 24 24"
        className="ml-0.5 h-5 w-5"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M8 5.5v13l11-6.5-11-6.5z" fill="var(--color-gold-400)" />
      </svg>
    </button>
  );
}
