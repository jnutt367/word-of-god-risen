"use client";

import { useProgress } from "@/components/ProgressProvider";

/**
 * "Mark as watched" toggle for book overview videos.
 * Subtle and on-brand: quiet by default, gold when watched.
 */
export default function MarkWatchedButton({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const { isWatched, toggleWatched } = useProgress();
  const watched = isWatched(videoId);

  return (
    <button
      type="button"
      onClick={() => toggleWatched(videoId, title)}
      aria-pressed={watched}
      className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
        watched
          ? "border border-gold-500/40 bg-gold-500/15 text-gold-300"
          : "border border-gold-500/15 bg-vineyard-900 text-sage-300 hover:border-gold-500/40 hover:text-gold-300"
      }`}
    >
      {watched ? "✓ Watched — tap to undo" : "✓ Mark as watched"}
    </button>
  );
}
