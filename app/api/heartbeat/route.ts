import { NextResponse } from "next/server";
import {
  incrementCounters,
  publicView,
  readCounters,
  type BeatKind,
} from "@/lib/heartbeat-store";
import { subdivisionCode } from "@/lib/subdivisions";
import snapshot from "@/data/heartbeat.json";

/**
 * The Bible Heartbeat — live counting endpoint (v3, subdivisions v3.1).
 *
 * GET  → the current live totals (Blob counters), today's bucket,
 *        today's country rows, and today's subdivision rows (full
 *        ISO 3166-2 codes — "US-FL" style). Falls back to the
 *        checked-in snapshot (live: false) whenever the store is
 *        unreachable or not configured, so the homepage never
 *        depends on the store.
 * POST → one anonymous beat: { "type": "read" | "listen" |
 *        "listen_complete" | "book" }. The body carries nothing else —
 *        no book, no chapter, no identity. The reader's country is
 *        derived here from Vercel's edge header (x-vercel-ip-country);
 *        the subdivision comes from x-vercel-ip-country-region,
 *        sanitized per country by lib/subdivisions.ts (v3.1: US
 *        readers → their state, 50 states + DC only) and keyed
 *        generically as an ISO 3166-2 code, never a US-specific
 *        field. Both are aggregate counts only — the IP itself is
 *        never read or stored, and no other header is kept.
 *
 * See HEARTBEAT.md for the schema, merge rule, and known limits.
 */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const KINDS = new Set<BeatKind>(["read", "listen", "listen_complete", "book"]);

interface SnapshotShape {
  since: string;
  totals: {
    chaptersRead: number;
    chaptersHeard: number;
    listensCompleted: number;
    booksFinished: number;
  };
  today: { date: string; chaptersRead: number; chaptersHeard: number };
}

function snapshotFallback() {
  const snap = snapshot as SnapshotShape;
  return NextResponse.json(
    {
      live: false,
      asOf: null,
      since: snap.since,
      totals: snap.totals,
      today: snap.today,
      countries: [],
      subdivisions: [],
    },
    { headers: NO_STORE }
  );
}

export async function GET() {
  try {
    const loaded = await readCounters();
    if (!loaded) return snapshotFallback();
    return NextResponse.json(publicView(loaded.counters), { headers: NO_STORE });
  } catch (err) {
    // The snapshot fallback keeps the homepage whole; the log keeps
    // the cause, so a silent store failure is never silent twice.
    console.error("[heartbeat] live read failed; serving snapshot:", err);
    return snapshotFallback();
  }
}

/** Country of the reader's connection, from Vercel's edge — alpha-2
 *  only, pseudo-codes ("XX" unknown, Tor, etc.) dropped. */
function readerCountry(req: Request): string | null {
  const cc = (req.headers.get("x-vercel-ip-country") || "").toUpperCase();
  return /^[A-Z]{2}$/.test(cc) && cc !== "XX" ? cc : null;
}

/** Subdivision of the reader's connection as a full ISO 3166-2 code
 *  ("US-FL"), from Vercel's edge region header — sanitized hard by
 *  lib/subdivisions.ts (v3.1: US readers only, 50 states + DC;
 *  territories and malformed values dropped). Countries without a
 *  registered sanitizer yield null; the header's raw value is never
 *  stored anywhere. */
function readerSubdivision(req: Request, country: string | null): string | null {
  return subdivisionCode(country, req.headers.get("x-vercel-ip-country-region"));
}

export async function POST(req: Request) {
  let kind: string | undefined;
  try {
    const body = (await req.json()) as { type?: unknown };
    kind = typeof body?.type === "string" ? body.type : undefined;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!kind || !KINDS.has(kind as BeatKind)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  try {
    const country = readerCountry(req);
    const updated = await incrementCounters(
      kind as BeatKind,
      country,
      readerSubdivision(req, country)
    );
    if (!updated) {
      console.error(
        `[heartbeat] beat dropped: incrementCounters returned null (kind: ${kind})`
      );
      return NextResponse.json({ ok: false, live: false }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[heartbeat] beat failed with an error:", err);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
