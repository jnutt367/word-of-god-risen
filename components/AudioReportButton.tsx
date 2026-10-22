"use client";

import { useState, useSyncExternalStore } from "react";
import { isAudioReported, reportAudio } from "@/lib/audio-report";

interface Props {
  bookSlug: string;
  chapterIdx: number;
}

/* sessionStorage is the external store: it never changes during a
 * visit except by this button's own tap, so the subscription is a
 * no-op — the same pattern as ListenedMarkButton. */
const subscribe = () => () => {};
const serverSnapshot = () => false;

/**
 * "Something sounds wrong" — the listener's tripwire (Jason's idea,
 * Oct 21, 2026, the night he caught the Mark 12 TTS meltdown with
 * his own ears). One tap quietly reports this chapter's audio —
 * book and chapter only, nothing about the reader — and the report
 * lands in the counts the evening reading report reads, so a
 * damaged chapter finds us before the next listener finds it.
 * Once per chapter per session.
 */
export default function AudioReportButton({ bookSlug, chapterIdx }: Props) {
  const chapterKey = `${bookSlug}:${chapterIdx}`;
  const reportedInSession = useSyncExternalStore(
    subscribe,
    () => isAudioReported(bookSlug, chapterIdx),
    serverSnapshot
  );
  const [tappedKey, setTappedKey] = useState<string | null>(null);
  const reported = reportedInSession || tappedKey === chapterKey;

  const onReport = () => {
    reportAudio(bookSlug, chapterIdx);
    setTappedKey(chapterKey);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onReport}
        disabled={reported}
        aria-pressed={reported}
        title="Tell us this chapter's audio sounds wrong — we'll listen to it ourselves"
        className={`min-h-12 rounded-lg border px-6 py-3 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--reader-verse-num)] ${
          reported
            ? "border-[var(--reader-verse-num)]/40 bg-[var(--reader-verse-num)]/15 text-[var(--reader-verse-num)]"
            : "border-[var(--reader-line)] text-[var(--reader-muted)] hover:border-[var(--reader-verse-num)]/40 hover:text-[var(--reader-verse-num)]"
        }`}
      >
        {reported ? "✓ Reported — thank you" : "Something sounds wrong"}
      </button>
      <p className="text-center text-sm text-[var(--reader-muted)]">
        {reported
          ? "Thank you — we'll give this chapter a fresh listen ourselves."
          : "Gibberish, looping, or words that aren't in the chapter? Tap, and we'll check this chapter's audio."}
      </p>
    </div>
  );
}
