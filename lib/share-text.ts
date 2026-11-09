/* Sharing a verse as TEXT — the pattern ShareChapterButton set for
 * chapters, at verse size: the device's own share sheet first; with
 * no share sheet, the words are copied and the caller confirms in
 * place. A dismissed share sheet stays quiet — no fallback fires
 * behind the visitor's back. Text only; no images are made here. */

export type ShareTextResult = "shared" | "copied" | "dismissed" | "failed";

export async function shareText(payload: {
  title: string;
  text: string;
  url?: string;
}): Promise<ShareTextResult> {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError")
        return "dismissed";
      // Anything else: fall through and offer the words by copying.
    }
  }

  try {
    await navigator.clipboard.writeText(payload.text);
    return "copied";
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = payload.text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok ? "copied" : "failed";
    } catch {
      return "failed";
    }
  }
}

/** The one shape of a shared verse: the words, then the reference. */
export function verseShareText(verseText: string, reference: string): string {
  return `"${verseText}" — ${reference}\n\nRead the whole Bible out loud, free: https://word-of-god-risen.vercel.app/`;
}
