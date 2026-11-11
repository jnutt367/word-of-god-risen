"use client";

import YouTubeThumb from "./YouTubeThumb";
import { useVideoChoice, VideoChoiceModal } from "./VideoChoice";
import { dayShortUrl, type DayShort } from "@/lib/day-shorts";

/**
 * The day's Short, on its own chapter page (Jason, Nov 10, 2026):
 * readers asked for more ways into the Shorts from inside the app,
 * so every Global Bible Month chapter page carries its day's Short
 * as a door under the chapter heading — its real thumbnail, its day
 * and its verse in plain words, known at a glance. The chapter
 * itself stays the page's destination (the homepage day doors still
 * open the chapter first); this is a second door beside it.
 *
 * The tap is the app's one video door (VideoChoice): the Short
 * plays here, immediately, "Open in YouTube" resting beside it.
 */
export default function DayShortCard({
  dayShort,
}: {
  dayShort: DayShort | null;
}) {
  const choice = useVideoChoice();
  if (!dayShort) return null;

  return (
    <section
      aria-label={`Watch Day ${dayShort.day} — the Short filmed from this chapter`}
      className="mb-8"
    >
      <button
        type="button"
        onClick={choice.openChoice}
        aria-haspopup="dialog"
        aria-label={`Watch here in the app — Day ${dayShort.day}: ${dayShort.hook} (${dayShort.verse})`}
        className="group flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-xl border border-[var(--reader-line)] bg-[var(--reader-card)] p-3 text-left transition-colors hover:border-[var(--reader-verse-num)]/50"
      >
        {/* The Short's own thumbnail — vertical, as Shorts are. */}
        <div className="relative aspect-[9/16] w-14 shrink-0 overflow-hidden rounded-lg sm:w-16">
          <YouTubeThumb id={dayShort.id} />
          {/* The one play mark (Jason, Nov 2, 2026): the gold
              glowing circle — the same WatchBubble treatment the
              film card beside this one wears. */}
          <span
            aria-hidden="true"
            className="watch-bubble-glow absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 shadow-lg transition-transform duration-300 group-hover:scale-110"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 ml-[1px]"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M8 5.5v13l11-6.5-11-6.5z"
                fill="var(--color-gold-400)"
              />
            </svg>
          </span>
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--reader-verse-num)]">
            Global Bible Month · Day {dayShort.day}
          </p>
          <p className="mt-1 font-medium text-[var(--reader-ink)] group-hover:underline">
            Watch Day {dayShort.day} — &ldquo;{dayShort.hook}&rdquo; (
            {dayShort.verse})
          </p>
          <p className="mt-0.5 text-sm text-[var(--reader-muted)]">
            The 1-minute film of this chapter — this chapter&rsquo;s own
            moment, told on screen.
          </p>
        </div>
      </button>
      {choice.open && (
        <VideoChoiceModal
          onClose={choice.closeChoice}
          videoId={dayShort.id}
          title={dayShort.title}
          youtubeUrl={dayShortUrl(dayShort.id)}
          vertical
        />
      )}
    </section>
  );
}
