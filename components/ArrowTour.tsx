"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
 *   Earth Map → the hero's own "Earth Map" pill, in TWO beats
 *   (Jason's correction, later on Nov 11): first the arrow
 *   touches the pill itself — the door — and the pill breathes
 *   the ring; then the tour takes the very journey a tap on
 *   that pill takes, gliding down to the map and naming it
 *   once more where the eye lands. Cause, then effect — the
 *   sequence a real tap makes.
 *
 * Jason's reason: visitors land and never learn what to tap —
 * California comes ~50 times a day and clicks nothing. The tour
 * is the page pointing at itself, once, the way Teddy points at
 * the Listen button on a reader's first chapter.
 *
 * The house rules, whole:
 * - THE AUTO-PLAY IS FIRST VISIT ONLY, remembered in the
 *   visitor's own browser (wogr_arrow_tour_v1) — no accounts,
 *   no server state, and no heartbeat/analytics beat of any
 *   kind. The tour is silent. (The invite pill below is a
 *   separate, standing thing — see its own bullet.)
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
 *   or blocks the page. "Anywhere" is a document listener, not
 *   just the hero: during the Earth Map glide the hero has
 *   scrolled away and the tap lands on the map itself, and
 *   ending mid-glide stops the page where it is. A tap on the
 *   Earth Map pill during its beat is likewise the tour ending
 *   AND the pill's own anchor doing its job — one journey, the
 *   real one, never two.
 * - THE INVITE PILL STANDS UNTIL IT IS TAPPED AWAY (Jason's
 *   ruling, later on Nov 11). The auto-play above is once per
 *   device, but the invite pill under the hero bubbles is a
 *   standing invitation: it shows while Teddy's welcome still
 *   has a say, and it is still there after the tour has been
 *   seen — the quiet way back in. It leaves only when the
 *   visitor deliberately taps its own ✕, remembered in its own
 *   note (wogr_arrow_tour_pill_v1), which never marks the tour
 *   seen and never touches the auto-play. While the tour itself
 *   runs, the pill steps aside (its corner belongs to the
 *   tour's own ✕) and returns when the tour ends. The
 *   "New here? Teddy can show you" pill on reader pages also
 *   re-arms the tour alongside Teddy's card (see ListenButton
 *   — it clears the seen flag and comes home).
 * - REDUCED MOTION changes the telling, not the teaching: no
 *   sequencing, no pulse, no auto-scroll — the five words simply
 *   stand beside their bubbles all at once until dismissed.
 */

import {
  ARROW_TOUR_KEY,
  ARROW_TOUR_PILL_KEY,
  ARROW_TOUR_START_EVENT,
  dispatchArrowTourSeen,
} from "@/lib/arrow-tour";

const TEDDY_WELCOME_KEY = "wogr_teddy_welcome_v2";
const TEDDY_WELCOME_KEY_V1 = "wogr_teddy_welcome_v1";
/** Ask Teddy's own cap on auto-opens for a never-met reader —
 * mirrored here only so the tour knows when the welcome has had
 * its chances; Ask Teddy remains the welcome's owner. */
const TEDDY_WELCOME_MAX_AUTO_OPENS = 2;

type Phase = "idle" | "invite" | "running" | "static" | "rest";

/** A measured rectangle in hero-section coordinates — the Earth
 * Map pill's own footprint, so the tour can touch the pill
 * itself (its ring) and rest a callout just above it. The pill
 * rides a centered, wrapping nav, so no fixed numbers can know
 * where it stands; it is measured, never guessed. */
type PillBox = { top: number; left: number; width: number; height: number };

const STOP_MS = 1900;
const START_DELAY_MS = 900;
/** The Earth Map's closing beat: the destination named where
 * the eye lands, a breath shorter than a full stop. */
const ARRIVAL_MS = 1600;
/** The journey's patience: after asking for the glide, poll the
 * scroll until it has been quiet for a breath (SETTLE), never
 * before MIN has passed, and never wait past MAX — on a tall
 * desktop the glide is long, and the closing beat's callout
 * tracks the card even if it lands while the page still moves. */
const JOURNEY_POLL_MS = 120;
const JOURNEY_SETTLE_MS = 300;
const JOURNEY_MIN_MS = 400;
const JOURNEY_MAX_MS = 4500;
/** The Earth Map callout's own height (the word's line + the
 * down arrow + their gap), so it can rest its arrow tip just
 * above the thing it names. */
const MAP_CALLOUT_H = 46;
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

/** The invite pill's own memory — wholly separate from the
 * tour's seen-note. A dismissed pill stays dismissed; an error
 * reads as dismissed too, so a broken store can never nag. */
function pillDismissed(): boolean {
  try {
    return localStorage.getItem(ARROW_TOUR_PILL_KEY) === "dismissed";
  } catch {
    return true; // storage unavailable — never nag
  }
}

function markPillDismissed() {
  try {
    localStorage.setItem(ARROW_TOUR_PILL_KEY, "dismissed");
  } catch {
    /* storage unavailable — the pill still hides for this visit */
  }
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
  /** The invite pill's dismissal, this visit's rendering truth —
   * seeded from its own localStorage note on mount and set the
   * moment its ✕ is tapped. Nothing else reads it: the tour's
   * seen-note and the auto-play never consult the pill. */
  const [pillOff, setPillOff] = useState(false);
  /** The Earth Map pill's measured footprint (hero-section
   * coordinates), taken when its beat arrives — the door beat
   * and the reduced-motion label both stand on it. */
  const [pillBox, setPillBox] = useState<PillBox | null>(null);
  /** The map card's corner in viewport coordinates, for the
   * closing beat's callout (rendered through a portal: the hero
   * section clips its own overflow, and the card lives far
   * below it). Re-measured as the page moves, so the word stays
   * on the card even if the glide is still settling. */
  const [arrivalBox, setArrivalBox] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const timers = useRef<number[]>([]);
  const startedRef = useRef(false);
  /** Set the moment the tour is definitively over in this mount,
   * so a late handoff from Teddy's welcome can never revive it. */
  const doneRef = useRef(false);
  /** The tour's root element — the way to its own hero section,
   * inside which the Earth Map pill is found and measured. */
  const rootRef = useRef<HTMLDivElement>(null);
  /** True from the moment the Earth Map glide is asked for, so
   * ending mid-glide can stop the page where it is. */
  const journeyRef = useRef(false);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const end = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (journeyRef.current) {
      // Ended mid-glide (a tap, Escape, the ✕): stop the page
      // where it is rather than letting the tour's scroll run
      // on without it. An instant jump to the very spot the
      // page already shows cancels the in-flight glide.
      try {
        window.scrollTo({ top: window.scrollY, behavior: "instant" });
      } catch {
        /* an engine without "instant": the glide simply ends */
      }
    }
    clearTimers();
    // The tour rests into its standing invitation: the invite
    // pill takes the corner back (unless it was tapped away).
    setPhase(pillDismissed() ? "idle" : "rest");
    markTourSeen();
  }, [clearTimers]);

  /** Measure the hero's Earth Map pill — found by what it IS
   * (the anchor whose href is "#earth-map", inside this tour's
   * own hero section), never by its text alone. Coordinates are
   * taken relative to the section, the containing block of the
   * tour's absolute callouts. */
  const measurePill = useCallback(() => {
    const section = rootRef.current?.closest("section");
    const pill = section?.querySelector<HTMLElement>('a[href="#earth-map"]');
    if (!section || !pill) return false;
    const p = pill.getBoundingClientRect();
    const s = section.getBoundingClientRect();
    setPillBox({
      top: p.top - s.top,
      left: p.left - s.left,
      width: p.width,
      height: p.height,
    });
    return true;
  }, []);

  /** Where the closing beat's callout stands: just inside the
   * map card's top edge, at its left corner — the card lands
   * with its top a breath under the sticky header, so the word
   * steps inside the card's own frame rather than fight the
   * header for the strip above it. The heading is centered;
   * the corner is the card's quiet ground. */
  const trackArrival = useCallback(() => {
    const el = document.getElementById("earth-map");
    if (!el) return;
    const r = el.getBoundingClientRect();
    setArrivalBox({ top: r.top + 10, left: r.left + 18 });
  }, []);

  /** The closing beat: the glide has settled (or the journey's
   * patience ran out) — name the destination where the eye
   * lands, hold it a breath, and end. */
  const arrive = useCallback(() => {
    if (doneRef.current) return;
    trackArrival();
    setStop(6);
    timers.current.push(window.setTimeout(end, ARRIVAL_MS));
  }, [end, trackArrival]);

  /** Beat two of the Earth Map stop: the journey a real tap on
   * the pill takes. The pill is an anchor to #earth-map and
   * this page glides by its own CSS (html scroll-behavior:
   * smooth), so the tour asks for exactly that glide — no
   * behavior of its own — and lands on the card's own scroll
   * margin, the same landing the anchor gives. */
  const journey = useCallback(() => {
    if (doneRef.current) return;
    const el = document.getElementById("earth-map");
    if (!el) {
      end();
      return;
    }
    journeyRef.current = true;
    setStop(5);
    el.scrollIntoView({ block: "start" });
    // Watch for the glide to settle, then name the destination.
    let lastY = window.scrollY;
    let quiet = 0;
    let waited = 0;
    const poll = () => {
      if (doneRef.current) return;
      waited += JOURNEY_POLL_MS;
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 1) quiet += JOURNEY_POLL_MS;
      else quiet = 0;
      lastY = y;
      if (
        (waited >= JOURNEY_MIN_MS && quiet >= JOURNEY_SETTLE_MS) ||
        waited >= JOURNEY_MAX_MS
      ) {
        arrive();
        return;
      }
      timers.current.push(window.setTimeout(poll, JOURNEY_POLL_MS));
    };
    timers.current.push(window.setTimeout(poll, JOURNEY_POLL_MS));
  }, [arrive, end]);

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
      // dismisses them. The Earth Map word stands at the hero's
      // own "Earth Map" pill — measured on it (the effect
      // below), the map's door in the first screen.
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
    journeyRef.current = false;
    const later = (fn: () => void, ms: number) => {
      timers.current.push(window.setTimeout(fn, ms));
    };
    later(() => setStop(1), STOP_MS);
    later(() => setStop(2), STOP_MS * 2);
    later(() => setStop(3), STOP_MS * 3);
    // The fifth stop, beat one — THE DOOR: the arrow touches
    // the hero's Earth Map pill itself and the pill breathes
    // the ring (its geometry is measured by the effect below).
    // No scrolling yet: first the visitor learns what to tap.
    later(() => setStop(4), STOP_MS * 4);
    // Beat two — THE JOURNEY: the tour takes the glide the
    // pill's own tap takes, and the closing beat names the map
    // on arrival (journey/arrive above own the rest).
    later(() => journey(), STOP_MS * 5);
  }, [clearTimers, end, journey]);

  /* First mount: decide what this visitor gets. */
  useEffect(() => {
    setPillOff(pillDismissed());
    if (tourSeen()) {
      // The greeting has had its once on this device. What
      // remains is the standing invitation: the pill rests in
      // its corner (the render below) until it is tapped away.
      doneRef.current = true;
      setPhase("rest");
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

  /* A tap ANYWHERE ends the tour — a document listener, because
   * the tour's own root lives inside the hero: once the Earth
   * Map glide carries the page down, a tap lands on the map,
   * far outside the hero, and it must still end the tour (and
   * stop the glide where it is — end() does that). The tour's
   * own controls carry data-arrow-tour-ui and are exempt; the
   * root's own onPointerDown below hears the same taps inside
   * the hero and end() simply answers once. */
  useEffect(() => {
    if (phase !== "running" && phase !== "static") return;
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-arrow-tour-ui]")) return;
      end();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [phase, end]);

  /* Measure the Earth Map pill when its moment comes: the door
   * beat of the animated telling, or the standing label of the
   * reduced-motion one. Measured on entry, once more as fonts
   * and the hero cycle settle, and on every resize while the
   * beat is up. */
  useEffect(() => {
    const active = phase === "static" || (phase === "running" && stop === 4);
    if (!active) return;
    measurePill();
    const again = window.setTimeout(measurePill, 400);
    window.addEventListener("resize", measurePill);
    return () => {
      window.clearTimeout(again);
      window.removeEventListener("resize", measurePill);
    };
  }, [phase, stop, measurePill]);

  /* While the closing beat is up, keep its callout on the map
   * card: if the glide is still settling (or the visitor's
   * device moves the page), the word follows the card. */
  useEffect(() => {
    if (phase !== "running" || stop !== 6) return;
    trackArrival();
    const onScroll = () => trackArrival();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [phase, stop, trackArrival]);

  /* A tap anywhere that is not one of the tour's own controls
   * ends it. The callouts themselves are pointer-events-none, so
   * a tap aimed at a named bubble lands on the bubble: this
   * runs on the bubble's own pointerdown, ends the tour first,
   * and the bubble's click then does its job untouched. */
  const endOnPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-arrow-tour-ui]")) return;
    end();
  };

  /* The invite pill's own two doors. Tapping the pill asks for
   * the tour — from "invite" (Teddy still to speak) or from
   * "rest" (the tour already seen on this device): asking
   * settles the order, and from rest it re-arms the run guards
   * for one more telling. Tapping the pill's ✕ is a separate,
   * deliberate act: the pill leaves and is remembered as
   * dismissed in its own note — the tour's seen-note and the
   * auto-play are not touched by it. */
  const startFromPill = () => {
    doneRef.current = false;
    startedRef.current = false;
    setPhase("idle");
    window.setTimeout(begin, 60);
  };

  const dismissPill = () => {
    markPillDismissed();
    setPillOff(true);
  };

  if (phase === "idle") return null;

  const showStop = (i: number) =>
    phase === "static" || (phase === "running" && stop === i);

  return (
    <div
      ref={rootRef}
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

      {/* Stop 5, beat one — THE DOOR (animated telling): the
          callout rests just above the hero's Earth Map pill,
          its arrow tip on the pill, and the pill itself
          breathes the golden ring — the same telling the four
          bubbles got, at the door a tap would take. The pill is
          measured, never guessed (see measurePill). Should the
          pill ever not be found, the beat falls back to the
          tour's first telling — the word under the bubble row —
          so the beat is never simply missing. */}
      {phase === "running" && stop === 4 && pillBox && (
        <span key="earth-map-door" className="contents">
          <span
            aria-hidden="true"
            data-tour-stop5="door"
            className="arrow-tour-callout pointer-events-none absolute z-30"
            style={{
              top: pillBox.top - MAP_CALLOUT_H - 4,
              left: pillBox.left + pillBox.width / 2,
            }}
          >
            <span className="flex -translate-x-1/2 flex-col items-center gap-0.5">
              <span className={WORD_CLASS}>Earth Map</span>
              <ArrowDown />
            </span>
          </span>
          <span
            aria-hidden="true"
            className="teddy-point pointer-events-none absolute z-30 rounded-full"
            style={{
              top: pillBox.top,
              left: pillBox.left,
              width: pillBox.width,
              height: pillBox.height,
            }}
          />
        </span>
      )}
      {phase === "running" && stop === 4 && !pillBox && (
        <span
          aria-hidden="true"
          className="arrow-tour-callout pointer-events-none absolute right-[50px] top-[52px] z-30 flex flex-col items-center gap-0.5 sm:right-[66px] sm:top-[64px]"
        >
          <span className={WORD_CLASS}>Earth Map</span>
          <ArrowDown />
        </span>
      )}
      {/* Stop 5, beat two — THE ARRIVAL: the glide has carried
          the visitor to the map; the word names the destination
          where the eye lands, just inside the card's top edge.
          Rendered through a portal at the document root: the
          hero section clips its own overflow and the card lives
          far below it, so the callout is placed by the card's
          own viewport position (tracked while it shows). */}
      {phase === "running" &&
        stop === 6 &&
        arrivalBox &&
        createPortal(
          <span
            aria-hidden="true"
            data-tour-stop5="arrival"
            className="arrow-tour-callout pointer-events-none fixed z-[70] flex flex-col items-center gap-0.5"
            style={{ top: arrivalBox.top, left: arrivalBox.left }}
          >
            <span className={WORD_CLASS}>Earth Map</span>
            <ArrowDown />
          </span>,
          document.body
        )}
      {/* Stop 5 — the Earth Map, reduced-motion telling: no
          sequencing and no scroll, so the word stands at the
          pill itself, measured onto the map's door in the first
          screen (the first build had to leave it at the hero's
          rim, before the pill could be measured). The rim
          remains only as the fallback if the pill is ever not
          found. */}
      {phase === "static" && pillBox && (
        <span
          aria-hidden="true"
          data-tour-stop5="door"
          className="pointer-events-none absolute z-30"
          style={{
            top: pillBox.top - MAP_CALLOUT_H - 4,
            left: pillBox.left + pillBox.width / 2,
          }}
        >
          <span className="flex -translate-x-1/2 flex-col items-center gap-0.5">
            <span className={WORD_CLASS}>Earth Map</span>
            <ArrowDown />
          </span>
        </span>
      )}
      {phase === "static" && !pillBox && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-[300px] z-30 flex items-center gap-1 sm:left-6"
        >
          <span className={WORD_CLASS}>Earth Map</span>
          <ArrowDown />
        </span>
      )}

      {/* The way out, always the visitor's: a small door resting
          under the bubble row while the tour is up (it steps
          aside once the journey begins — by then the hero, and
          this corner with it, has scrolled away). It wears its
          name now (Jason, Nov 11, 2026, the name-tag audit):
          the tour names every door it visits, so its own exit
          reads "End tour" beside the ✕ — quiet, never louder
          than the words it teaches. */}
      {(phase === "static" || (phase === "running" && stop <= 4)) && (
        <button
          type="button"
          data-arrow-tour-ui=""
          onClick={end}
          aria-label="End the tour"
          className="absolute right-4 top-[52px] z-30 flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-cream-100/30 px-3 text-cream-100/80 transition-colors hover:border-gold-400 hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 sm:right-6 sm:top-[64px]"
        >
          <span className="text-xs font-medium">End tour</span>
          <span aria-hidden="true" className="text-sm">✕</span>
        </button>
      )}

      {/* The invite — a standing invitation (Jason's ruling,
          later on Nov 11). It shows while Teddy's welcome still
          has a say with this visitor, and it is STILL there
          after the tour has been seen: the quiet way back in.
          One tap and the tour runs — from either state, the
          visitor asked, and asking settles the order. It steps
          aside while the tour itself is up (this corner belongs
          to the tour's own ✕ then) and returns when the tour
          ends. It leaves for good only by its own ✕, remembered
          in its own note — never merely because the tour ran. */}
      {(phase === "invite" || phase === "rest") && !pillOff && (
        <div
          data-arrow-tour-ui=""
          className="absolute right-4 top-[52px] z-30 flex items-center gap-1.5 sm:right-6 sm:top-[64px]"
        >
          <button
            type="button"
            onClick={startFromPill}
            className="cursor-pointer rounded-full border border-gold-400/60 bg-vineyard-900/90 px-3.5 py-2 text-[13px] font-medium whitespace-nowrap text-cream-100 shadow-lg transition-colors hover:border-gold-300 hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
          >
            <span aria-hidden="true" className="mr-1.5 text-gold-300">
              ➤
            </span>
            New here? Quick tour →
          </button>
          {/* The pill's own way out wears its name too (Jason,
              Nov 11, 2026, the name-tag audit): "Hide" stands
              quietly inside the dismiss control beside its ✕ —
              part of the pill, in the pill's own register. */}
          <button
            type="button"
            onClick={dismissPill}
            aria-label="Hide the tour invitation"
            className="flex h-10 shrink-0 cursor-pointer items-center gap-1 rounded-full border border-gold-400/60 bg-vineyard-900/90 px-3 text-cream-100/80 shadow-lg transition-colors hover:border-gold-300 hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
          >
            <span className="text-xs font-medium">Hide</span>
            <span aria-hidden="true" className="text-sm">✕</span>
          </button>
        </div>
      )}
    </div>
  );
}
