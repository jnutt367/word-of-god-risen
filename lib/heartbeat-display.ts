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
