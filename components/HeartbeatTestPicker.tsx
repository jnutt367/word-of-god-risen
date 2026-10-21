"use client";

import { useMemo, useState } from "react";
import BodyHeartbeat, { type LiveData } from "@/components/BodyHeartbeat";
import { heartbeatToday } from "@/lib/heartbeat-date";
import {
  COUNTRY_OPTIONS,
  SUBDIVISION_OPTIONS,
  placeOption,
  type PlaceOption,
} from "@/lib/heartbeat-test-places";

/**
 * The Heartbeat TEST VIEW picker (/heartbeat-test).
 *
 * Picks ONE place — any of the 51 US subdivisions in the vendored
 * geometry, or any country in the world data (polygon countries and
 * centroid-only ones alike) — and feeds the production
 * <BodyHeartbeat> a FIXTURE: a make-believe live payload carrying a
 * single chapter for exactly that place. The disc below is drawn by
 * the very code the homepage runs — same fills, same hearts, same
 * ember step-back for a state (its country rests as an ember) — so
 * what is previewed here is what a real beat from that place would
 * light, no more and no less.
 *
 * NO-WRITE GUARANTEE: this component never calls /api/heartbeat —
 * no GET, no POST — and BodyHeartbeat in fixture mode never fetches
 * or polls either. The live counters are neither read nor written;
 * the fixture exists only in this page's memory. See HEARTBEAT.md.
 */

/** The make-believe payload: exactly one chapter, read, today, for
 *  exactly the picked place — shaped precisely like a real
 *  GET /api/heartbeat answer carrying a single beat. */
function fixtureFor(place: PlaceOption): LiveData {
  const todayIso = heartbeatToday();
  const fixture: LiveData = {
    live: true,
    asOf: null,
    since: "2026-10-15",
    totals: {
      chaptersRead: 1,
      chaptersHeard: 0,
      listensCompleted: 0,
      booksFinished: 0,
    },
    today: { date: todayIso, chaptersRead: 1, chaptersHeard: 0 },
    countries: [],
    subdivisions: [],
  };
  if (place.kind === "subdivision") {
    const [country, region] = place.value.split("-");
    // The state carries the chapter; its country stands behind it
    // with the same total, exactly as a real state beat is counted —
    // which is what makes the country rest as an ember on the disc.
    fixture.countries = [{ code: country, read: 1, heard: 0, total: 1 }];
    fixture.subdivisions = [
      {
        code: place.value,
        country,
        region,
        name: place.name,
        read: 1,
        heard: 0,
        total: 1,
      },
    ];
  } else {
    fixture.countries = [
      { code: place.value, read: 1, heard: 0, total: 1 },
    ];
  }
  return fixture;
}

export default function HeartbeatTestPicker({
  initialPlace,
}: {
  initialPlace: string;
}) {
  const [value, setValue] = useState(initialPlace);
  const place = placeOption(value) ?? SUBDIVISION_OPTIONS[0];
  const fixture = useMemo(() => fixtureFor(place), [place]);

  const onPick = (next: string) => {
    setValue(next);
    // Keep the choice in the URL so a QA link can name its place —
    // a quiet replace, no navigation, no reload.
    const url = new URL(window.location.href);
    url.searchParams.set("place", next);
    window.history.replaceState(null, "", url);
  };

  return (
    <div>
      <div className="mx-auto max-w-3xl rounded-2xl border border-gold-500/15 bg-vineyard-900 px-6 py-6 sm:px-10">
        <label
          htmlFor="hb-test-place"
          className="block text-center font-display text-xl text-cream-50"
        >
          Pick a place to light — in make-believe
        </label>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-cream-100/85">
          One imaginary chapter is placed in exactly the place you
          pick, and the live map code below draws what a real chapter
          there would light — its own shape, its own heart, and its
          would-be row under “Today on the vine.”
        </p>
        <div className="mt-4 flex justify-center">
          <select
            id="hb-test-place"
            value={place.value}
            onChange={(e) => onPick(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gold-500/30 bg-vineyard-950 px-3.5 py-2.5 text-cream-50 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/60"
          >
            <optgroup label="United States — states & DC">
              {SUBDIVISION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.name} ({o.value})
                </option>
              ))}
            </optgroup>
            <optgroup label="Countries of the world">
              {COUNTRY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.name} ({o.value})
                  {o.centroidOnly ? " — lights by its center" : ""}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <p className="mt-3 text-center text-xs text-sage-300" role="status">
          Now lighting:{" "}
          <span className="text-gold-300">
            {place.name} · {place.value}
          </span>{" "}
          — heart at disc {Math.round(place.cx)}, {Math.round(place.cy)}{" "}
          of 1000.
          {place.kind === "subdivision" &&
            " The United States rests as a faint ember behind it, exactly as it would live."}
          {place.centroidOnly &&
            " This place has no drawn outline in the map data, so it lights as a heart at its center — the same fallback a real beat would use."}
        </p>
      </div>

      {/* key remounts the display per pick, so the fixture is its
          initial state — no syncing effects, no stale light. */}
      <BodyHeartbeat key={place.value} fixture={fixture} />
    </div>
  );
}
