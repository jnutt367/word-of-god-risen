#!/usr/bin/env node
/**
 * World-map generator for the Bible Heartbeat — ONE-TIME, manual.
 *
 * v2 produced equirectangular SVG paths; v3 (Oct 15, 2026) re-projects
 * the same Natural Earth geometry through an azimuthal equidistant
 * projection centered on the North Pole, so the world renders as a
 * flat disc and the vine grows from its heart.
 *
 * Produces lib/world-map.json: SVG paths for every country plus an
 * approximate centroid per country, keyed by ISO 3166-1 alpha-2, all in
 * disc coordinates. Also emits `extraCentroids` — disc centroids for
 * alpha-2 codes that have metadata coordinates but no Natural Earth
 * polygon, so a counted country without a silhouette can still fall
 * back to a centroid light. The output is vendored into the repo — the
 * app makes NO runtime calls to any map/tile service and loads no
 * trackers.
 *
 * Sources (all public data, fetched only when regenerating):
 *   - Geometry: Natural Earth 110m (PUBLIC DOMAIN) via the world-atlas
 *     TopoJSON distribution (cdn.jsdelivr.net/npm/world-atlas@2).
 *   - Names / alpha-2 codes / centroid lat-lng: mledoze/countries.
 *   - Subdivisions (v3.1): first-level (admin-1) geometry, keyed
 *     GENERICALLY by full ISO 3166-2 code ("US-FL" style) into
 *     `subdivisions`, so a counted subdivision can light up in its
 *     own silhouette inside its nation's. v3.1 vendors the USA only:
 *     us-atlas TopoJSON (cdn.jsdelivr.net/npm/us-atlas@3,
 *     states-10m — public-domain source data), projected through the
 *     SAME azimuthal disc, 50 states + DC (territories not vendored).
 *     The worldwide admin-1 pass (v3.2) adds more countries' entries
 *     under their own "XX-…" keys — no schema change needed.
 *
 * Antarctica is omitted (it would ring the entire rim of the disc).
 * Three Natural Earth features have no ISO code (N. Cyprus, Somaliland,
 * Kosovo): they are drawn in the merged land path but carry no
 * per-country entry, so no light can be plotted on them. France/Norway
 * (ISO "-99" in Natural Earth) are matched by name.
 *
 * Usage: node scripts/build-world-map.mjs   (needs network, once)
 *        node scripts/build-world-map.mjs --subdivisions-only
 *          rebuilds ONLY the `subdivisions` section and preserves the
 *          shipped land/countries/extraCentroids byte-for-byte.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const META_URL = "https://cdn.jsdelivr.net/gh/mledoze/countries@master/dist/countries.json";
const US_STATES_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const topo = await (await fetch(TOPO_URL)).json();
const meta = await (await fetch(META_URL)).json();
const usStatesTopo = await (await fetch(US_STATES_URL)).json();

const W = 1000, H = 1000;
const CENTER = W / 2;
// Azimuthal equidistant, centered on the North Pole: a point's distance
// from the disc's center is proportional to its angular distance from
// the pole, and its direction is its longitude — longitude 0° toward
// the bottom of the disc, increasing eastward to the right, ±180° at
// the top. The disc radius (470 units) reaches 150° from the pole,
// past the southernmost land (≈55°S).
const DISC_R = 470;
const K = DISC_R / ((150 * Math.PI) / 180);
const project = (lon, lat) => {
  const lam = (lon * Math.PI) / 180;
  const rho = K * (((90 - lat) * Math.PI) / 180);
  return [CENTER + rho * Math.sin(lam), CENTER + rho * Math.cos(lam)];
};

// --- TopoJSON decode (one decoder per source file) ---
function makeDecoder(t) {
  const { scale, translate } = t.transform;
  const arcs = t.arcs.map((arc) => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => {
      x += dx; y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; // lon,lat
    });
  });
  function arcPoints(idx) {
    if (idx >= 0) return arcs[idx];
    return arcs[~idx].slice().reverse();
  }
  function ringPoints(ring) {
    const pts = [];
    for (const idx of ring) {
      const a = arcPoints(idx);
      for (let i = 0; i < a.length; i++) {
        if (pts.length && i === 0) continue; // shared joint
        pts.push(a[i]);
      }
    }
    return pts;
  }
  function geometryRings(geom) {
    if (geom.type === "Polygon") return geom.arcs.map((ring) => ringPoints(ring));
    if (geom.type === "MultiPolygon")
      return geom.arcs.flatMap((poly) => poly.map((ring) => ringPoints(ring)));
    return [];
  }
  return { geometryRings };
}
const { geometryRings } = makeDecoder(topo);

// --- Simplify (Douglas-Peucker on projected points) ---
function dp(pts, eps) {
  if (pts.length <= 2) return pts;
  const [x1, y1] = pts[0], [x2, y2] = pts[pts.length - 1];
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  let maxD = 0, maxI = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs((pts[i][0] - x1) * dy - (pts[i][1] - y1) * dx) / len;
    if (d > maxD) { maxD = d; maxI = i; }
  }
  if (maxD <= eps) return [pts[0], pts[pts.length - 1]];
  const left = dp(pts.slice(0, maxI + 1), eps);
  const right = dp(pts.slice(maxI), eps);
  return left.concat(right.slice(1));
}
// Closed rings defeat plain DP (first == last point = zero-length chord),
// so split each ring at its farthest point and simplify the two halves.
function simplifyRing(pts, eps = 0.55) {
  const open = pts.slice();
  if (
    open.length > 1 &&
    open[0][0] === open[open.length - 1][0] &&
    open[0][1] === open[open.length - 1][1]
  )
    open.pop();
  if (open.length <= 3) return open;
  let far = 0, fd = -1;
  for (let i = 1; i < open.length; i++) {
    const d = Math.hypot(open[i][0] - open[0][0], open[i][1] - open[0][1]);
    if (d > fd) { fd = d; far = i; }
  }
  if (far === 0) return open;
  const a = dp(open.slice(0, far + 1), eps);
  const b = dp(open.slice(far).concat([open[0]]), eps);
  return a.concat(b.slice(1, -1));
}

const r1 = (n) => Math.round(n * 10) / 10;
function ringToPath(ptsLonLat, eps = 0.55) {
  const pts = simplifyRing(ptsLonLat.map(([lon, lat]) => project(lon, lat)), eps);
  const out = [];
  for (const [x, y] of pts) {
    const rx = r1(x), ry = r1(y);
    const last = out[out.length - 1];
    if (!last || last[0] !== rx || last[1] !== ry) out.push([rx, ry]);
  }
  if (out.length < 4) return "";
  return "M" + out.map(([x, y]) => `${x},${y}`).join("L") + "Z";
}

// --- Metadata lookup ---
const byCcn3 = new Map();
for (const c of meta) if (c.ccn3) byCcn3.set(String(parseInt(c.ccn3, 10)), c);
const NAME_FALLBACK = { France: "FR", Norway: "NO" }; // ISO "-99" in Natural Earth

const landParts = [];
const countries = {};
for (const geom of topo.objects.countries.geometries) {
  const name = geom.properties.name;
  if (name === "Antarctica") continue;
  const rings = geometryRings(geom);
  const path = rings.map(ringToPath).filter(Boolean).join("");
  if (path) landParts.push(path);

  let m = byCcn3.get(String(parseInt(geom.id, 10)));
  const code = m?.cca2 || NAME_FALLBACK[name] || null;
  if (!code) continue; // drawn in the land, never lit (no ISO code)
  if (!m) m = meta.find((c) => c.cca2 === code);

  let cx, cy;
  if (m?.latlng?.length === 2) {
    [cx, cy] = project(m.latlng[1], m.latlng[0]);
  } else {
    // fallback: centre of the largest ring's bounding box
    let best = null, bestArea = -1;
    for (const ring of rings) {
      const pr = ring.map(([lon, lat]) => project(lon, lat));
      const xs = pr.map((p) => p[0]), ys = pr.map((p) => p[1]);
      const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
      if (area > bestArea) { bestArea = area; best = pr; }
    }
    const xs = best.map((p) => p[0]), ys = best.map((p) => p[1]);
    cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  }
  countries[code] = { name: m?.name?.common || name, path, cx: r1(cx), cy: r1(cy) };
}

// Centroid-only fallbacks: alpha-2 codes with metadata coordinates but
// no Natural Earth polygon entry above (small territories and the
// like). A counted country found here gets a centroid light instead of
// a silhouette. Antarctica is excluded — it has no polygon here either.
const extraCentroids = {};
for (const c of meta) {
  const code = c.cca2;
  if (!code || code === "AQ" || countries[code]) continue;
  if (!Array.isArray(c.latlng) || c.latlng.length !== 2) continue;
  const [cx, cy] = project(c.latlng[1], c.latlng[0]);
  extraCentroids[code] = { name: c.name?.common || code, cx: r1(cx), cy: r1(cy) };
}

// --- Subdivisions (v3.1: the USA; keyed by full ISO 3166-2 code) ---
// FIPS → region code for the 50 states + DC, stored under "US-<code>".
// The us-atlas file also carries the territories (FIPS 60/66/69/72/78)
// — they are NOT in this map, so they are never vendored and can never
// carry a light.
const FIPS_TO_STATE = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};
const stateDecoder = makeDecoder(usStatesTopo);
const subdivisions = {};
for (const geom of usStatesTopo.objects.states.geometries) {
  const code = FIPS_TO_STATE[String(geom.id).padStart(2, "0")];
  if (!code) continue; // a territory — not vendored
  const rings = stateDecoder.geometryRings(geom);
  // The 10m source is far denser than the disc needs; simplify a
  // little harder than the 110m countries to keep the file lean —
  // but retry tiny rings (DC above all) at finer tolerances before
  // letting one vanish.
  const ringPath = (ring) => {
    for (const eps of [0.8, 0.3, 0.1, 0.02]) {
      const p = ringToPath(ring, eps);
      if (p) return p;
    }
    return "";
  };
  const path = rings.map(ringPath).filter(Boolean).join("");
  if (!path) continue;
  // Centroid: centre of the largest ring's projected bounding box
  // (the same fallback the countries use) — the state's heart.
  let best = null, bestArea = -1;
  for (const ring of rings) {
    const pr = ring.map(([lon, lat]) => project(lon, lat));
    const xs = pr.map((p) => p[0]), ys = pr.map((p) => p[1]);
    const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
    if (area > bestArea) { bestArea = area; best = pr; }
  }
  const xs = best.map((p) => p[0]), ys = best.map((p) => p[1]);
  subdivisions[`US-${code}`] = {
    name: geom.properties.name,
    path,
    cx: r1((Math.min(...xs) + Math.max(...xs)) / 2),
    cy: r1((Math.min(...ys) + Math.max(...ys)) / 2),
  };
}

// With --subdivisions-only, the shipped land/countries/extraCentroids
// are preserved byte-for-byte and only `subdivisions` is rebuilt —
// the safe way to extend the vendored file without re-rolling the
// country geometry a full regeneration would re-simplify.
const here = dirname(fileURLToPath(import.meta.url));
const dest = join(here, "..", "lib", "world-map.json");
let preserved = null;
if (
  process.argv.includes("--subdivisions-only") ||
  process.argv.includes("--states-only")
) {
  try {
    preserved = JSON.parse(readFileSync(dest, "utf8"));
  } catch {
    preserved = null;
  }
}

const out = {
  viewBox: `0 0 ${W} ${H}`,
  projection:
    "Azimuthal equidistant, centered on the North Pole (disc radius reaches 150° from the pole)",
  source:
    "Natural Earth 110m (public domain) via world-atlas; centroids from mledoze/countries latlng; subdivisions (ISO 3166-2): US states via us-atlas states-10m (public-domain source data)",
  land: preserved ? preserved.land : landParts.join(""),
  countries: preserved ? preserved.countries : countries,
  extraCentroids: preserved ? preserved.extraCentroids : extraCentroids,
  subdivisions,
};
writeFileSync(dest, JSON.stringify(out));
console.log(
  `world-map.json → ${Object.keys(countries).length} countries keyed, ` +
    `${Object.keys(extraCentroids).length} centroid-only fallbacks, ` +
    `${Object.keys(subdivisions).length} subdivisions keyed, ` +
    `${landParts.join("").length} land bytes`
);
