"use client";

import Link from "next/link";
import { usePlans } from "@/components/PlanProvider";
import { getPlan, currentDay, planProgress } from "@/lib/plans";

export default function PlanContinue() {
  const { activePlanId, doneDays } = usePlans();

  if (!activePlanId) return null;
  const plan = getPlan(activePlanId);
  if (!plan) return null;

  const done = doneDays(plan.id);
  const now = currentDay(plan, done);
  if (now === null) return null;
  const pct = planProgress(plan, done);
  const today = plan.days.find((d) => d.day === now);

  return (
    <section
      aria-label="Continue your reading plan"
      className="flex flex-col items-center gap-4 rounded-2xl border border-gold-500/25 bg-gradient-to-br from-vineyard-800 to-vineyard-900 p-6 text-center sm:flex-row sm:justify-between sm:text-left"
    >
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-400">
          Your reading plan
        </p>
        <p className="mt-2 font-display text-xl text-cream-100">
          {plan.title}
          {today ? (
            <span className="text-sage-300"> — Day {now}: {today.title}</span>
          ) : null}
        </p>
        <div className="mx-auto mt-3 h-1.5 max-w-md overflow-hidden rounded-full bg-vineyard-950/60 sm:mx-0">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-sage-400">
          Day {now} of {plan.totalDays} · {pct}% complete
        </p>
      </div>
      <Link
        href={`/plans/${plan.id}`}
        className="shrink-0 rounded-lg bg-gold-500 px-5 py-3 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400"
      >
        Continue plan →
      </Link>
    </section>
  );
}
