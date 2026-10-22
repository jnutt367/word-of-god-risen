import { NextResponse } from "next/server";
import { incrementReports, readReports } from "@/lib/audio-report-store";
import { heartbeatToday } from "@/lib/heartbeat-date";

/**
 * Listener audio reports — the "Something sounds wrong" tap.
 *
 * POST → one anonymous report: { "book": "mark", "chapter": 12 }.
 *        The body carries the book and chapter and NOTHING else —
 *        no identity, no geography; the reader's IP is never read.
 *        Reports land as aggregate counts per chapter per day in a
 *        private Blob document (see lib/audio-report-store.ts and
 *        AUDIO-REPORTS.md).
 * GET  → the report counts (today + recent days + lifetime totals),
 *        so the evening reading report can name any chapter whose
 *        listeners are hearing something wrong.
 */

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

const BOOK_RE = /^[a-z0-9-]{1,48}$/;
/** Soft cap: beyond this many reports for one chapter in a day,
 *  further taps are accepted but not counted — the chapter is
 *  already as flagged as a chapter can be. */
const DAILY_CAP = 300;

export async function GET() {
  try {
    const loaded = await readReports();
    if (!loaded) {
      return NextResponse.json(
        { live: false, today: { date: heartbeatToday(), chapters: {} }, totals: {}, days: [] },
        { headers: NO_STORE }
      );
    }
    const today = heartbeatToday();
    const day = loaded.reports.days.find((d) => d.date === today);
    return NextResponse.json(
      {
        live: true,
        since: loaded.reports.since,
        updatedAt: loaded.reports.updatedAt,
        today: { date: today, chapters: day?.chapters ?? {} },
        totals: loaded.reports.totals,
        days: loaded.reports.days,
      },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error("[audio-report] read failed:", err);
    return NextResponse.json(
      { live: false, today: { date: heartbeatToday(), chapters: {} }, totals: {}, days: [] },
      { headers: NO_STORE }
    );
  }
}

export async function POST(req: Request) {
  let book: unknown, chapter: unknown;
  try {
    const body = (await req.json()) as { book?: unknown; chapter?: unknown };
    book = body?.book;
    chapter = body?.chapter;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (
    typeof book !== "string" ||
    !BOOK_RE.test(book) ||
    typeof chapter !== "number" ||
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > 250
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const key = `${book}:${chapter}`;
  try {
    const loaded = await readReports();
    if (!loaded) {
      return NextResponse.json({ ok: false, live: false }, { status: 503 });
    }
    const today = heartbeatToday();
    const dayCount =
      loaded.reports.days.find((d) => d.date === today)?.chapters[key] ?? 0;
    if (dayCount < DAILY_CAP) {
      const updated = await incrementReports(key);
      if (!updated) {
        return NextResponse.json({ ok: false, live: false }, { status: 503 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[audio-report] report failed with an error:", err);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
