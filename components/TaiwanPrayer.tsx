"use client";

import Image from "next/image";
import { useVideoChoice, VideoChoiceModal } from "./VideoChoice";

/**
 * One Chapter Is Enough — a small, quiet card under the Body
 * Heartbeat, surfacing the prayer Short of the same name.
 *
 * The night it remembers (Oct 23, 2026): God's Word was opened in
 * Taiwan for the very first time — one chapter read — and the
 * prayer spoken over that night became a Short on the TruVINE
 * channel ("One Chapter Is Enough — God's Word Reached Taiwan
 * Tonight", published Oct 24, 2026). Jason commissioned this Short
 * for the app as well as the channel, so it rests here, beside the
 * map it was prayed over.
 *
 * Kept quiet on purpose: a heading, one line, and a plain way to
 * watch. No commerce, no asks, nothing gathered — and the card
 * follows the house law for every video door (Jason, Oct 20, 2026;
 * his word again Oct 26, 2026, for the One Chapter film: videos
 * must be watchable in the app): the tap asks first — "Watch here"
 * plays the prayer in place, in this app; "Open in YouTube" is
 * there only for readers who'd rather go. The emblem is the app's
 * own shipped mark, shown whole.
 */

// The prayer: "One Chapter Is Enough" Short (TruVINE channel).
const SHORT_ID = "MM4Re8olRzY";
const SHORT_URL = `https://youtube.com/shorts/${SHORT_ID}`;
const SHORT_TITLE = "One Chapter Is Enough — the prayer over Taiwan";

export default function TaiwanPrayer() {
  const choice = useVideoChoice();

  return (
    <section
      aria-labelledby="taiwan-prayer-heading"
      className="mx-auto max-w-6xl px-4 pb-4 pt-2 sm:px-6"
    >
      <div className="rounded-2xl border border-gold-500/15 bg-vineyard-900 px-6 py-8 text-center sm:px-10">
        <Image
          src="/images/truvine-emblem.png"
          alt=""
          width={249}
          height={192}
          className="mx-auto h-14 w-auto object-contain"
        />
        <h2
          id="taiwan-prayer-heading"
          className="mt-4 font-display text-xl text-cream-50 sm:text-2xl"
        >
          One chapter is enough
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-cream-100/85">
          God&rsquo;s Word was opened in Taiwan for the very first time —
          one chapter read, and that was enough for God to begin. Watch
          the prayer we prayed over that night.
        </p>
        <p className="mt-5">
          <button
            type="button"
            onClick={choice.openChoice}
            aria-haspopup="dialog"
            aria-label="Watch the prayer — One Chapter Is Enough, a Short"
            className="inline-block cursor-pointer rounded-lg border border-cream-100/25 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
          >
            Watch the prayer
          </button>
        </p>
      </div>
      {choice.open && (
        <VideoChoiceModal
          onClose={choice.closeChoice}
          videoId={SHORT_ID}
          title={SHORT_TITLE}
          youtubeUrl={SHORT_URL}
          vertical
        />
      )}
    </section>
  );
}
