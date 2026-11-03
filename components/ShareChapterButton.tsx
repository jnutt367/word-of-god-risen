"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  slug: string;
  bookTitle: string;
  chapterNum: number;
  chapterIdx: number;
}

/**
 * "Share" — hands THIS chapter (not just the app) to a friend: the
 * exact pattern the overseas chapters followed — a person carrying a
 * chapter to a person. First choice: the device's own share sheet
 * with the canonical chapter address. With no share sheet, the link
 * is copied and the button itself quietly says "Link copied" for a
 * few seconds — no popups, no panels. A dismissed share sheet stays
 * quiet; no fallback fires behind the visitor's back. Styled to sit
 * unnoticed beside the Lamp and word-size pills in the reader's top
 * bar — same border, same muted voice.
 */
export default function ShareChapterButton({
  slug,
  bookTitle,
  chapterNum,
  chapterIdx,
}: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  const url = `https://word-of-god-risen.vercel.app/book/${slug}/${chapterIdx}`;
  const title = `${bookTitle} ${chapterNum} — Word of God Risen`;
  const text =
    `Listen to ${bookTitle} ${chapterNum}, read out loud by Grandpa Teddy` +
    ` — every chapter free, no account, no password.`;

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // The visitor dismissed the sheet — stay quiet, no fallback.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Anything else: fall through and offer the link by copying it.
      }
    }

    // Fallback: copy the chapter link and confirm in place.
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 3000);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={share}
        aria-label={`Share ${bookTitle} ${chapterNum} with a friend`}
        className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-[var(--reader-line)] px-4 py-2 text-sm font-medium text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)] sm:min-h-0"
      >
        <span aria-hidden="true">{copied ? "✓" : "⤴"}</span>
        {copied ? "Link copied" : "Share"}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied — paste it anywhere." : ""}
      </span>
    </>
  );
}
