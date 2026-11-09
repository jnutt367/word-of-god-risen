"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  if (today === null) return null;
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
      <p className="mt-6 text-center text-xs leading-relaxed text-sage-300">
        Global Bible Month was launched by YouVersion, Glorify, and
        Hallow. We&rsquo;re joining believers all over the world — one
        chapter a day.
      </p>
    </section>
  );
}
