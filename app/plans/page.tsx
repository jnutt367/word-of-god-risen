"use client";

import Link from "next/link";
import Image from "next/image";
import { getAllPlans, planProgress } from "@/lib/plans";
import { usePlans } from "@/components/PlanProvider";

export default function PlansPage() {
  const plans = getAllPlans();
  const { isStarted, doneDays } = usePlans();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
        Reading plans
      </p>
      <h1 className="mt-2 font-display text-3xl text-cream-50 sm:text-4xl">
        Read with purpose
      </h1>
      <p className="mt-3 max-w-2xl text-sage-300">
        A chapter a day keeps you in the Word. Pick a plan, check off each
        day as you read, and watch your progress grow — finishing a day
        marks its chapters read, too.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {plans.map((plan) => {
          const started = isStarted(plan.id);
          const done = doneDays(plan.id).length;
          const pct = planProgress(plan, doneDays(plan.id));
          const finished = started && done >= plan.totalDays;
          return (
            <Link
              key={plan.id}
              href={`/plans/${plan.id}`}
              className="group overflow-hidden rounded-2xl border border-gold-500/15 bg-vineyard-900 transition-all hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
            >
              <div className="relative aspect-[21/10] overflow-hidden">
                <Image
                  src={plan.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-vineyard-950/90 via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-vineyard-950/80 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-gold-300 backdrop-blur">
                  {plan.tagline}
                </span>
                {finished && (
                  <span className="absolute right-4 top-4 rounded-full bg-gold-500 px-3 py-1 text-[0.7rem] font-semibold text-vineyard-950">
                    ✓ Complete
                  </span>
                )}
              </div>
              <div className="p-5 sm:p-6">
                <h2 className="font-display text-2xl text-cream-100 group-hover:text-gold-300">
                  {plan.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-sage-300">
                  {plan.description}
                </p>
                {started && !finished && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-sage-400">
                      Day {done + 1} of {plan.totalDays} · {pct}%
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-vineyard-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
                {!started && (
                  <p className="mt-4 text-sm font-semibold text-gold-400">
                    Start this plan →
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
