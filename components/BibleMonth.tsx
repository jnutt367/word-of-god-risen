"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import YouTubeThumb from "./YouTubeThumb";
import { useVideoChoice, VideoChoiceModal } from "./VideoChoice";
import snapshot from "@/data/shorts-snapshot.json";

/**
 * Global Bible Month — the homepage's November dressing (Jason,
 * Nov 9, 2026: "Banner + a Global Bible Month section").
 *
 * Two pieces, one calendar: a slim banner above everything on the
 * homepage, and a section under the hero carrying all thirty day
 * doors. Both render ONLY during November 1–30, 2026 — dated by
 * the visitor's day in America/New_York, the house's calendar day
 * (the same derivation as lib/heartbeat-date.ts) — and both take
 * themselves down on December 1 with no further work.
 *
 * The day is computed here on the client, never at build time:
 * these pieces mount empty and fill in once the browser knows its
 * New York date, so the "Day N of 30" line is always the
 * visitor's own today, never a fossil from when the site was last
 * built. Before mount (and outside the window) they render
 * nothing at all.
 *
 * The journey: Days 1–16 walk the Gospel of Mark, chapters 1–16;
 * Days 17–30 walk 1 Corinthians, chapters 1–14. Every door opens
 * its chapter right here in the app — /book/<slug>/<chapter-1>,
 * the reader's zero-based chapter pattern, the same one the
 * hero's own doors use (/book/mark/0 is Mark chapter 1).
 *
 * Under the doors, the section also carries the days' Shorts —
 * "Watch the journey so far" (Jason, Nov 9, 2026) — paired with
 * the chapters they came from. See JOURNEY_WATCH below for the
 * day → video list and how a new day joins it.
 */

interface BibleMonthDay {
  day: number;
  book: string;
  slug: string;
  chapter: number;
  href: string;
}

const DAYS: BibleMonthDay[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const inMark = day <= 16;
  const chapter = inMark ? day : day - 16;
  const slug = inMark ? "mark" : "corinthians-1";
  return {
    day,
    book: inMark ? "Mark" : "1 Corinthians",
    slug,
    chapter,
    href: `/book/${slug}/${chapter - 1}`,
  };
});

/**
 * "Watch the journey so far" — the month's daily Shorts, paired
 * with the day doors above (Jason, Nov 9, 2026). ONE explicit
 * day → video list: a future day joins by appending ONE entry
 * here the night it publishes — never before, because a tile for
 * an unpublished video would be a lie. (Day 1 carries two: the
 * Introduction and the Mark 1 Scripture Short, the double-barrel
 * pair it published with.)
 *
 * Only the day label and the video id live here. Titles are NOT
 * written in this file: each tile's title is read from the same
 * sources the Shorts shelf itself uses — the /api/shorts feed,
 * whose fallback is the checked-in shorts snapshot — so this row
 * can never drift from the shelf's real titles. An entry whose id
 * resolves to no title in either source simply doesn't render.
 */
interface JourneyWatchEntry {
  label: string;
  id: string;
}

const JOURNEY_WATCH: JourneyWatchEntry[] = [
  { label: "Day 1 · Introduction", id: "8HU2j8BNS-Q" },
  { label: "Day 1 · Mark 1", id: "rBf6RS0zTkE" },
  { label: "Day 2", id: "1u9emv-xPqI" },
  { label: "Day 3", id: "fqsojvm1Axk" },
  { label: "Day 4", id: "2v8VP221s8E" },
  { label: "Day 5", id: "sUAY9Z6fvOE" },
  { label: "Day 6", id: "RqHiCNlbxeE" },
  { label: "Day 7", id: "98Uw2biCECE" },
  { label: "Day 8", id: "lPpuObQFH1U" },
  { label: "Day 9", id: "okKk95jr2I8" },
  { label: "Day 10", id: "Vsie10QVSsI" },
  { label: "Day 11", id: "ePjfQ3mJilI" },
  { label: "Day 12", id: "2XEMaV6m8AU" },
  { label: "Day 13", id: "uaaJAAjNxPo" },
  // Day 14 joins here the night it publishes — not before.
];

/** Titles from the checked-in snapshot — the shelf's own fallback
 * source (ShortsGrid reads the same file), so the row renders true
 * titles even before the feed answers. */
const SNAPSHOT_TITLES: Record<string, string> = Object.fromEntries(
  (snapshot as { items: { id: string; title: string }[] }).items.map(
    (s) => [s.id, s.title],
  ),
);

/**
 * One watch-row tile. The Shorts shelf's own tile (LatestShorts)
 * is not exported, and it carries no day label — exporting it
 * would mean editing the shelf, which stands untouched — so this
 * tile mirrors its structure exactly: the same thumbnail, the
 * same gold play bubble, and the same tap (VideoChoice: the film
 * plays here in the app, "Open in YouTube" resting beside it —
 * never a silent transport), with the day label riding above the
 * title.
 */
function JourneyWatchTile({
  label,
  id,
  title,
}: JourneyWatchEntry & { title: string }) {
  const choice = useVideoChoice();

  return (
    <>
      <button
        type="button"
        onClick={choice.openChoice}
        aria-haspopup="dialog"
        aria-label={`Watch here in the app — ${label}: ${title}`}
        className="group block w-40 shrink-0 cursor-pointer text-left"
      >
        <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-gold-500/15 bg-vineyard-900">
          <YouTubeThumb id={id} />
          <div className="absolute inset-0 bg-gradient-to-t from-vineyard-950/80 via-transparent to-transparent" />
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
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-gold-300">
          {label}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-sage-300 group-hover:text-gold-300">
          {title}
        </p>
      </button>
      {choice.open && (
        <VideoChoiceModal
          onClose={choice.closeChoice}
          videoId={id}
          title={title}
          youtubeUrl={`https://www.youtube.com/shorts/${id}`}
          vertical
        />
      )}
    </>
  );
}

const nyDayParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/** Today's Global Bible Month day (1–30), or null outside
 * November 1–30, 2026 in America/New_York — and null until the
 * component has mounted and honestly knows the date. */
function useBibleMonthToday(): number | null {
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => {
    const parts = nyDayParts.formatToParts(new Date());
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value);
    const year = value("year");
    const month = value("month");
    const day = value("day");
    setToday(year === 2026 && month === 11 && day >= 1 && day <= 30 ? day : null);
  }, []);
  return today;
}

/** The slim banner — deep vine green, a gold rule under it, cream
 * words, typography only (no emblem, so nothing can distort it).
 * The whole banner is a door to today's chapter. */
export function BibleMonthBanner() {
  const today = useBibleMonthToday();
  if (today === null) return null;
  const door = DAYS[today - 1];
  return (
    <Link
      href={door.href}
      aria-label={`Global Bible Month, day ${today} of 30 — open today's chapter, ${door.book} ${door.chapter}`}
      className="block border-b-2 border-gold-400 bg-vineyard-900 px-4 py-2.5 text-center transition-colors hover:bg-vineyard-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
    >
      <span className="text-sm text-cream-100">
        <span className="font-semibold uppercase tracking-[0.18em] text-gold-300">
          Global Bible Month
        </span>
        <span aria-hidden="true" className="mx-2 text-gold-400">·</span>
        November 2026
        <span aria-hidden="true" className="mx-2 text-gold-400">·</span>
        <span className="font-semibold text-cream-50">
          Day {today} of 30
        </span>
        <span aria-hidden="true" className="mx-2 text-gold-400">·</span>
        Today: {door.book} {door.chapter}
        <span className="ml-2 font-semibold text-gold-300">
          Read &amp; listen →
        </span>
      </span>
    </Link>
  );
}

/** The section — the whole month as thirty open doors. Today
 * wears gold; the days already walked read as open doors; the
 * days still ahead rest quieter. Every door opens its chapter
 * regardless — the chapters are all here now. */
export function BibleMonthSection() {
  const today = useBibleMonthToday();
  // Watch-row titles: the snapshot's titles stand first (the
  // shelf's own fallback source), then the shelf's live source —
  // /api/shorts — speaks over them wherever it names a title.
  const [watchTitles, setWatchTitles] =
    useState<Record<string, string>>(SNAPSHOT_TITLES);
  useEffect(() => {
    fetch("/api/shorts")
      .then((r) => r.json())
      .then((d) => {
        const items = (d.items ?? []) as { id: string; title: string }[];
        if (items.length === 0) return;
        setWatchTitles((prev) => {
          const next = { ...prev };
          for (const item of items) {
            if (item.id && item.title) next[item.id] = item.title;
          }
          return next;
        });
      })
      .catch(() => {
        /* the snapshot titles already stand — the row keeps them */
      });
  }, []);
  if (today === null) return null;
  // The journey so far, in JOURNEY_WATCH order (which is the
  // shelf's order for these videos — the canon list leads with
  // them). An entry with no resolved title doesn't render.
  const watchItems = JOURNEY_WATCH.flatMap((entry) => {
    const title = watchTitles[entry.id];
    return title ? [{ ...entry, title }] : [];
  });
  return (
    <section
      aria-label="Global Bible Month — one chapter a day through November"
      className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 sm:pt-12"
    >
      <p className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-gold-300">
        November 2026
      </p>
      <h2 className="mt-3 text-center font-display text-2xl text-cream-50 sm:text-3xl">
        Global Bible Month
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-center text-sage-200">
        All over the world, believers are opening God&rsquo;s Word every
        day this month — one chapter a day. Come read and listen along.
      </p>
      <p className="mt-3 text-center text-sm text-sage-300">
        Days 1–16 walk through Mark · Days 17–30 through 1 Corinthians
      </p>
      <div className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-10">
        {DAYS.map((d) => {
          const isToday = d.day === today;
          const isFuture = d.day > today;
          return (
            <Link
              key={d.day}
              href={d.href}
              aria-label={`Day ${d.day} — ${d.book} chapter ${d.chapter}${isToday ? " — today" : ""}`}
              aria-current={isToday ? "date" : undefined}
              className={
                isToday
                  ? "rounded-lg border border-gold-300 bg-gold-500 px-1.5 py-2 text-center shadow-lg transition-colors hover:bg-gold-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
                  : `rounded-lg border border-cream-100/25 px-1.5 py-2 text-center transition-colors hover:border-gold-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 ${
                      isFuture ? "opacity-55 hover:opacity-90" : ""
                    }`
              }
            >
              <span
                className={`block text-[11px] font-semibold uppercase tracking-wider ${
                  isToday ? "text-vineyard-900" : "text-gold-300"
                }`}
              >
                {isToday ? "Today" : `Day ${d.day}`}
              </span>
              <span
                className={`mt-0.5 block text-[13px] font-medium leading-tight ${
                  isToday ? "text-vineyard-950" : "text-cream-100"
                }`}
              >
                {d.book === "Mark" ? `Mark ${d.chapter}` : `1 Cor ${d.chapter}`}
              </span>
              {isToday && (
                <span className="block text-[11px] font-semibold text-vineyard-900">
                  Day {d.day}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      {watchItems.length > 0 && (
        <>
          <h3 className="mt-8 text-center text-sm font-semibold uppercase tracking-[0.22em] text-gold-300">
            Watch the journey so far
          </h3>
          <div className="-mx-4 mt-5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            <div className="flex gap-4" style={{ width: "max-content" }}>
              {watchItems.map((v) => (
                <JourneyWatchTile
                  key={v.id}
                  label={v.label}
                  id={v.id}
                  title={v.title}
                />
              ))}
            </div>
          </div>
        </>
      )}
      <p className="mt-6 text-center text-xs leading-relaxed text-sage-300">
        Global Bible Month was launched by YouVersion, Glorify, and
        Hallow. We&rsquo;re joining believers all over the world — one
        chapter a day.
      </p>
    </section>
  );
}
