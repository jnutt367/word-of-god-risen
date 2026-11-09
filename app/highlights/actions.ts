"use server";

import { resolveHighlights, type ResolvedHighlight } from "./verses";
import { BIBLE_VERSIONS, DEFAULT_VERSION } from "@/lib/versions";

/** The My Highlights page hands the server the keys from the
 *  reader's own localStorage and gets back the verses' words in
 *  their chosen translation. Nothing is kept server-side. */
export async function fetchHighlightVerses(
  keys: string[],
  version: string
): Promise<ResolvedHighlight[]> {
  const known = BIBLE_VERSIONS.some((v) => v.id === version);
  return resolveHighlights(keys.slice(0, 2000), known ? version : DEFAULT_VERSION);
}
