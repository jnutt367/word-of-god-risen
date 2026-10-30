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
import WatchPlayer from "./WatchPlayer";

/**
 * The video choice — Jason's rule (Oct 20, 2026): tapping a video in
 * this app must never carry the reader off to YouTube without asking.
 * Every video door presents this calm choice first:
 *
 *   ▶ Watch here       — plays inside the app, in an embedded player;
 *                        the reader keeps their place.
 *   Open in YouTube ↗  — the old behavior, only on an explicit tap.
 *
 * The choice is offered at every door, every time — no settings page,
 * no remembered preference. Nothing autoplays: the only play that
 * starts on its own is the one the reader just chose ("Watch here").
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
  /** Where "Open in YouTube" goes — the door's original link. */
  youtubeUrl: string;
  /** Shorts are 9:16; everything else is 16:9. */
  vertical?: boolean;
  /**
   * When given, "Watch here" hands playback to the caller instead of
   * opening the player in this dialog (VideoEmbed plays in place, so
   * the reader never leaves their spot on the page).
   */
  onWatchHere?: () => void;
}) {
  const [stage, setStage] = useState<"choose" | "play">("choose");
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const promptId = useId();

  // On open: hold the page still behind the dialog, land focus on the
  // dialog itself, keep Escape and Tab inside it.
  useEffect(() => {
    dialogRef.current?.focus();
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";

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
          // Focus starts on the dialog itself; step into it.
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
      root.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const watchHere = () => {
    if (onWatchHere) {
      onWatchHere();
      onClose(false);
    } else {
      setStage("play");
      // Move focus onto the player region as it appears.
      requestAnimationFrame(() => dialogRef.current?.focus());
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-vineyard-950/80 p-4 backdrop-blur-sm"
      onClick={() => onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={stage === "choose" ? promptId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`relative max-h-[92dvh] w-full overflow-y-auto rounded-2xl border border-gold-500/25 bg-vineyard-900 shadow-[0_24px_60px_rgba(0,0,0,0.6)] ${
          stage === "play"
            ? vertical
              ? "max-w-sm p-3"
              : "max-w-3xl p-3"
            : "max-w-md p-6"
        }`}
      >
        {stage === "choose" && (
          <button
            type="button"
            onClick={() => onClose()}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-vineyard-950/70 text-xl leading-none text-cream-100 transition-colors hover:bg-vineyard-800"
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}

        {stage === "choose" ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
              Watch
            </p>
            <h2
              id={titleId}
              className="mt-2 pr-10 font-display text-xl leading-snug text-cream-50"
            >
              {title}
            </h2>
            <p id={promptId} className="mt-2 text-base text-sage-300">
              Watch it right here in the app, or open it over on YouTube —
              your choice.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={watchHere}
                className="flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold-400 px-5 text-lg font-semibold text-vineyard-950 transition-colors hover:bg-gold-300"
              >
                <span aria-hidden="true">▶</span> Watch here
              </button>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onClose(false)}
                className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl border border-gold-500/40 px-5 text-lg font-semibold text-cream-100 transition-colors hover:bg-vineyard-800"
              >
                Open in YouTube <span aria-hidden="true">↗</span>
              </a>
              <button
                type="button"
                onClick={() => onClose()}
                className="min-h-[48px] w-full cursor-pointer rounded-xl px-5 text-base font-medium text-sage-300 transition-colors hover:text-cream-100"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
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
              {/* The player is WatchPlayer, not a plain iframe, so
                  a watch in this dialog can be counted — the
                  video-watch heart (Oct 29, 2026) fires from its
                  PLAYING state. Full-screen rides the player's
                  own controls, as it did on the iframe. */}
              <WatchPlayer videoId={videoId} title={title} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 px-1 pb-1">
              <p className="min-w-0 truncate text-sm text-sage-300">
                {title}
              </p>
              <button
                type="button"
                onClick={() => onClose()}
                className="min-h-[48px] shrink-0 cursor-pointer rounded-lg px-4 text-base font-semibold text-gold-300 transition-colors hover:bg-vineyard-800 hover:text-gold-400"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
