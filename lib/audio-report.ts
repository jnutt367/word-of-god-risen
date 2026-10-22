/**
 * The "Something sounds wrong" tap — client side.
 *
 * One silent POST naming the book and chapter (1-based, the same
 * numbering the audio manifest uses) and nothing else. Deduped once
 * per chapter per browser session via sessionStorage, the same
 * gentle pattern as lib/heartbeat: the count stays honest without
 * tracking anyone. See AUDIO-REPORTS.md.
 */

const SESSION_PREFIX = "ar:";

function reportedInSession(bookSlug: string, chapterNum: number): boolean {
  try {
    return sessionStorage.getItem(`${SESSION_PREFIX}${bookSlug}:${chapterNum}`) === "1";
  } catch {
    return false;
  }
}

function markReported(bookSlug: string, chapterNum: number): void {
  try {
    sessionStorage.setItem(`${SESSION_PREFIX}${bookSlug}:${chapterNum}`, "1");
  } catch {
    /* private mode etc. — reporting just becomes approximate */
  }
}

export function isAudioReported(bookSlug: string, chapterIdx: number): boolean {
  return reportedInSession(bookSlug, chapterIdx + 1);
}

/** Fire-and-forget: tell the count a listener heard something wrong
 *  in this chapter's audio. chapterIdx is 0-based (the reader's
 *  numbering); the report speaks in 1-based chapters. */
export function reportAudio(bookSlug: string, chapterIdx: number): void {
  const chapterNum = chapterIdx + 1;
  if (reportedInSession(bookSlug, chapterNum)) return;
  markReported(bookSlug, chapterNum);
  try {
    void fetch("/api/audio-report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ book: bookSlug, chapter: chapterNum }),
      keepalive: true,
    }).catch(() => {
      /* a lost report is a pity, never an error the reader sees */
    });
  } catch {
    /* ignore */
  }
}
