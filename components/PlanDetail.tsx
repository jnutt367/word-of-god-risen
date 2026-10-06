"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPlan, currentDay, planProgress } from "@/lib/plans";
import { usePlans } from "@/components/PlanProvider";

export default function PlanDetailPage({ planId }: { planId: string }) {
  const plan = getPlan(planId);
  const { isStarted, start, completeDay, uncompleteDay, doneDays } = usePlans();
  const [openDay, setOpenDay] = useState<number | null>(null);

  if (!plan) notFound();

  const started = isStarted(plan.id);
  const done = doneDays(plan.id);
  const doneSet = new Set(done);
  const now = currentDay(plan, done);
  const pct = planProgress(plan, done);
  const finished = started && now === null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/plans"
        className="text-sm font-medium text-sage-400 hover:text-gold-300"
      >
        ← All plans
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gold-500/15 bg-vineyard-900">
        <div className="relative aspect-[21/9]">
          <Image
            src={plan.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-vineyard-950 via-vineyard-950/30 to-transparent" />
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
            {plan.tagline}
          </p>
          <h1 className="mt-2 font-display text-3xl text-cream-50 sm:text-4xl">
            {plan.title}
          </h1>
          <p className="mt-3 leading-relaxed text-sage-300">
            {plan.description}
          </p>

          <div className="mt-6">
            {!started ? (
              <button
                type="button"
                onClick={() => start(plan.id)}
                className="rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400"
              >
                Start this plan
              </button>
            ) : finished ? (
              <div className="rounded-xl border border-gold-500/40 bg-gold-500/10 p-5 text-center">
                <p className="font-display text-xl text-gold-300">
                  ✦ Plan complete — well done, good and faithful reader.
                </p>
                <p className="mt-1 text-sm text-sage-300">
                  All {plan.totalDays} days finished. Pick another plan to
                  keep going.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-sage-300">
                    Day {now} of {plan.totalDays}
                  </p>
                  <p className="text-sm font-semibold text-gold-300">{pct}%</p>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-vineyard-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-truvine-green transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Day list */}
      <ol className="mt-8 space-y-3">
        {plan.days.map((d) => {
          const isDone = doneSet.has(d.day);
          const isCurrent = started && now === d.day;
          const open = openDay === d.day;
          return (
            <li
              key={d.day}
              className={`overflow-hidden rounded-xl border transition-colors ${
                isCurrent
                  ? "border-gold-500/50 bg-vineyard-900"
                  : "border-gold-500/15 bg-vineyard-900/60"
              } ${isDone ? "opacity-70" : ""}`}
            >
              <div className="flex items-center gap-4 p-4">
                <button
                  type="button"
                  disabled={!started}
                  onClick={() =>
                    isDone
                      ? uncompleteDay(plan.id, d.day)
                      : completeDay(plan.id, d.day)
                  }
                  aria-label={
                    isDone
                      ? `Mark day ${d.day} not done`
                      : `Mark day ${d.day} done`
                  }
                  aria-pressed={isDone}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-lg transition-all ${
                    isDone
                      ? "border-gold-400 bg-gold-500 text-vineyard-950"
                      : "border-sage-500 text-transparent hover:border-gold-400"
                  } ${!started ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => setOpenDay(open ? null : d.day)}
                  className="flex flex-1 items-center justify-between gap-3 text-left"
                  aria-expanded={open}
                >
                  <span>
                    <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-sage-400">
                      Day {d.day}
                      {isCurrent && (
                        <span className="ml-2 text-gold-300">· today</span>
                      )}
                    </span>
                    <span
                      className={`block font-display text-lg ${
                        isDone
                          ? "text-sage-400 line-through"
                          : "text-cream-100"
                      }`}
                    >
                      {d.title}
                    </span>
                  </span>
                  <span
                    className={`text-sage-400 transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>
              </div>
              {open && (
                <div className="border-t border-gold-500/10 px-4 py-3 pl-[4.25rem]">
                  <ul className="space-y-1.5">
                    {d.readings.map((r) => (
                      <li key={`${r.slug}-${r.chapter}`}>
                        <Link
                          href={`/book/${r.slug}/${r.chapter}`}
                          className="group flex items-baseline justify-between gap-3 text-sm"
                        >
                          <span className="font-medium text-gold-300 group-hover:underline">
                            {r.label}
                          </span>
                          {r.title && (
                            <span className="truncate text-right text-sage-400">
                              {r.title}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {!isDone && started && (
                    <button
                      type="button"
                      onClick={() => completeDay(plan.id, d.day)}
                      className="mt-3 rounded-lg bg-vineyard-800 px-4 py-2 text-xs font-semibold text-gold-300 transition-colors hover:bg-vineyard-700"
                    >
                      ✓ Mark day {d.day} complete
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!started && (
        <p className="mt-6 text-center text-sm text-sage-400">
          Start the plan above to begin checking off days.
        </p>
      )}
    </div>
  );
}
