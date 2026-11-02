"use client";

import YouTubeThumb from "./YouTubeThumb";
import CarvedDivider from "./CarvedDivider";
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
        aria-label={`Watch here in the app — ${video.title}`}
        className="group flex w-full cursor-pointer gap-4 overflow-hidden rounded-xl border border-[var(--reader-line)] bg-[var(--reader-card)] p-3 text-left transition-colors hover:border-[var(--reader-verse-num)]/50"
      >
        <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg">
          <YouTubeThumb id={video.id} />
          {/* The one play mark (Jason, Nov 2, 2026): the gold
              glowing circle at the thumbnail's top right — the
              WatchBubble treatment every video surface in the app
              wears. It replaced the plain white ▶ this card used
              to carry: gold, never YouTube red, and it means "you
              can play it HERE, inside the app." */}
          <span
            aria-hidden="true"
            className="watch-bubble-glow absolute top-1 right-1 grid h-8 w-8 place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 shadow-lg transition-transform duration-300 group-hover:scale-110"
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
      <CarvedDivider className="mb-5" />
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
