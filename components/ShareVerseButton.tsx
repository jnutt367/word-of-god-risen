"use client";

import { useState } from "react";

interface Props {
  verseText: string;
  reference: string; // e.g. "John 3:16"
}

const BACKGROUNDS = [
  "/images/share-bg/vineyard-dawn.jpg",
  "/images/share-bg/starry-night.jpg",
];

const APP_URL = "word-of-god-risen.vercel.app";

/**
 * Renders a verse as a beautiful 1080×1080 share image on a canvas:
 * Pixar background, elegant serif verse text, reference, TruVINE emblem,
 * and the app URL. Downloads the PNG, or uses the Web Share API when available.
 */
export default function ShareVerseButton({ verseText, reference }: Props) {
  const [busy, setBusy] = useState(false);

  async function share() {
    if (busy) return;
    setBusy(true);
    try {
      const size = 1080;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      const bg = new Image();
      bg.crossOrigin = "anonymous";
      bg.src = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
      await new Promise<void>((res, rej) => {
        bg.onload = () => res();
        bg.onerror = () => rej(new Error("bg"));
      });
      ctx.drawImage(bg, 0, 0, size, size);

      // Soft dark overlay for readability
      const grad = ctx.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, "rgba(8,18,12,0.55)");
      grad.addColorStop(0.5, "rgba(8,18,12,0.35)");
      grad.addColorStop(1, "rgba(8,18,12,0.65)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // Emblem (top center)
      const emblem = new Image();
      emblem.crossOrigin = "anonymous";
      emblem.src = "/images/truvine-emblem.png";
      try {
        await new Promise<void>((res, rej) => {
          emblem.onload = () => res();
          emblem.onerror = () => rej(new Error("emblem"));
        });
        const ew = 110;
        ctx.drawImage(emblem, size / 2 - ew / 2, 72, ew, ew);
      } catch {
        /* emblem optional */
      }

      // Verse text (wrapped, centered)
      ctx.fillStyle = "#fdf6e3";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const maxWidth = size - 220;
      let fontSize = 64;
      const words = verseText.split(/\s+/);
      let lines: string[] = [];
      // shrink until it fits in ~10 lines
      while (fontSize > 36) {
        ctx.font = `italic 400 ${fontSize}px Georgia, serif`;
        lines = [];
        let line = "";
        for (const w of words) {
          const test = line ? line + " " + w : w;
          if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = w;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);
        if (lines.length <= 10) break;
        fontSize -= 4;
      }
      const lineHeight = fontSize * 1.45;
      const blockH = lines.length * lineHeight;
      let y = size / 2 - blockH / 2 + 40;
      ctx.font = `italic 400 ${fontSize}px Georgia, serif`;
      // gentle shadow for legibility
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 18;
      for (const l of lines) {
        ctx.fillText(`\u201C${lines.indexOf(l) === 0 ? "" : ""}${l}`, size / 2, y);
        y += lineHeight;
      }
      ctx.shadowBlur = 0;

      // Reference
      ctx.font = `700 44px Georgia, serif`;
      ctx.fillStyle = "#d4af37";
      ctx.fillText(reference, size / 2, size / 2 + blockH / 2 + 110);

      // App URL footer
      ctx.font = `400 30px Georgia, serif`;
      ctx.fillStyle = "rgba(253,246,227,0.75)";
      ctx.fillText(APP_URL, size / 2, size - 80);

      // Export
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, "image/png")
      );
      if (!blob) return;
      const file = new File([blob], `${reference.replace(/\s+/g, "-")}.png`, {
        type: "image/png",
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: reference,
          text: `${verseText} — ${reference}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch {
      /* user cancelled or unsupported — stay quiet */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      disabled={busy}
      className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--reader-verse-num)]/50 align-middle font-body text-[0.7rem] text-[var(--reader-verse-num)] transition-colors hover:bg-[var(--reader-verse-num)] hover:text-[var(--reader-bg)] disabled:opacity-50"
      aria-label={`Share ${reference} as an image`}
      title={`Share ${reference} as an image`}
    >
      {busy ? "…" : "⤴"}
    </button>
  );
}
