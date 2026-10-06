"use client";

import { useMemo, useState } from "react";
import YouTubeThumb from "./YouTubeThumb";
import snapshot from "@/data/shorts-snapshot.json";

interface ShortItem {
  id: string;
  title: string;
}

const ALL: ShortItem[] = (snapshot as { items: ShortItem[] }).items;

/** Browsable archive of every TruVINE Short, with search. */
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
            <a
              key={v.id}
              href={`https://www.youtube.com/shorts/${v.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-gold-500/15 bg-vineyard-900">
                <YouTubeThumb id={v.id} />
                <div className="absolute inset-0 bg-gradient-to-t from-vineyard-950/80 via-transparent to-transparent" />
                <span
                  className="absolute inset-0 flex items-center justify-center text-3xl text-white opacity-80 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                >
                  ▶
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-snug text-sage-300 group-hover:text-gold-300">
                {v.title}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
