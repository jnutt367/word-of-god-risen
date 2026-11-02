"use client";

import { useMemo, useState } from "react";
import YouTubeThumb from "./YouTubeThumb";
import { useVideoChoice, VideoChoiceModal } from "./VideoChoice";
import snapshot from "@/data/shorts-snapshot.json";
import { isCanonShort } from "@/lib/canon-shorts";

interface ShortItem {
  id: string;
  title: string;
}

/**
 * One archive tile. A tap asks first (VideoChoice): watch here in the
 * app, or open in YouTube — never a silent transport.
 */
function ShortGridItem({ v }: { v: ShortItem }) {
  const choice = useVideoChoice();

  return (
    <>
      <button
        type="button"
        onClick={choice.openChoice}
        aria-haspopup="dialog"
        aria-label={`Watch here in the app — ${v.title}`}
        className="group block w-full cursor-pointer text-left"
      >
        <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-gold-500/15 bg-vineyard-900">
          <YouTubeThumb id={v.id} />
          <div className="absolute inset-0 bg-gradient-to-t from-vineyard-950/80 via-transparent to-transparent" />
          {/* The one play mark (Jason, Nov 2, 2026): the gold
              glowing circle at the thumbnail's top right — the
              WatchBubble treatment every video surface in the app
              wears. It replaced the plain white ▶ this grid used
              to carry: gold, never YouTube red, and it means "you
              can play it HERE, inside the app." */}
          <span
            aria-hidden="true"
            className="watch-bubble-glow absolute top-2 right-2 grid h-9 w-9 place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 shadow-lg transition-transform duration-300 group-hover:scale-110"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
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

const ALL: ShortItem[] = (snapshot as { items: ShortItem[] }).items.filter(
  (s) => isCanonShort(s.id),
);

/** Browsable archive of the site's canon Shorts (Jason's canon-only
 * law, Oct 28, 2026 — only the locked canon cast appears), with search. */
export default function ShortsGrid() {
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL;
    return ALL.filter((s) => s.title.toLowerCase().includes(q));
  }, [query]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-sage-400">
          {items.length} of {ALL.length} Shorts
          {query.trim() && (
            <>
              {" "}matching <span className="text-gold-300">“{query.trim()}”</span>
            </>
          )}
        </p>
        <label className="relative block sm:w-72">
          <span className="sr-only">Search Shorts</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by word or verse…"
            className="w-full rounded-xl border border-gold-500/20 bg-vineyard-900 px-4 py-2.5 text-sm text-cream-100 placeholder:text-sage-500 focus:border-gold-400/60 focus:outline-none"
          />
        </label>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-gold-500/15 bg-vineyard-900/60 px-6 py-12 text-center text-sage-400">
          No Shorts found. Try another word — “rest”, “faith”, “Psalm”…
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((v) => (
            <ShortGridItem key={v.id} v={v} />
          ))}
        </div>
      )}
    </div>
  );
}
