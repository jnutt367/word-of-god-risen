"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { dailyVerse, type DailyVerse } from "@/lib/daily-verses";

/**
 * Verse of the Day — a real card in the share card's family: the app's
 * scene art under a soft dark veil, the TruVINE emblem, and one well-loved
 * verse in the app's own World English Bible wording, exactly as the
 * reader prints it. The verse is chosen deterministically from the
 * calendar date (see lib/daily-verses), so every visitor sees the same
 * verse on the same day — no randomness, no external fetch.
 *
 * The whole card is a door: tapping it opens that verse's chapter.
 *
 * The card also RESERVES its settled height from first paint (the
 * min-heights on the section below). The shell that paints first is
 * ~310px shorter than the loaded card, and everything under it —
 * including the Earth map that shared links point at (#earth-map) —
 * would be shoved down by that growth after the browser's one-time
 * fragment jump, landing readers well past the map. The steps are the
 * tallest settled height of any verse in the rotation, measured from
 * the rendered card at each width band (the height only changes when
 * the longest verse gains or loses a wrapped line), plus 2px of
 * rounding headroom — so the card never grows after load, on any day.
 * The verse block centers in the reserved space on shorter days.
 */

/* The calendar date is the external store here: it never changes during
 * a visit, so the subscription is a no-op and the snapshot is simply
 * re-read on render. The server snapshot is "not yet" — the card first
 * paints its quiet shell, then settles to today's verse on the client,
 * whose own calendar decides which day "today" is. */
const subscribe = () => () => {};
const serverSnapshot = () => null;

let cachedDay = "";
let cachedToday: { verse: DailyVerse; background: string } | null = null;

function todaySnapshot(): { verse: DailyVerse; background: string } | null {
  const now = new Date();
  const day = now.toDateString();
  if (cachedDay !== day) {
    cachedDay = day;
    cachedToday = dailyVerse(now);
  }
  return cachedToday;
}

export default function VerseOfDay() {
  const today = useSyncExternalStore(subscribe, todaySnapshot, serverSnapshot);
  const verse = today?.verse ?? null;

  // Mirror the share card: it adds its own quote marks only when the
  // verse does not bring its own (a verse that opens mid-speech already
  // begins with a quote, and doubling it looks like a typo).
  const trimmed = verse?.text.trim() ?? "";
  const opensQuoted = /^["\u201C\u2018]/.test(trimmed);
  const closesQuoted = /["\u201D\u2019]$/.test(trimmed);
  const displayText = verse
    ? `${opensQuoted ? "" : "\u201C"}${trimmed}${closesQuoted ? "" : "\u201D"}`
    : "";

  return (
    <section
      aria-label="Verse of the day"
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gold-500/25 shadow-[0_10px_36px_rgba(0,0,0,0.35)] min-h-[508px] min-[350px]:min-h-[475.5px] min-[380px]:min-h-[443px] min-[430px]:min-h-[410.5px] min-[520px]:min-h-[378px] min-[640px]:min-h-[459px] min-[660px]:min-h-[420px]"
    >
      {/* Scene art + readability veil, the share card's own treatment */}
      <div aria-hidden="true" className="absolute inset-0 bg-vineyard-950">
        {today && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.03]"
            style={{ backgroundImage: `url(${today.background})` }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(8,18,12,0.55), rgba(8,18,12,0.35) 50%, rgba(8,18,12,0.65))",
          }}
        />
      </div>

      {verse ? (
        <Link
          href={verse.href}
          aria-label={`Verse of the day, ${verse.ref}. Read ${verse.book} chapter ${verse.chapter}.`}
          className="relative my-auto block px-6 py-8 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-300 sm:px-10 sm:py-10"
        >
          <Image
            src="/images/truvine-emblem.png"
            alt=""
            width={249}
            height={192}
            className="mx-auto h-14 w-auto"
          />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-400">
            Verse of the day
          </p>
          <blockquote className="mx-auto mt-4 max-w-2xl font-scripture text-xl italic leading-relaxed text-cream-100 sm:text-2xl">
            {displayText}
          </blockquote>
          <p className="mt-4 font-scripture text-base font-bold text-gold-400">
            {verse.ref}
          </p>
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.16em] text-cream-100/70">
            Read {verse.book} {verse.chapter}{" "}
            <span aria-hidden="true">&rarr;</span>
          </p>
        </Link>
      ) : (
        <div className="relative my-auto px-6 py-8 text-center sm:px-10 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-400">
            Verse of the day
          </p>
          <p className="mx-auto mt-4 max-w-2xl font-scripture text-xl italic leading-relaxed text-cream-100 sm:text-2xl">
            Loading today&rsquo;s verse&hellip;
          </p>
        </div>
      )}
    </section>
  );
}
