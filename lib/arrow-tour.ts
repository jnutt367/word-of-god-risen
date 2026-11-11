/**
 * The arrow tour's shared words with the rest of the app
 * (Jason, Nov 11, 2026 — components/ArrowTour.tsx).
 *
 * The tour itself is silent and account-free: one localStorage
 * note in the visitor's own browser, and nothing else. These
 * two CustomEvents exist because localStorage writes only raise
 * "storage" events in OTHER tabs — same-tab neighbors need a
 * same-tab bell.
 *
 * - ARROW_TOUR_START_EVENT ("wogr:arrow-tour-start"): rung by
 *   Ask Teddy the moment a visitor meets Teddy (his welcome's
 *   whole job done) and by the ListenButton replay. The tour
 *   hears it and takes its turn — after Teddy, never over him.
 * - ARROW_TOUR_SEEN_EVENT ("wogr:arrow-tour-seen"): rung by the
 *   tour itself when it marks the visitor as having had it, so
 *   anything presenting the tour (today: the tour's own invite)
 *   can stand down in the same tab.
 * - ARROW_TOUR_PILL_KEY ("wogr_arrow_tour_pill_v1"): the invite
 *   pill's OWN note, separate from the tour's seen-note. The
 *   pill is a standing invitation (Jason's ruling, later on
 *   Nov 11): it stays on the homepage until the visitor taps it
 *   away with its own ✕, and that dismissal is remembered here
 *   — it never marks the tour seen and never touches the
 *   auto-play's once-per-device rule.
 */

export const ARROW_TOUR_KEY = "wogr_arrow_tour_v1";
export const ARROW_TOUR_PILL_KEY = "wogr_arrow_tour_pill_v1";
export const ARROW_TOUR_START_EVENT = "wogr:arrow-tour-start";
export const ARROW_TOUR_SEEN_EVENT = "wogr:arrow-tour-seen";

/** Ring the bell: the arrow tour may take its turn now. */
export function askTeddyStartArrowTour() {
  try {
    window.dispatchEvent(new Event(ARROW_TOUR_START_EVENT));
  } catch {
    /* no window — nothing to ring */
  }
}

/** Announce the tour has been had (in this tab). */
export function dispatchArrowTourSeen() {
  try {
    window.dispatchEvent(new Event(ARROW_TOUR_SEEN_EVENT));
  } catch {
    /* no window — nothing to announce */
  }
}
