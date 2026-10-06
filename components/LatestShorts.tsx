"use client";

import { useEffect, useState } from "react";
import YouTubeThumb from "./YouTubeThumb";

interface ShortItem {
  id: string;
  title: string;
  published: string;
}

/**
 * Horizontal shelf of Jason's latest YouTube Shorts, auto-updating from
 * the channel RSS feed (via /api/shorts). Zero maintenance.
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
    <section aria-label="Latest Shorts from TruVINE" className="mt-16">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
            From the channel
          </p>
          <h2 className="mt-1 font-display text-2xl text-cream-100 sm:text-3xl">
            Latest Shorts from{" "}
            <span className="text-truvine-gradient">TruVINE</span>
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
            <a
              key={v.id}
              href={`https://www.youtube.com/shorts/${v.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group w-40 shrink-0"
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
      </div>
    </section>
  );
}
