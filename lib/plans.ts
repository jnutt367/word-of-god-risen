import plansData from "@/data/plans.json";

export interface PlanReading {
  slug: string;
  chapter: number; // index into the book's chapter list
  label: string; // "John 1"
  title: string; // chapter title from the data
}

export interface PlanDay {
  day: number;
  title: string;
  readings: PlanReading[];
}

export interface Plan {
  id: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
  totalDays: number;
  totalChapters: number;
  days: PlanDay[];
}

export function getAllPlans(): Plan[] {
  return (plansData as { plans: Plan[] }).plans;
}

export function getPlan(id: string): Plan | undefined {
  return getAllPlans().find((p) => p.id === id);
}

/** First day not yet completed (1-based), or null when finished. */
export function currentDay(plan: Plan, doneDays: number[]): number | null {
  const done = new Set(doneDays);
  for (const d of plan.days) {
    if (!done.has(d.day)) return d.day;
  }
  return null;
}

export function planProgress(plan: Plan, doneDays: number[]): number {
  if (plan.totalDays === 0) return 0;
  return Math.round((doneDays.length / plan.totalDays) * 100);
}
