/**
 * ISO 3166-2 subdivisions — the generic keying for the Heartbeat's
 * within-country counts (v3.1+).
 *
 * A subdivision is ALWAYS carried as its full ISO 3166-2 code —
 * "US-FL", "CA-ON", "DE-BY" — country code, hyphen, region code. The
 * counters, the API, the vendored geometry (lib/world-map.json
 * `subdivisions`), and the display all speak that one shape, so the
 * worldwide admin-1 pass (v3.2) adds more countries by extending the
 * two registries below — no schema change anywhere.
 *
 * v3.1 covers the United States only: a US beat's region comes from
 * Vercel's edge header x-vercel-ip-country-region (observed forms:
 * "FL" and "US-FL"), sanitized HARD against the 50 states + DC.
 * Territories (PR, GU, VI, AS, MP, …) are not US states, carry no
 * vendored geometry, and are dropped — as is anything malformed. The
 * raw header value is never stored; only the canonical code survives,
 * as the key of an aggregate count. A state-level aggregate only:
 * nothing about any person is gathered or stored.
 */

/** The 50 states + DC, by their ISO 3166-2 region codes. */
export const US_STATE_CODES: ReadonlySet<string> = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
  "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "PA", "OR", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI",
  "WY",
]);

export const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
  CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii",
  ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming",
};

/**
 * Sanitize a raw region header value for a US beat: accepts "FL" or
 * "US-FL" (any case, surrounding whitespace tolerated), returns the
 * canonical region code ("FL") only when it is one of the 50 states
 * or DC, matching ^[A-Z]{2}$ after normalization. Anything else —
 * territories, foreign subdivisions, free text — returns null.
 */
export function sanitizeUsRegion(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let v = raw.trim().toUpperCase();
  if (v.startsWith("US-")) v = v.slice(3);
  if (!/^[A-Z]{2}$/.test(v)) return null;
  return US_STATE_CODES.has(v) ? v : null;
}

/**
 * Per-country region sanitizers: raw edge-region header → canonical
 * region code, or null to drop the subdivision (the country count
 * still stands). v3.1: the US only. v3.2 adds entries here — Canada,
 * Germany, Japan, … — each as strict as its own ISO 3166-2 table.
 */
const REGION_SANITIZERS: Record<string, (raw: string | null) => string | null> = {
  US: sanitizeUsRegion,
};

/**
 * The full ISO 3166-2 subdivision code for a beat, or null when the
 * country has no subdivision counting yet or the region signal does
 * not survive sanitization.
 */
export function subdivisionCode(
  country: string | null,
  rawRegion: string | null
): string | null {
  if (!country) return null;
  const sanitize = REGION_SANITIZERS[country];
  if (!sanitize) return null;
  const region = sanitize(rawRegion);
  return region ? `${country}-${region}` : null;
}

/** Split a full ISO 3166-2 code into its country and region parts. */
export function splitSubdivision(
  code: string
): { country: string; region: string } | null {
  const i = code.indexOf("-");
  if (i <= 0) return null;
  return { country: code.slice(0, i), region: code.slice(i + 1) };
}

/** Per-country display-name tables, keyed by region code. */
const SUBDIVISION_NAMES: Record<string, Record<string, string>> = {
  US: US_STATE_NAMES,
};

/** Display name for a full subdivision code ("US-FL" → "Florida"). */
export function subdivisionName(code: string): string | null {
  const parts = splitSubdivision(code);
  if (!parts) return null;
  return SUBDIVISION_NAMES[parts.country]?.[parts.region] ?? null;
}
