"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";
import { beatWatch } from "@/lib/heartbeat";
import { setVideoOpen } from "@/lib/video-open";
import WatchPlayer from "./WatchPlayer";

/**
 * The video door — how every video in this app opens.
 *
 * Oct 20, 2026 (Jason's rule): tapping a video must never carry the
 * reader off to YouTube without asking — so every door asked first:
 * "Watch here," or "Open in YouTube."
 *
 * Oct 31, 2026 (Jason's ruling, superseding the gate): the asking
 * itself was leaving views on the table. Now the tap IS the answer:
 *
 *   ▶ The video plays HERE, immediately, in the app — and the watch
 *     counts on that tap (the click is the intent; no amount of
 *     watching is owed). No one is carried off anywhere.
 *   "Open in YouTube ↗" rests beside the player for readers who'd
 *     rather go — an offer, never a gate. Its tap counts too (the
 *     beat has usually already fired; the dedupe keeps one count
 *     per video per visit either way).
 *
 * Every video door in the app opens through this dialog or through
 * the same tap-to-play pattern (VideoEmbed plays in place), so the
 * ruling holds everywhere at once.
 */

export function useVideoChoice() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openChoice = useCallback((e: SyntheticEvent) => {
    triggerRef.current = e.currentTarget as HTMLElement;
    setOpen(true);
  }, []);

  const closeChoice = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) {
      // Focus returns to the card that asked, once the dialog is gone.
      requestAnimationFrame(() => {
        const el = triggerRef.current;
        if (el && el.isConnected) el.focus();
      });
    }
  }, []);

  return { open, openChoice, closeChoice };
}

export function VideoChoiceModal({
  onClose,
  videoId,
  title,
  youtubeUrl,
  vertical = false,
  onWatchHere,
}: {
  onClose: (returnFocus?: boolean) => void;
  videoId: string;
  title: string;
  /** Where "Open in YouTube" goes — offered beside the player. */
  youtubeUrl: string;
  /** Shorts are 9:16; everything else is 16:9. */
  vertical?: boolean;
  /**
   * When given, playback hands off to the caller instead of opening
   * the player in this dialog (VideoEmbed plays in place). Kept for
   * compatibility: the beat fires and the handoff happens on open.
   */
  onWatchHere?: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const handedOff = useRef(false);

  // The tap already happened — the watch counts now, and playback
  // begins. For in-place callers, hand off and step aside.
  useEffect(() => {
    beatWatch(videoId);
    if (onWatchHere && !handedOff.current) {
      handedOff.current = true;
      onWatchHere();
      onClose(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Hold the page still behind the dialog, land focus on it, keep
  // Escape and Tab inside it. Holding still now also means RAISING
  // the video-open signal (lib/video-open.ts, Nov 5, 2026): while
  // the film plays, the page behind it rests — the map's breathing
  // pauses, the hero stops walking, the heartbeat poll skips — so
  // a small phone spends itself on the film, not on the scenery.
  // The cleanup lowers it again on EVERY way out (Close, Escape,
  // backdrop tap, unmount), so the page always wakes.
  useEffect(() => {
    dialogRef.current?.focus();
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    setVideoOpen(true);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Capture phase + stop: menus behind the dialog (the header's
        // own Escape handler) must not also react to this keypress.
        e.stopPropagation();
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const box = dialogRef.current;
        if (!box) return;
        const focusables = box.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (document.activeElement === box) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      setVideoOpen(false);
      root.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (onWatchHere) {
    // In-place callers never see the dialog — the tap already
    // counted and playback already began in their own frame.
    return null;
  }

  return createPortal(
    <div
      // The veil is plain dark, no backdrop blur (Nov 5, 2026):
      // blurring the whole live page under a playing film cost a
      // low-end phone a frame-tax it paid in pauses and freezes.
      // Same vineyard-950/80 look family, none of the filter cost.
      className="fixed inset-0 z-[100] flex items-center justify-center bg-vineyard-950/80 p-4"
      onClick={() => onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`relative max-h-[92dvh] w-full overflow-y-auto rounded-2xl border border-gold-500/25 bg-vineyard-900 shadow-[0_24px_60px_rgba(0,0,0,0.6)] ${
          vertical ? "max-w-sm p-3" : "max-w-3xl p-3"
        }`}
      >
        <h2 id={titleId} className="sr-only">
          {title}
        </h2>
        <div
          className={
            vertical
              ? "mx-auto aspect-[9/16] w-[min(84vw,42dvh)] overflow-hidden rounded-xl bg-vineyard-950"
              : "aspect-video w-full overflow-hidden rounded-xl bg-vineyard-950"
          }
        >
          {/* The player is WatchPlayer, not a plain iframe, so a
              watch here can be counted — its PLAYING fire stands
              behind the tap's beat as a backstop. Full-screen rides
              the player's own controls. */}
          <WatchPlayer videoId={videoId} title={title} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-4 px-1 pb-1">
          <p className="min-w-0 truncate text-sm text-sage-300">{title}</p>
          <span className="flex shrink-0 items-center gap-2">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => beatWatch(videoId)}
              className="flex min-h-[48px] items-center rounded-lg px-3 text-base font-medium text-sage-300 transition-colors hover:bg-vineyard-800 hover:text-cream-100"
            >
              Open in YouTube <span aria-hidden="true">↗</span>
            </a>
            <button
              type="button"
              onClick={() => onClose()}
              className="min-h-[48px] cursor-pointer rounded-lg px-4 text-base font-semibold text-gold-300 transition-colors hover:bg-vineyard-800 hover:text-gold-400"
            >
              Close
            </button>
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
