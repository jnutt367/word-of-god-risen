"use client";

import Image from "next/image";
import Link from "next/link";
import { useVideoChoice, VideoChoiceModal } from "./VideoChoice";

/**
 * A note from Grandpa Teddy — resting directly under "Meet Grandpa
 * Teddy" on the home page (Jason, Oct 26, 2026). Not a replacement
 * for the introduction: a postscript from Teddy himself — "hey, I
 * have a little bit more to tell you here" — pointing to the
 * long-form film "One Chapter Is Enough" and telling every visitor,
 * up front, that the readings are being tested word for word and
 * that any chapter can be flagged from its own page.
 *
 * Kept to the house pattern (TaiwanPrayer): a heading, a few lines
 * in Teddy's voice, and a plain way to watch. The card carries the
 * film's own crowned thumbnail (Jason, Oct 26, 2026 — "if it's
 * pointing to this video it should probably have the thumbnail on
 * the app"), sized modestly inside the card so the page stays calm;
 * the thumbnail itself carries the real emblem, so the card shows
 * no second emblem above it.
 *
 * The tap asks first (VideoChoice, Jason's Oct 20 rule — and his
 * word again on Oct 26, 2026: the film "needs to be able to be
 * watched in the app"): "Watch here" plays the film in place, in
 * this app; "Open in YouTube" remains for readers who'd rather go.
 * Nobody is carried off to YouTube unasked.
 */

// The film: "One Chapter Is Enough" (long-form, TruVINE channel).
const FILM_ID = "2ZF3agQryng";
const FILM_URL = `https://www.youtube.com/watch?v=${FILM_ID}`;
const FILM_TITLE = "One Chapter Is Enough — the film";

export default function TeddyNote() {
  const choice = useVideoChoice();

  return (
    <section
      aria-labelledby="teddy-note-heading"
      className="mx-auto max-w-6xl px-4 pt-5 sm:px-6"
    >
      <div className="rounded-2xl border border-gold-500/15 bg-vineyard-900 px-6 py-8 text-center sm:px-10">
        <button
          type="button"
          onClick={choice.openChoice}
          aria-haspopup="dialog"
          aria-label="Watch the story — One Chapter Is Enough, the film"
          className="group relative mx-auto block w-full max-w-xl cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
        >
          <Image
            src="/images/one-chapter-film-thumb.webp"
            alt="The film's thumbnail: Grandpa Teddy bowed in prayer at a table in lantern light, beneath the title One Chapter Is Enough"
            width={960}
            height={540}
            className="w-full rounded-xl border border-gold-500/20 object-cover transition-colors group-hover:border-gold-400"
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
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
          A note from Grandpa Teddy
        </p>
        <h2
          id="teddy-note-heading"
          className="mt-2 font-display text-xl text-cream-50 sm:text-2xl"
        >
          One more thing, friend
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-cream-100/85">
          Every word you hear me read here is being tested word for
          word against the page. If anything ever sounds wrong,
          there&rsquo;s a button on every chapter to flag it — and
          that chapter comes down until it&rsquo;s right. I told the
          whole story in a short film: the night God&rsquo;s Word lit
          up Taiwan, and how one chapter is enough for God to begin.
        </p>
        <p className="mt-5">
          <button
            type="button"
            onClick={choice.openChoice}
            aria-haspopup="dialog"
            aria-label="Watch the story — One Chapter Is Enough, the film"
            className="inline-block cursor-pointer rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
          >
            Watch the story
          </button>
        </p>
        <p className="mt-4 text-sm">
          <Link
            href="/about#word-integrity"
            className="text-sage-300 underline decoration-sage-300/40 underline-offset-4 transition-colors hover:text-gold-300"
          >
            See how we check every word
          </Link>
        </p>
      </div>
      {choice.open && (
        <VideoChoiceModal
          onClose={choice.closeChoice}
          videoId={FILM_ID}
          title={FILM_TITLE}
          youtubeUrl={FILM_URL}
        />
      )}
    </section>
  );
}
