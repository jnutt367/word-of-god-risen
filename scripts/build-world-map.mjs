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
 * Sources (both public data, fetched only when regenerating):
 *   - Geometry: Natural Earth 110m (PUBLIC DOMAIN) via the world-atlas
 *     TopoJSON distribution (cdn.jsdelivr.net/npm/world-atlas@2).
 *   - Names / alpha-2 codes / centroid lat-lng: mledoze/countries.
 *
 * Antarctica is omitted (it would ring the entire rim of the disc).
 * Three Natural Earth features have no ISO code (N. Cyprus, Somaliland,
 * Kosovo): they are drawn in the merged land path but carry no
 * per-country entry, so no light can be plotted on them. France/Norway
 * (ISO "-99" in Natural Earth) are matched by name.
 *
 * Usage: node scripts/build-world-map.mjs   (needs network, once)
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const META_URL = "https://cdn.jsdelivr.net/gh/mledoze/countries@master/dist/countries.json";

const topo = await (await fetch(TOPO_URL)).json();
const meta = await (await fetch(META_URL)).json();

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

// --- TopoJSON decode ---
const { scale, translate } = topo.transform;
const arcs = topo.arcs.map((arc) => {
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
function simplifyRing(pts) {
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
  const a = dp(open.slice(0, far + 1), 0.55);
  const b = dp(open.slice(far).concat([open[0]]), 0.55);
  return a.concat(b.slice(1, -1));
}

const r1 = (n) => Math.round(n * 10) / 10;
function ringToPath(ptsLonLat) {
  const pts = simplifyRing(ptsLonLat.map(([lon, lat]) => project(lon, lat)));
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

const out = {
  viewBox: `0 0 ${W} ${H}`,
  projection:
    "Azimuthal equidistant, centered on the North Pole (disc radius reaches 150° from the pole)",
  source:
    "Natural Earth 110m (public domain) via world-atlas; centroids from mledoze/countries latlng",
  land: landParts.join(""),
  countries,
  extraCentroids,
};
const here = dirname(fileURLToPath(import.meta.url));
const dest = join(here, "..", "lib", "world-map.json");
writeFileSync(dest, JSON.stringify(out));
console.log(
  `world-map.json → ${Object.keys(countries).length} countries keyed, ` +
    `${Object.keys(extraCentroids).length} centroid-only fallbacks, ` +
    `${landParts.join("").length} land bytes`
);
