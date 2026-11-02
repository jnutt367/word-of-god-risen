"use client";

import Image from "next/image";
import YouTubeThumb from "./YouTubeThumb";
import { useVideoChoice, VideoChoiceModal } from "./VideoChoice";
import { filmUrl, type ChapterFilm } from "@/lib/films";

/**
 * "Watch the animated film" — for chapters that have an animated Gospel
 * film on the TruVINE channel, a card beside the chapter's Listen
 * controls offering the film: the same chapter, read word-for-word by
 * Grandpa Teddy, told on screen.
 *
 * The tap asks first (VideoChoice): watch here in the app, or open in
 * YouTube — it never transports the reader without asking.
 */
export default function FilmCard({ film }: { film: ChapterFilm | null }) {
  const choice = useVideoChoice();
  if (!film) return null;

  return (
    <section aria-label="Watch the animated film" className="mb-8">
      <button
        type="button"
        onClick={choice.openChoice}
        aria-haspopup="dialog"
        aria-label={`Watch the animated film here in the app — ${film.title}`}
        className="group flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-xl border border-[var(--reader-line)] bg-[var(--reader-card)] p-3 text-left transition-colors hover:border-[var(--reader-verse-num)]/50"
      >
        <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg sm:w-44">
          {film.image ? (
            <Image
              src={film.image}
              alt={film.imageAlt ?? ""}
              fill
              sizes="(max-width: 640px) 128px, 176px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <YouTubeThumb id={film.id} />
          )}
          {/* The one play mark (Jason, Nov 2, 2026): the gold
              glowing circle at the thumbnail's top right — the
              WatchBubble treatment every video surface in the app
              wears. It replaced the plain white ▶ this card used
              to carry: gold, never YouTube red, and it means "you
              can play it HERE, inside the app." */}
          <span
            aria-hidden="true"
            className="watch-bubble-glow absolute top-1.5 right-1.5 grid h-8 w-8 place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 shadow-lg transition-transform duration-300 group-hover:scale-110"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
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
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--reader-verse-num)]">
            Watch the animated film
          </p>
          <p className="mt-1 font-medium text-[var(--reader-ink)] group-hover:underline">
            {film.title} — the animated film of this chapter, on YouTube
          </p>
          <p className="mt-0.5 text-sm text-[var(--reader-muted)]">
            {film.note}
          </p>
        </div>
      </button>
      {choice.open && (
        <VideoChoiceModal
          onClose={choice.closeChoice}
          videoId={film.id}
          title={film.title}
          youtubeUrl={filmUrl(film.id)}
        />
      )}
    </section>
  );
}
