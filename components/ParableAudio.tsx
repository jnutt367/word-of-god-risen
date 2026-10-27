"use client";

import { useRef } from "react";
import { beatListenStart, beatListenEnded, notePlayedSpan } from "@/lib/heartbeat";

interface Props {
  src: string;
  /** The parable's source chapter — the same book the card's
   *  "Read in {Gospel} →" door points to. A parable listen counts as
   *  a listen of that chapter (Jason, Oct 27, 2026: "We should really
   *  have something to show anytime someone engages"). */
  bookSlug: string;
  /** 1-based chapter number, as the heartbeat beats count. */
  chapterNum: number;
}

/**
 * A parable card's passage player — the same plain <audio controls>
 * the page has always rendered, with the Bible Heartbeat wired the
 * way the reader's ListenButton wires its MP3 path:
 *  - play from idle fires beatListenStart (the lib dedupes it to
 *    once per session per chapter);
 *  - genuinely played time is fed to notePlayedSpan in continuous
 *    segments, so seeking ahead earns nothing and re-listening
 *    counts again — at 80% of the track truly played, the chapter
 *    counts as listened through (LISTENED_THROUGH);
 *  - the natural end flushes the last segment and calls
 *    beatListenEnded, exactly as the reader does.
 * Counting never breaks playback: every beat call is guarded.
 */
export default function ParableAudio({ src, bookSlug, chapterNum }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const statusRef = useRef<"idle" | "playing" | "paused">("idle");
  // The handlers read the beat target from this ref, same pattern as
  // ListenButton's chapterRef, so they never act on stale props.
  const targetRef = useRef({ bookSlug, chapterNum });
  targetRef.current = { bookSlug, chapterNum };
  // The stretch of the passage being genuinely played right now, as
  // one continuous segment (ListenButton's segRef, same accounting):
  // it closes wherever the sound stops being continuous, and only
  // closed segments are fed to the heartbeat.
  const segRef = useRef<{ start: number; lastPos: number; wall: number } | null>(
    null
  );

  /** Feed the open segment (up to `upto`) to the heartbeat; close it. */
  const flushSegment = (upto: number) => {
    const seg = segRef.current;
    if (!seg) return;
    segRef.current = null;
    const d = audioRef.current?.duration;
    if (d && isFinite(d) && d > 0) {
      const { bookSlug: slug, chapterNum: num } = targetRef.current;
      notePlayedSpan(slug, num, seg.start, Math.min(upto, d), d);
    }
  };

  const handlePlay = () => {
    // Playback began from idle (a fresh press of play, or a replay
    // after the passage ended) — the listen-start beat. Resuming
    // from a pause is not a new start; the lib also dedupes.
    if (statusRef.current === "idle") {
      try {
        beatListenStart(targetRef.current.bookSlug, targetRef.current.chapterNum);
      } catch {
        /* counting never breaks playback */
      }
    }
    statusRef.current = "playing";
  };

  const handlePause = () => {
    const a = audioRef.current;
    // The sound stopped here — close the segment where it stopped.
    flushSegment(a?.currentTime || 0);
    if (a && !a.ended) statusRef.current = "paused";
  };

  const handleEnded = () => {
    const a = audioRef.current;
    // Close the final segment, then let the heartbeat release any
    // crossing the played time reached — the reader's own ending.
    flushSegment(a?.currentTime || 0);
    statusRef.current = "idle";
    try {
      beatListenEnded(
        targetRef.current.bookSlug,
        targetRef.current.chapterNum,
        a?.duration || 0
      );
    } catch {
      /* counting never breaks playback */
    }
  };

  const handleTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    // Follow the playhead as one continuous segment, exactly as
    // ListenButton does: while it advances at the speed of real
    // time it is genuinely sounding; a jump the clock cannot
    // explain is a seek — close the segment where the sound
    // stopped and start a new one where it resumes.
    const d = a.duration;
    const now = a.currentTime || 0;
    const wall = Date.now() / 1000;
    try {
      const { bookSlug: slug, chapterNum: num } = targetRef.current;
      const seg = segRef.current;
      if (!seg) {
        segRef.current = { start: now, lastPos: now, wall };
      } else if (now !== seg.lastPos) {
        const dPos = now - seg.lastPos;
        const dWall = wall - seg.wall;
        if (dPos > 0 && dPos <= dWall * 1.5 + 1) {
          seg.lastPos = now;
          seg.wall = wall;
          // Feed long segments as they grow, so a tab closed
          // mid-passage loses at most a few seconds of listening.
          if (now - seg.start >= 5 && isFinite(d) && d > 0) {
            notePlayedSpan(slug, num, seg.start, now, d);
            seg.start = now;
          }
        } else {
          // Seek or jump: close at the last sounded position.
          if (isFinite(d) && d > 0) {
            notePlayedSpan(slug, num, seg.start, seg.lastPos, d);
          }
          segRef.current = { start: now, lastPos: now, wall };
        }
      } else {
        seg.wall = wall;
      }
    } catch {
      /* counting never breaks playback */
    }
  };

  return (
    <audio
      ref={audioRef}
      controls
      preload="none"
      src={src}
      className="mt-3 w-full"
      onPlay={handlePlay}
      onPause={handlePause}
      onEnded={handleEnded}
      onTimeUpdate={handleTimeUpdate}
    />
  );
}
