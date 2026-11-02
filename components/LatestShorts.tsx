"use client";

import { useEffect, useState } from "react";
import YouTubeThumb from "./YouTubeThumb";
import { useVideoChoice, VideoChoiceModal } from "./VideoChoice";

interface ShortItem {
  id: string;
  title: string;
  published: string;
}

/**
 * One shelf tile. A tap asks first (VideoChoice): watch here in the
 * app, or open in YouTube — never a silent transport.
 */
function ShortShelfItem({ v }: { v: ShortItem }) {
  const choice = useVideoChoice();

  return (
    <>
      <button
        type="button"
        onClick={choice.openChoice}
        aria-haspopup="dialog"
        aria-label={`Watch here in the app — ${v.title}`}
        className="group block w-40 shrink-0 cursor-pointer text-left"
      >
        <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-gold-500/15 bg-vineyard-900">
          <YouTubeThumb id={v.id} />
          <div className="absolute inset-0 bg-gradient-to-t from-vineyard-950/80 via-transparent to-transparent" />
          {/* The one play mark (Jason, Nov 2, 2026): the gold
              glowing circle at the thumbnail's top right — the
              WatchBubble treatment every video surface in the app
              wears, identical everywhere, so one learned mark is
              trusted everywhere. Gold, never YouTube red, and it
              means "you can play it HERE, inside the app, without
              going to YouTube." */}
          <span
            aria-hidden="true"
            className="watch-bubble-glow absolute top-2 right-2 grid h-9 w-9 place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 shadow-lg transition-transform duration-300 group-hover:scale-110"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] ml-0.5"
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
        <p className="mt-2 line-clamp-2 text-xs leading-snug text-sage-300 group-hover:text-gold-300">
          {v.title}
        </p>
      </button>
      {choice.open && (
        <VideoChoiceModal
          onClose={choice.closeChoice}
          videoId={v.id}
          title={v.title}
          youtubeUrl={`https://www.youtube.com/shorts/${v.id}`}
          vertical
        />
      )}
    </>
  );
}

/**
 * Horizontal shelf of canon film Shorts, served by /api/shorts, which
 * filters the channel feed to the canon list (lib/canon-shorts.ts) —
 * Jason's canon-only law, Oct 28, 2026.
 */
export default function LatestShorts() {
  const [items, setItems] = useState<ShortItem[] | null>(null);

  useEffect(() => {
    fetch("/api/shorts")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section aria-label="Shorts from the farm" className="mt-16">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
            From the farm
          </p>
          <h2 className="mt-1 font-display text-2xl text-cream-100 sm:text-3xl">
            Shorts from the{" "}
            <span className="text-truvine-gradient">Farm</span>
          </h2>
        </div>
        <a
          href="https://www.youtube.com/@TruVINE365"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm font-medium text-sage-300 hover:text-gold-300"
        >
          Visit channel →
        </a>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        <div className="flex gap-4" style={{ width: "max-content" }}>
          {items.map((v) => (
            <ShortShelfItem key={v.id} v={v} />
          ))}
        </div>
      </div>
    </section>
  );
}
