"use client";

import { useState, useSyncExternalStore } from "react";
import { beatListenedMarked, isListenedMarked } from "@/lib/heartbeat";

interface Props {
  bookSlug: string;
  chapterIdx: number;
}

/* sessionStorage is the external store here: it never changes
 * during a visit except by this button's own tap, so the
 * subscription is a no-op and the snapshot is simply re-read on
 * render. The server snapshot is "not marked" — the button first
 * paints ready to tap, then settles to its counted state if this
 * session already marked the chapter. */
const subscribe = () => () => {};
const serverSnapshot = () => false;

/**
 * "✓ I listened to this chapter" — the reader's own word, counted
 * (Jason's direction, Oct 20, 2026). The player can measure the MP3
 * path's played time, but device TTS reports nothing, and some
 * listening simply happens off the playhead's watch — so the reader
 * is trusted to say so, and their say-so is counted as its own
 * thing: a `listened_marked` beat in its own total, never folded
 * into the measured "listened through" count. Once per chapter per
 * browser session (the dedupe lives in lib/heartbeat); after the
 * tap the button rests in its counted state for the visit.
 *
 * This is NOT the "Mark as done — just for my place" place-keeper
 * beside it: that
 * one keeps the reader's own place on their own phone and can be
 * undone. This one speaks into the Body's shared count, once.
 */
export default function ListenedMarkButton({ bookSlug, chapterIdx }: Props) {
  const chapterKey = `${bookSlug}:${chapterIdx}`;
  const markedInSession = useSyncExternalStore(
    subscribe,
    () => isListenedMarked(bookSlug, chapterIdx),
    serverSnapshot
  );
  const [tappedKey, setTappedKey] = useState<string | null>(null);
  const marked = markedInSession || tappedKey === chapterKey;

  const onMark = () => {
    beatListenedMarked(bookSlug, chapterIdx);
    setTappedKey(chapterKey);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onMark}
        disabled={marked}
        aria-pressed={marked}
        title="Tell the count you listened to this chapter"
        className={`min-h-12 rounded-lg px-6 py-3 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--reader-verse-num)] ${
          marked
            ? "border border-[var(--reader-verse-num)]/40 bg-[var(--reader-verse-num)]/15 text-[var(--reader-verse-num)]"
            : "bg-[var(--reader-verse-num)] text-[var(--reader-bg)] hover:opacity-90"
        }`}
      >
        {marked ? "✓ Counted — thank you" : "✓ I listened to this chapter"}
      </button>
      <p className="text-center text-sm text-[var(--reader-muted)]">
        {marked
          ? "Your listening is on the record with the Body's."
          : "Heard it? Tap, and this chapter joins the Body's count — anonymous, just a number among neighbors."}
      </p>
    </div>
  );
}
