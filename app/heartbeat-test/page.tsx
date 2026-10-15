import type { Metadata } from "next";
import Link from "next/link";
import HeartbeatTestPicker from "@/components/HeartbeatTestPicker";
import { isHeartbeatTestPlace } from "@/lib/heartbeat-test-places";

/**
 * HEARTBEAT TEST VIEW — a working preview of the Body Heartbeat
 * disc, built at Jason's word (Oct 15, 2026): "I wish there was
 * some way to get a test to see if someone's state lights up."
 *
 * Pick any US state (or any country in the map data) and the
 * production <BodyHeartbeat> draws it lit with ONE make-believe
 * chapter, through the exact code path the homepage runs. It
 * exists to verify that every place's shape, position, and heart
 * render truly on the disc before a real reader ever lights it.
 *
 * NO-WRITE GUARANTEE: this page never calls /api/heartbeat — the
 * fixture is built in the browser from the vendored map data, and
 * BodyHeartbeat in fixture mode performs no fetch, no poll, and no
 * POST. The live counters are neither read nor written, and the
 * live homepage is untouched. The page is noindexed and is linked
 * from no nav and no sitemap. See HEARTBEAT.md, test-view section.
 */
export const metadata: Metadata = {
  title: "Heartbeat Test View",
  description:
    "Internal test view for the Body Heartbeat map — preview how a place would light the disc. Not live data; nothing here is counted.",
  robots: { index: false, follow: false },
};

const DEFAULT_PLACE = "US-WV";

export default async function HeartbeatTestPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const raw = typeof params.place === "string" ? params.place : "";
  const initialPlace = isHeartbeatTestPlace(raw) ? raw : DEFAULT_PLACE;

  return (
    <div className="pb-10">
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <div
          role="note"
          className="rounded-2xl border-2 border-gold-400/70 bg-vineyard-900 px-6 py-6 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
            Test View
          </p>
          <h1 className="mt-2 font-display text-2xl text-cream-50 sm:text-3xl">
            This is not live data — nothing here is counted
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-cream-100/85">
            This page previews how a place would light the Body
            Heartbeat disc, using one make-believe chapter and the
            very code the homepage runs. It never reads or writes the
            live counters — no chapter is counted, stored, or sent
            anywhere when you use it. The live map is on the{" "}
            <Link className="text-gold-300 underline" href="/">
              homepage
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="mt-6">
        <HeartbeatTestPicker initialPlace={initialPlace} />
      </div>
    </div>
  );
}
