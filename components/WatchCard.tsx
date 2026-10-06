import Image from "next/image";
import { shortsUrl, thumbnailUrl, type ChapterVideo } from "@/lib/videos";

/**
 * "Watch from TruVINE" — chapter-specific Shorts from Jason's channel,
 * shown on the chapters they were made about.
 */
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
          <a
            key={v.id}
            href={shortsUrl(v.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-4 overflow-hidden rounded-xl border border-[var(--reader-line)] bg-[var(--reader-card)] p-3 transition-colors hover:border-[var(--reader-verse-num)]/50"
          >
            <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={thumbnailUrl(v.id)}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
              <span
                className="absolute inset-0 flex items-center justify-center text-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                aria-hidden="true"
              >
                ▶
              </span>
            </div>
            <div className="flex min-w-0 flex-col justify-center">
              <p className="truncate font-medium text-[var(--reader-ink)] group-hover:underline">
                {v.title}
              </p>
              <p className="mt-0.5 text-xs text-[var(--reader-muted)]">
                {v.verse} · YouTube Short
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
