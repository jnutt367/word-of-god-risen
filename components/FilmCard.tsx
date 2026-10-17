import YouTubeThumb from "./YouTubeThumb";
import { filmUrl, type ChapterFilm } from "@/lib/films";

/**
 * "Watch the animated film" — for chapters that have an animated Gospel
 * film on the TruVINE channel, a card beside the chapter's Listen
 * controls offering the film: the same chapter, read word-for-word by
 * Grandpa Teddy, told on screen.
 */
export default function FilmCard({ film }: { film: ChapterFilm | null }) {
  if (!film) return null;

  return (
    <section aria-label="Watch the animated film" className="mb-8">
      <a
        href={filmUrl(film.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 overflow-hidden rounded-xl border border-[var(--reader-line)] bg-[var(--reader-card)] p-3 transition-colors hover:border-[var(--reader-verse-num)]/50"
      >
        <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg sm:w-44">
          <YouTubeThumb id={film.id} />
          <span
            className="absolute inset-0 flex items-center justify-center text-2xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            aria-hidden="true"
          >
            ▶
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
      </a>
    </section>
  );
}
