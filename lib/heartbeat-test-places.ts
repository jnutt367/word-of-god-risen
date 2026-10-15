import worldMap from "@/lib/world-map.json";
import { subdivisionName } from "@/lib/subdivisions";

/**
 * The place list for the Heartbeat TEST VIEW (/heartbeat-test) —
 * shared by the server page (which validates the ?place= deep
 * link) and the client picker. Pure data, derived at module load
 * from the vendored map geometry: every US subdivision the disc
 * can draw (the 50 states + DC, keyed by full ISO 3166-2 code)
 * and every country in the world data — polygon countries plus
 * the centroid-only ones, which light by their heart, exactly as
 * a real beat for them would. See HEARTBEAT.md, test-view section.
 */

interface WorldCountry {
  name: string;
  path: string;
  cx: number;
  cy: number;
}

interface WorldCentroid {
  name: string;
  cx: number;
  cy: number;
}

const world = worldMap as {
  countries: Record<string, WorldCountry>;
  extraCentroids?: Record<string, WorldCentroid>;
  subdivisions?: Record<string, WorldCountry>;
};

export interface PlaceOption {
  /** "US-WV" for a subdivision, "KE" for a country. */
  value: string;
  name: string;
  kind: "subdivision" | "country";
  /** True when the place has no polygon and lights by centroid. */
  centroidOnly: boolean;
  /** The place's heart on the 1000×1000 disc. */
  cx: number;
  cy: number;
}

export const SUBDIVISION_OPTIONS: PlaceOption[] = Object.entries(
  world.subdivisions ?? {}
)
  .map(([code, geo]) => ({
    value: code,
    name: subdivisionName(code) ?? geo.name,
    kind: "subdivision" as const,
    centroidOnly: false,
    cx: geo.cx,
    cy: geo.cy,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const countryCodes = new Set([
  ...Object.keys(world.countries),
  ...Object.keys(world.extraCentroids ?? {}),
]);

export const COUNTRY_OPTIONS: PlaceOption[] = [...countryCodes]
  .map((code) => {
    const geo = world.countries[code];
    const extra = world.extraCentroids?.[code];
    return {
      value: code,
      name: geo?.name ?? extra?.name ?? code,
      kind: "country" as const,
      centroidOnly: !geo,
      cx: geo?.cx ?? extra?.cx ?? 0,
      cy: geo?.cy ?? extra?.cy ?? 0,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const ALL_PLACE_OPTIONS: PlaceOption[] = [
  ...SUBDIVISION_OPTIONS,
  ...COUNTRY_OPTIONS,
];

export function placeOption(value: string): PlaceOption | undefined {
  return ALL_PLACE_OPTIONS.find((o) => o.value === value);
}

export function isHeartbeatTestPlace(value: string): boolean {
  return placeOption(value) !== undefined;
}
