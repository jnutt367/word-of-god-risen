"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The first-visit arrow tour (Jason, Nov 11, 2026) — the dashboard
 * teaches its own doors. A first-time visitor watches five little
 * gold arrows arrive ONE AT A TIME, each with its one word, each
 * bubble breathing a soft golden ring while it is named:
 *
 *   Watch → the hero's gold play bubble (the welcome film)
 *   Read → the hero's book bubble (Genesis 1)
 *   Listen → the hero's speaker bubble (Teddy reads Mark 1)
 *   Search → the hero's magnifying-glass bubble (/search)
 *   Earth Map → the map below (the tour first scrolls it into
 *   view, then the arrow points down at it)
 *
 * Jason's reason: visitors land and never learn what to tap —
 * California comes ~50 times a day and clicks nothing. The tour
 * is the page pointing at itself, once, the way Teddy points at
 * the Listen button on a reader's first chapter.
 *
 * The house rules, whole:
 * - FIRST VISIT ONLY, remembered in the visitor's own browser
 *   (wogr_arrow_tour_v1) — no accounts, no server state, and no
 *   heartbeat/analytics beat of any kind. The tour is silent.
 * - IT QUEUES BEHIND TEDDY. The Ask Teddy welcome auto-opens at
 *   most twice for a reader who has never met him (his key:
 *   wogr_teddy_welcome_v2). On a true first visit both would
 *   speak at once — so while the welcome still has chances with
 *   this visitor, the tour waits (see the "handoff" below) and
 *   offers itself plainly meanwhile via its invite pill.
 * - THE HANDOFF IS SAME-TAB HONEST. localStorage writes only
 *   raise "storage" events in OTHER tabs, so on the homepage
 *   itself the tour listens for the ARROW_TOUR_START_EVENT —
 *   Ask Teddy calls askTeddyStartArrowTour() (lib/arrow-tour.ts)
 *   in the same breath as it marks the visitor met, whichever
 *   door they took (self-open, chip, message, voice). Cross-tab,
 *   a "storage" listener covers the welcome settling in another
 *   tab. Either way the tour starts ~half a second after Teddy
 *   is done, never over him.
 * - TEDDY NEVER AUTO-OPENS ON THE HOMEPAGE ANYWAY — it waits
 *   for a scroll there — so a first visit that never scrolls
 *   leaves the welcome pending forever; the tour does not wait
 *   forever with it. After a generous grace (12s) it introduces
 *   itself anyway: Teddy has not spoken, the tour speaks, and
 *   Teddy keeps his chances for later in the visit.
 * - NEVER TRAPS. A pointer tap anywhere ends it, Escape ends
 *   it, the small ✕ ends it, and a tap on a named bubble DOES
 *   that bubble's own job and ends it — the callouts are pure
 *   pointer-events-none decoration and no backdrop ever dims
 *   or blocks the page.
 * - THE REPLAY RIDES TEDDY'S OWN DOOR. The invite pill under
 *   the hero bubbles offers the tour on tap until it has been
 *   seen; after that, the "New here? Teddy can show you" pill
 *   on reader pages re-arms it alongside Teddy's card (see
 *   ListenButton — it clears this flag and comes home).
 * - REDUCED MOTION changes the telling, not the teaching: no
 *   sequencing, no pulse, no auto-scroll — the five words simply
 *   stand beside their bubbles all at once until dismissed.
 */

import {
  ARROW_TOUR_KEY,
  ARROW_TOUR_START_EVENT,
  dispatchArrowTourSeen,
} from "@/lib/arrow-tour";

const TEDDY_WELCOME_KEY = "wogr_teddy_welcome_v2";
const TEDDY_WELCOME_KEY_V1 = "wogr_teddy_welcome_v1";
/** Ask Teddy's own cap on auto-opens for a never-met reader —
 * mirrored here only so the tour knows when the welcome has had
 * its chances; Ask Teddy remains the welcome's owner. */
const TEDDY_WELCOME_MAX_AUTO_OPENS = 2;

type Phase = "idle" | "invite" | "running" | "static";

const STOP_MS = 1900;
const START_DELAY_MS = 900;
/** The doorway between Teddy's welcome closing and the tour's
 * first arrow — long enough that the welcome reads as finished,
 * short enough that the tour still feels like one greeting. */
const HANDOFF_MS = 500;
/** How long the tour waits for a homepage welcome that may
 * never fire (Teddy auto-opens only on scroll here) before it
 * introduces itself anyway. */
const GRACE_MS = 12000;

/* The bubble row's geometry, shared by the tour's callouts and
 * the pulse rings below. The row is flex with gap-2 (8px) and
 * h-9 w-9 (36px) bubbles, anchored right-4 (16px) on phones and
 * right-6 (24px) from sm up, its top at top-4/top-6 — so bubble
 * number i (0 = Watch, leading) has its LEFT edge at
 * right = pad + (3 - i) * 44, and a callout for bubble i ends
 * 6px left of that edge, right = pad + (3 - i) * 44 + 42. */

function tourSeen(): boolean {
  try {
    return localStorage.getItem(ARROW_TOUR_KEY) === "seen";
  } catch {
    return true; // storage unavailable — never nag
  }
}

function markTourSeen() {
  try {
    localStorage.setItem(ARROW_TOUR_KEY, "seen");
  } catch {
    /* storage unavailable — the tour simply ends for this visit */
  }
  dispatchArrowTourSeen();
}

function welcomeSettled(): boolean {
  try {
    const raw = localStorage.getItem(TEDDY_WELCOME_KEY);
    if (!raw) {
      // No v2 note yet. A legacy v1 note means Ask Teddy will
      // migrate it to one remaining chance — not settled. No
      // note at all means the welcome hasn't run in this
      // browser — settled (Ask Teddy's session logic governs
      // any later chances; the tour may speak first).
      return localStorage.getItem(TEDDY_WELCOME_KEY_V1) == null;
    }
    const s = JSON.parse(raw) as { shown?: unknown; met?: unknown };
    if (s.met === true) return true;
    return (
      typeof s.shown === "number" && s.shown >= TEDDY_WELCOME_MAX_AUTO_OPENS
    );
  } catch {
    return true;
  }
}

/** The right-pointing arrow for the four hero-bubble stops — the
 * callout rides LEFT of its bubble (the row hugs the hero's right
 * corner, so the word must grow inward, toward the page), and the
 * arrow's tip touches the bubble's left rim. */
function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 12h14M13 6l6 6-6 6"
        fill="none"
        stroke="var(--color-gold-400)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The down-pointing arrow for the Earth Map stop — the callout
 * rests above the map card's top edge and points down at it. */
function ArrowDown() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 3v14M6 13l6 6 6-6"
        fill="none"
        stroke="var(--color-gold-400)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const WORD_CLASS =
  "text-base font-semibold whitespace-nowrap text-gold-300 [text-shadow:0_1px_8px_rgba(12,31,22,0.9)]";

const STOPS: { word: string; right: string; smRight: string }[] = [
  { word: "Watch", right: "right-[182px]", smRight: "sm:right-[198px]" },
  { word: "Read", right: "right-[138px]", smRight: "sm:right-[154px]" },
  { word: "Listen", right: "right-[94px]", smRight: "sm:right-[110px]" },
  { word: "Search", right: "right-[50px]", smRight: "sm:right-[66px]" },
];

/** The pulse ring for each hero bubble, rendered over the row by
 * the tour itself (positioned on the row's own geometry) so the
 * bubbles in page.tsx stay exactly as they were built. */
const RING_RIGHT: { right: string; smRight: string }[] = [
  { right: "right-[148px]", smRight: "sm:right-[164px]" },
  { right: "right-[104px]", smRight: "sm:right-[120px]" },
  { right: "right-[60px]", smRight: "sm:right-[76px]" },
  { right: "right-4", smRight: "sm:right-6" },
];

export default function ArrowTour() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stop, setStop] = useState(0);
  const timers = useRef<number[]>([]);
  const startedRef = useRef(false);
  /** Set the moment the tour is definitively over in this mount,
   * so a late handoff from Teddy's welcome can never revive it. */
  const doneRef = useRef(false);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const end = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    clearTimers();
    setPhase("idle");
    markTourSeen();
  }, [clearTimers]);

  const begin = useCallback(() => {
    if (startedRef.current || doneRef.current) return;
    startedRef.current = true;
    clearTimers();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) {
      // No sequencing, no pulse, no auto-scroll: all five words
      // stand beside their bubbles at once until the visitor
      // dismisses them. The Earth Map word rides the hero's own
      // "Earth Map" pill — the map's door in the first screen.
      setPhase("static");
      return;
    }
    // Defer to Teddy's panel if it is open right now (Ask Teddy
    // marks its open panel with this attribute): the tour never
    // speaks over him. Retry until he closes — a capped few
    // tries, then the invite path simply stays the offer.
    if (document.querySelector('[data-ask-teddy-open="true"]')) {
      startedRef.current = false;
      timers.current.push(window.setTimeout(begin, 1500));
      return;
    }
    setPhase("running");
    setStop(0);
    const later = (fn: () => void, ms: number) => {
      timers.current.push(window.setTimeout(fn, ms));
    };
    later(() => setStop(1), STOP_MS);
    later(() => setStop(2), STOP_MS * 2);
    later(() => setStop(3), STOP_MS * 3);
    later(() => {
      // The fifth stop has farther to go: bring the Earth map
      // into view first, then let its arrow land on it.
      document
        .getElementById("earth-map")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      setStop(4);
    }, STOP_MS * 4);
    later(() => end(), STOP_MS * 5);
  }, [clearTimers, end]);

  /* First mount: decide what this visitor gets. */
  useEffect(() => {
    if (tourSeen()) {
      doneRef.current = true;
      return;
    }
    if (!welcomeSettled()) {
      // Teddy's welcome still has a say with this visitor. The
      // tour offers itself plainly instead — the invite pill
      // under the hero bubbles — and still takes its turn once
      // he is done (the handoff listeners below) or once the
      // grace runs out, so the teaching is never silently lost.
      setPhase("invite");
      const grace = window.setTimeout(() => {
        if (welcomeSettled()) begin();
      }, GRACE_MS);
      timers.current.push(grace);
      return;
    }
    const t = window.setTimeout(begin, START_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [begin]);

  /* The handoff: the moment Ask Teddy marks this visitor met
   * (or a ListenButton re-arm asks for the tour), the tour —
   * still unseen — takes its turn. Same-tab signal first, then
   * the cross-tab "storage" twin. */
  useEffect(() => {
    const onStartSignal = () => {
      if (doneRef.current || startedRef.current) return;
      if (tourSeen()) return;
      timers.current.push(window.setTimeout(begin, HANDOFF_MS));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== TEDDY_WELCOME_KEY) return;
      if (!welcomeSettled()) return;
      onStartSignal();
    };
    window.addEventListener(ARROW_TOUR_START_EVENT, onStartSignal);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ARROW_TOUR_START_EVENT, onStartSignal);
      window.removeEventListener("storage", onStorage);
    };
  }, [begin]);

  /* Escape ends the tour, like every other helper in this app. */
  useEffect(() => {
    if (phase !== "running" && phase !== "static") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") end();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase, end]);

  /* A tap anywhere that is not one of the tour's own controls
   * ends it. The callouts themselves are pointer-events-none, so
   * a tap aimed at a named bubble lands on the bubble: this
   * runs on the bubble's own pointerdown, ends the tour first,
   * and the bubble's click then does its job untouched. */
  const endOnPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-arrow-tour-ui]")) return;
    end();
  };

  if (phase === "idle") return null;

  const showStop = (i: number) =>
    phase === "static" || (phase === "running" && stop === i);

  return (
    <div
      role="group"
      aria-label="A short tour: Watch, Read, Listen, Search, and the Earth Map"
      onPointerDown={
        phase === "running" || phase === "static"
          ? endOnPointerDown
          : undefined
      }
      className="contents"
    >
      {/* Stops 1–4 — the hero bubbles. Each callout rides left of
          its bubble, word first, arrow tip at the bubble's rim;
          the pointed bubble breathes the golden ring. */}
      {STOPS.map(
        (s, i) =>
          showStop(i) && (
            <span key={s.word} className="contents">
              <span
                aria-hidden="true"
                className={`arrow-tour-callout pointer-events-none absolute top-4 z-30 flex h-9 items-center gap-1 sm:top-6 ${s.right} ${s.smRight}`}
              >
                <span className={WORD_CLASS}>{s.word}</span>
                <ArrowRight />
              </span>
              {phase === "running" && (
                <span
                  aria-hidden="true"
                  className={`teddy-point pointer-events-none absolute top-4 z-30 h-9 w-9 rounded-full sm:top-6 ${RING_RIGHT[i].right} ${RING_RIGHT[i].smRight}`}
                />
              )}
            </span>
          )
      )}

      {/* Stop 5 — the Earth Map, animated telling: the callout
          stands directly under the hero bubble row while the
          scroll carries the visitor down to the map. Placing it
          on the map card itself would need the card's distant
          coordinates; the row stays in view through the scroll's
          first moments, and the word + down-arrow ride it. */}
      {phase === "running" && stop === 4 && (
        <span
          aria-hidden="true"
          className="arrow-tour-callout pointer-events-none absolute right-[50px] top-[52px] z-30 flex flex-col items-center gap-0.5 sm:right-[66px] sm:top-[64px]"
        >
          <span className={WORD_CLASS}>Earth Map</span>
          <ArrowDown />
        </span>
      )}
      {/* Stop 5 — the Earth Map, reduced-motion telling: no
          scrolling, so the word rides the hero's own "Earth Map"
          pill in the doors nav — the map's door in the first
          screen — pointing down at the pill itself. The pill's
          spot in the centered nav shifts with wrapping, so the
          word stands at the hero's left rim instead: it names
          the door without pretending to touch it. */}
      {phase === "static" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-[300px] z-30 flex items-center gap-1 sm:left-6"
        >
          <span className={WORD_CLASS}>Earth Map</span>
          <ArrowDown />
        </span>
      )}

      {/* The way out, always the visitor's: a small ✕ resting
          under the bubble row while the tour is up (it steps
          aside while the Earth Map stop owns that corner). */}
      {(phase === "static" || (phase === "running" && stop < 4)) && (
        <button
          type="button"
          data-arrow-tour-ui=""
          onClick={end}
          aria-label="End the tour"
          className="absolute right-4 top-[52px] z-30 grid h-7 w-7 cursor-pointer place-items-center rounded-full border border-cream-100/30 text-sm text-cream-100/80 transition-colors hover:border-gold-400 hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 sm:right-6 sm:top-[64px]"
        >
          <span aria-hidden="true">✕</span>
        </button>
      )}

      {/* The invite — shown only while Teddy's welcome still has
          a say with this visitor and the tour is unseen. One tap
          and the tour runs, even with Teddy still to speak: the
          visitor asked, and asking settles the order. It
          unmounts the moment the tour itself ends, because the
          end marks the tour seen (see end() above). */}
      {phase === "invite" && (
        <button
          type="button"
          data-arrow-tour-ui=""
          onClick={() => {
            setPhase("idle");
            window.setTimeout(begin, 60);
          }}
          className="absolute right-4 top-[52px] z-30 cursor-pointer rounded-full border border-gold-400/60 bg-vineyard-900/90 px-3.5 py-2 text-[13px] font-medium whitespace-nowrap text-cream-100 shadow-lg transition-colors hover:border-gold-300 hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 sm:right-6 sm:top-[64px]"
        >
          <span aria-hidden="true" className="mr-1.5 text-gold-300">
            ➤
          </span>
          New here? Watch · Read · Listen · Search
        </button>
      )}
    </div>
  );
}
