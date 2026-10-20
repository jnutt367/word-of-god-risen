"use client";

import YouTubeThumb from "./YouTubeThumb";
import { useVideoChoice, VideoChoiceModal } from "./VideoChoice";
import { shortsUrl, type ChapterVideo } from "@/lib/videos";

/**
 * "Watch from TruVINE" — chapter-specific Shorts from Jason's channel,
 * shown on the chapters they were made about.
 *
 * A tap asks first (VideoChoice): watch here in the app, or open in
 * YouTube — it never transports the reader without asking.
 */
function WatchCardItem({ video }: { video: ChapterVideo }) {
  const choice = useVideoChoice();

  return (
    <>
      <button
        type="button"
        onClick={choice.openChoice}
        aria-haspopup="dialog"
        className="group flex w-full cursor-pointer gap-4 overflow-hidden rounded-xl border border-[var(--reader-line)] bg-[var(--reader-card)] p-3 text-left transition-colors hover:border-[var(--reader-verse-num)]/50"
      >
        <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg">
          <YouTubeThumb id={video.id} />
          <span
            className="absolute inset-0 flex items-center justify-center text-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            aria-hidden="true"
          >
            ▶
          </span>
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <p className="truncate font-medium text-[var(--reader-ink)] group-hover:underline">
            {video.title}
          </p>
          <p className="mt-0.5 text-xs text-[var(--reader-muted)]">
            {video.verse} · YouTube Short
          </p>
        </div>
      </button>
      {choice.open && (
        <VideoChoiceModal
          onClose={choice.closeChoice}
          videoId={video.id}
          title={video.title}
          youtubeUrl={shortsUrl(video.id)}
          vertical
        />
      )}
    </>
  );
}

export default function WatchCard({ videos }: { videos: ChapterVideo[] }) {
  if (videos.length === 0) return null;

  return (
    <section aria-label="Watch from TruVINE" className="mt-10">
      <div className="vine-divider mb-5" aria-hidden="true">
        <span>✦</span>
      </div>
      <h2 className="font-display text-xl text-[var(--reader-ink)]">
        Watch from <span className="text-truvine-gradient">TruVINE</span>
      </h2>
      <p className="mt-1 text-sm text-[var(--reader-muted)]">
        Short films on this very chapter, from Jason&apos;s YouTube channel.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {videos.map((v) => (
          <WatchCardItem key={v.id} video={v} />
        ))}
      </div>
    </section>
  );
}
