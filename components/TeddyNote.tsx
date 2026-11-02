"use client";

import Image from "next/image";
import Link from "next/link";
import { useVideoChoice, VideoChoiceModal } from "./VideoChoice";

/**
 * A note from Grandpa Teddy — born as his postscript under "Meet
 * Grandpa Teddy" (Jason, Oct 26, 2026): "hey, I have a little bit
 * more to tell you here" — pointing to the long-form film
 * "One Chapter Is Enough" and telling every visitor, up front,
 * that the readings are being tested word for word and that any
 * chapter can be flagged from its own page. On Oct 27, 2026 Jason
 * moved the full film into the homepage's featured spot — directly
 * under the Body Heartbeat, where the Taiwan prayer Short's card
 * rested until that day. On Nov 2, 2026 it led the page for one
 * morning, until Jason ruled the introduction (the welcome film)
 * leads instead — so this note, the film's one presence on the
 * page, rests directly under Meet Grandpa Teddy now, back in the
 * postscript home where it began. Its id="film" anchor travels
 * with it; the YouTube door for the film lands here.
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
      id="film"
      aria-labelledby="teddy-note-heading"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-5 sm:px-6"
    >
      <div className="rounded-2xl border border-gold-500/15 bg-vineyard-900 px-6 py-8 text-center sm:px-10">
        <button
          type="button"
          onClick={choice.openChoice}
          aria-haspopup="dialog"
          aria-label="Watch the story here in the app — One Chapter Is Enough, the film"
          className="group relative mx-auto block w-full max-w-xl cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
        >
          <Image
            src="/images/one-chapter-film-thumb.webp"
            alt="The film's thumbnail: Grandpa Teddy bowed in prayer at a table in lantern light, beneath the title One Chapter Is Enough"
            width={960}
            height={540}
            className="w-full rounded-xl border border-gold-500/20 object-cover transition-colors group-hover:border-gold-400"
          />
          {/* The one play mark (Jason, Nov 2, 2026): the gold
              glowing circle at the thumbnail's top right — the
              WatchBubble treatment every video surface in the app
              now wears. It replaced this card's centered gold
              medallion the day Jason ruled the mark identical
              everywhere: gold, never YouTube red, and it means
              "you can play it HERE, inside the app." */}
          <span
            aria-hidden="true"
            className="watch-bubble-glow absolute top-3 right-3 grid h-10 w-10 place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 shadow-lg transition-transform duration-300 group-hover:scale-110"
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
            aria-label="Watch the story here in the app — One Chapter Is Enough, the film"
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
