"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { beatOpen } from "@/lib/heartbeat";

/**
 * The open beat (Oct 27, 2026) — mounted once in the root layout,
 * so opening the app on ANY page counts the open for the visitor's
 * place: their country (and state, where recorded) rests on the
 * Earth map as a faint ember until the Word is read or heard there.
 * The beat itself dedupes to once per browser session in
 * lib/heartbeat.ts; this component only has to be present.
 *
 * The one door it does not walk through: /heartbeat-test, whose
 * standing guarantee is that it never writes to the live counters.
 * A visit there previews the map; it does not count as an open.
 */
export default function AppOpenBeat() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname?.startsWith("/heartbeat-test")) return;
    beatOpen();
  }, [pathname]);
  return null;
}
