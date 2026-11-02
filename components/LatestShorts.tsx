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
        className="group block w-40 shrink-0 cursor-pointer text-left"
      >
        <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-gold-500/15 bg-vineyard-900">
          <YouTubeThumb id={v.id} />
          <div className="absolute inset-0 bg-gradient-to-t from-vineyard-950/80 via-transparent to-transparent" />
          {/* The house gold play mark (Jason, Nov 2, 2026): every
              video surface on the page wears the same unmistakable
              gold — the gold circle with the vineyard triangle that
              the film cards carry — never a plain white glyph a
              visitor might read as decoration. */}
          <span
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-400 text-vineyard-950 shadow-[0_6px_20px_rgba(0,0,0,0.5)] ring-2 ring-gold-200/40 transition-transform duration-300 group-hover:scale-110">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="ml-0.5 h-5 w-5"
              >
                <path d="M8 5.5v13l11-6.5-11-6.5z" />
              </svg>
            </span>
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
