"use client";

import { useEffect, useRef, useState } from "react";

const SHARE_TITLE = "Word of God Risen";
const SHARE_TEXT =
  "The whole Bible, read out loud by Grandpa Teddy — every chapter free. No account, no password: tap a book, tap a chapter, tap Listen.";
const SHARE_URL = "https://word-of-god-risen.vercel.app/";
const SHARE_CARD_URL = "/share-card.png";
const SHARE_CARD_NAME = "word-of-god-risen-share-card.png";

/**
 * "Share this app" — shares the app itself (not a verse) so Jason can
 * hand it to someone standing next to him. First choice: the picture
 * card (public/share-card.png) as a real image file through the Web
 * Share API, so it lands as ONE clean picture with the blessed line
 * and link riding along. Where file sharing isn't offered, it falls
 * back to the plain text + link share; with no share sheet at all it
 * copies the link and confirms, with a manual copy panel as the last
 * resort. A dismissed share sheet stays quiet — no fallback fires
 * behind the visitor's back.
 */
export default function ShareAppButton({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const cardPromise = useRef<Promise<File | null> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  // The manual-copy panel closes on an outside tap or Escape,
  // the same way the header's other panels behave.
  useEffect(() => {
    if (!manualOpen) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setManualOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setManualOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [manualOpen]);

  // The picture card, fetched once and kept for the next tap.
  function loadCard(): Promise<File | null> {
    if (!cardPromise.current) {
      cardPromise.current = (async () => {
        try {
          const res = await fetch(SHARE_CARD_URL);
          if (!res.ok) return null;
          const blob = await res.blob();
          return new File([blob], SHARE_CARD_NAME, { type: "image/png" });
        } catch {
          return null;
        }
      })();
    }
    return cardPromise.current;
  }

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      // First choice: the picture card itself, so the app arrives as
      // one clean image — not a wall of words with a doubled preview.
      const card = await loadCard();
      if (card && navigator.canShare && navigator.canShare({ files: [card] })) {
        try {
          await navigator.share({
            files: [card],
            title: SHARE_TITLE,
            text: SHARE_TEXT,
            url: SHARE_URL,
          });
          return;
        } catch (err) {
          // The visitor dismissed the sheet — stay quiet, no fallback.
          if (err instanceof DOMException && err.name === "AbortError") return;
          // Anything else: fall through to the plain text + link share.
        }
      }

      // Second choice: the device's own share sheet (texts, Messenger, …).
      try {
        await navigator.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url: SHARE_URL,
        });
        return;
      } catch (err) {
        // The visitor dismissed the sheet — stay quiet, no fallback.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Anything else: fall through and offer the link to copy.
      }
    }

    // Fallback: copy the link and say so, briefly and visibly.
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 3000);
      return;
    } catch {
      // Clipboard unavailable too — open the manual copy panel below.
    }
    setManualOpen(true);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={share}
        aria-label="Share this app with a friend"
        className={
          compact
            ? "flex min-h-[44px] items-center gap-1 rounded-lg bg-gold-500 px-3 py-2.5 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400"
            : "flex min-h-[48px] items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-3 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400"
        }
      >
        <span aria-hidden="true">{copied ? "✓" : "⤴"}</span>
        {copied ? "Link copied" : compact ? "Share" : "Share this app"}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied — paste it anywhere." : ""}
      </span>

      {manualOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-gold-500/25 bg-vineyard-950 p-4 shadow-2xl">
          <p className="text-sm font-semibold text-cream-100">
            Copy the app link:
          </p>
          <input
            readOnly
            value={SHARE_URL}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Word of God Risen app link"
            className="mt-2 w-full rounded-lg border border-cream-100/25 bg-vineyard-900 px-3 py-2.5 text-sm text-cream-100"
          />
          <p className="mt-2 text-sm text-sage-300">
            Tap the link to select it, then copy it and paste it anywhere.
          </p>
          <button
            type="button"
            onClick={() => setManualOpen(false)}
            className="mt-3 min-h-[44px] rounded-lg border border-cream-100/25 px-3 py-2 text-sm font-medium text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
