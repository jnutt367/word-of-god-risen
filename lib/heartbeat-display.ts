/**
 * The Bible Heartbeat — display decisions for the disc (v3.1.1).
 *
 * THE RULE (Jason, Oct 15, 2026): a beat lights the FINEST geography
 * recorded for it. When some of a country's beats carry a recorded
 * subdivision (a state, a province — the country's own first-level
 * divisions), the subdivisions carry the light at full treatment and
 * the country itself steps back to a faint ember: present, honest,
 * but NOT lit — the light belongs to the finer place. Beats counted
 * for the country but carrying no recorded subdivision (the region
 * signal was absent, or they predate subdivision counting) still
 * count in the country's totals; the list names them plainly —
 * "{Country} — division not recorded" — so nothing is hidden and
 * nothing pretends to a precision it lacks.
 *
 * A country with NO recorded subdivisions at all is untouched by
 * this rule: it glows exactly as it did in v3.
 *
 * Pure functions only — the component (components/BodyHeartbeat.tsx)
 * renders what these decide, and the fixture checks exercise them
 * directly. See HEARTBEAT.md, v3.1.1.
 */

export interface SubdivisionCountLike {
  /** ISO 3166-1 alpha-2 of the parent country ("US"). */
  country: string;
  total: number;
}

export type CountryLightMode = "full" | "ember";

/** The ember: a small fixed opacity for a country that has stepped
 *  back so its subdivisions can carry the light. No glow layer, no
 *  breathing — a coal at rest, not a light. */
export const EMBER_FILL_OPACITY = 0.12;

/** The brightest an OPENS-ONLY ember may ever burn (Oct 27, 2026,
 *  Jason: "it should glow a little brighter each 10 visits").
 *  Deliberately about half the full chapter light's presence
 *  (country fills run 0.30–0.62), so no number of visits can make
 *  a mere open read as the Word opened — and an ember never gains
 *  the breathing glow or the heart at any brightness. */
export const EMBER_MAX_OPACITY = 0.3;

/** Graduated ember brightness for an opens-only place, by its
 *  ALL-TIME opens count: the flat ember (0.12) until 10 visits,
 *  then one small step (+0.03) at each further 10-visit threshold
 *  (10, 20, 30, …), capped at EMBER_MAX_OPACITY. Pure function —
 *  the component renders what this decides. */
export function emberOpacityForOpens(opens: number): number {
  const n = Number.isFinite(opens) ? Math.max(0, Math.floor(opens)) : 0;
  const steps = Math.floor(n / 10);
  return Math.min(EMBER_MAX_OPACITY, EMBER_FILL_OPACITY + 0.03 * steps);
}

/** The brightest an opens-only ember's RIM may stand (Oct 27, 2026,
 *  Jason's rim rule — see emberStrokeForOpens). The rim may trace a
 *  place's shape clearly long before its fill could ever be
 *  mistaken for a light: the fill is the claim, the rim only says
 *  someone is here, looking. */
export const EMBER_STROKE_MAX_OPACITY = 0.94;

/** Jason's rim rule (Oct 27, 2026): "36 visits should get you a
 *  good light rim." An opens-only place's OUTLINE brightens with
 *  visits, the way its fill does (emberOpacityForOpens) — a STEADY
 *  stroke opacity: 0.55 for 1–9 visits, then +0.13 at each 10-visit
 *  step (10 → 0.68, 20 → 0.81, 30 and beyond → the 0.94 cap). The
 *  rim is steady at every brightness — no glow layer, no breathing,
 *  no heart; those belong to a chapter opened, and only to that.
 *  Pure function — the component renders what this decides. */
export function emberStrokeForOpens(opens: number): number {
  const n = Number.isFinite(opens) ? Math.max(0, Math.floor(opens)) : 0;
  const steps = Math.floor(n / 10);
  return Math.min(EMBER_STROKE_MAX_OPACITY, 0.55 + 0.13 * steps);
}

/** KINDLING (Jason, Oct 29, 2026 — "75 in a day"): a place whose
 *  shown day brought 75 or more VISITS (opens) and no chapters yet
 *  kindles — the ember ladder's crown. The trigger reads the SHOWN
 *  day's own opens (the row's `opens`), never the all-time sum, so
 *  a past day browsed in the record kindles on its own day count,
 *  exactly as it did that day. A place with chapters never
 *  kindles: its light is its own, and kindling never recolors a
 *  light. Pure function — both the disc and the closer-look panel
 *  render what this decides, so the two surfaces always agree. */
export const KINDLING_OPENS_THRESHOLD = 75;

export function kindled(row: { opens?: number; total: number }): boolean {
  return row.total === 0 && (row.opens ?? 0) >= KINDLING_OPENS_THRESHOLD;
}

/** The kindled ember's colors: a warm red, steady — fill at an
 *  ember-like strength a step above the gold ember's base, rim at
 *  the graduated rim's top strength (EMBER_STROKE_MAX_OPACITY). */
export const KINDLING_FILL = "#d9482f";
export const KINDLING_RIM = "#f0664a";
export const KINDLING_FILL_OPACITY = 0.22;

/** The recorded subdivisions of one country within a shown set. */
export function subdivisionsOfCountry<T extends SubdivisionCountLike>(
  subdivisions: readonly T[],
  countryCode: string
): T[] {
  return subdivisions.filter((s) => s.country === countryCode && s.total > 0);
}

/** "full" — the country itself glows (v3 behavior); "ember" — the
 *  country has recorded subdivisions in this set, so they win the
 *  light and the country steps back. */
export function lightModeForCountry(
  subdivisions: readonly SubdivisionCountLike[],
  countryCode: string
): CountryLightMode {
  return subdivisionsOfCountry(subdivisions, countryCode).length > 0
    ? "ember"
    : "full";
}

/** Chapters counted for the country but carrying no recorded
 *  subdivision in this set: the country total less its recorded
 *  subdivisions' totals, never below zero. */
export function unrecordedChapters(
  countryTotal: number,
  subdivisions: readonly SubdivisionCountLike[],
  countryCode: string
): number {
  const recorded = subdivisionsOfCountry(subdivisions, countryCode).reduce(
    (sum, s) => sum + s.total,
    0
  );
  return Math.max(0, countryTotal - recorded);
}

/** The honest list label for those unrecorded chapters — the United
 *  States names its divisions "states"; everywhere else the generic
 *  "division" speaks. ("United States — state not recorded.") */
export function notRecordedLabel(
  countryCode: string,
  countryName: string
): string {
  return countryCode === "US"
    ? `${countryName} — state not recorded`
    : `${countryName} — division not recorded`;
}

/** A place row that may carry its last book-finish date (Oct 28,
 *  2026) — the shape the payload's rows carry as `bookFinishedOn`. */
export interface BookFinishRowLike {
  total: number;
  /** The place's last book-finish date ("YYYY-MM-DD"), or null
   *  when no finish stands in the record for it. */
  bookFinishedOn?: string | null;
}

/** THE GOLD RING (Jason, Oct 28, 2026): when a whole book of the
 *  Bible is finished in a place, that place wears a soft gold
 *  halo for the rest of that day, then settles back to its
 *  ordinary light. The ring is on when the place's last finish
 *  date IS today and the place carries chapters in the shown
 *  set — a finish is a book read or heard through, so the ring
 *  always rests on a full light, never on an opens-only ember.
 *  No names, no counts, nothing permanent — a ring for the day.
 *  Pure function — the component renders what this decides. */
export function bookHaloOn(
  row: BookFinishRowLike,
  todayDate: string | null
): boolean {
  return (
    todayDate !== null &&
    row.total > 0 &&
    row.bookFinishedOn != null &&
    row.bookFinishedOn === todayDate
  );
}

/** A country's own ring steps back when one of its subdivisions
 *  wears the ring that day — the finest recorded geography
 *  carries the sign, exactly as it carries the light (v3.1.1).
 *  A country whose finish was recorded with no subdivision
 *  keeps its own ring. */
export function countryBookHaloOn(
  row: BookFinishRowLike & { code: string },
  subdivisions: readonly (SubdivisionCountLike & BookFinishRowLike)[],
  todayDate: string | null
): boolean {
  if (!bookHaloOn(row, todayDate)) return false;
  return !subdivisionsOfCountry(subdivisions, row.code).some((s) =>
    bookHaloOn(s, todayDate)
  );
}
