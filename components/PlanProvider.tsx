"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useProgress } from "@/components/ProgressProvider";
import { getPlan } from "@/lib/plans";

interface PlanState {
  startedAt: string;
  lastActiveAt: number;
  doneDays: number[];
}

type PlanMap = Record<string, PlanState>;

const STORE_KEY = "wogr_plans_v1";

function load(): PlanMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function save(map: PlanMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

interface PlanCtx {
  map: PlanMap;
  isStarted: (planId: string) => boolean;
  start: (planId: string) => void;
  completeDay: (planId: string, day: number) => void;
  uncompleteDay: (planId: string, day: number) => void;
  doneDays: (planId: string) => number[];
  /** Most recently active unfinished plan, if any. */
  activePlanId: string | null;
}

const Ctx = createContext<PlanCtx | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<PlanMap>({});
  const { markRead } = useProgress();

  useEffect(() => {
    setMap(load());
  }, []);

  const persist = useCallback((next: PlanMap) => {
    setMap(next);
    save(next);
  }, []);

  const isStarted = useCallback((planId: string) => Boolean(map[planId]), [map]);

  const start = useCallback(
    (planId: string) => {
      if (map[planId]) return;
      const now = Date.now();
      persist({
        ...map,
        [planId]: {
          startedAt: new Date(now).toISOString(),
          lastActiveAt: now,
          doneDays: [],
        },
      });
    },
    [map, persist]
  );

  const completeDay = useCallback(
    (planId: string, day: number) => {
      const plan = getPlan(planId);
      const state = map[planId];
      if (!plan || !state || state.doneDays.includes(day)) return;
      const dayDef = plan.days.find((d) => d.day === day);
      if (dayDef) {
        for (const r of dayDef.readings) {
          markRead(r.slug, r.chapter, r.title || r.label);
        }
      }
      persist({
        ...map,
        [planId]: {
          ...state,
          lastActiveAt: Date.now(),
          doneDays: [...state.doneDays, day].sort((a, b) => a - b),
        },
      });
    },
    [map, markRead, persist]
  );

  const uncompleteDay = useCallback(
    (planId: string, day: number) => {
      const state = map[planId];
      if (!state) return;
      persist({
        ...map,
        [planId]: {
          ...state,
          lastActiveAt: Date.now(),
          doneDays: state.doneDays.filter((d) => d !== day),
        },
      });
    },
    [map, persist]
  );

  const doneDays = useCallback(
    (planId: string) => map[planId]?.doneDays ?? [],
    [map]
  );

  const activePlanId = useMemo(() => {
    let best: string | null = null;
    let bestAt = -1;
    for (const [id, state] of Object.entries(map)) {
      const plan = getPlan(id);
      if (!plan) continue;
      if (state.doneDays.length >= plan.totalDays) continue;
      if (state.lastActiveAt > bestAt) {
        bestAt = state.lastActiveAt;
        best = id;
      }
    }
    return best;
  }, [map]);

  const value = useMemo<PlanCtx>(
    () => ({
      map,
      isStarted,
      start,
      completeDay,
      uncompleteDay,
      doneDays,
      activePlanId,
    }),
    [map, isStarted, start, completeDay, uncompleteDay, doneDays, activePlanId]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlans(): PlanCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlans must be used inside PlanProvider");
  return ctx;
}
