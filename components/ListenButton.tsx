"use client";

import { useEffect, useRef, useState } from "react";
import type { Verse } from "@/lib/verses";

interface Props {
  bookTitle: string;
  chapterNum: number;
  verses: Verse[];
}

type Status = "idle" | "playing" | "paused";

/**
 * "Listen" — reads the chapter aloud with the device's built-in
 * text-to-speech (free, offline-capable, no backend). One utterance per
 * verse for natural cadence and reliable long-chapter playback.
 */
export default function ListenButton({ bookTitle, chapterNum, verses }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [canListen, setCanListen] = useState(false);
  const session = useRef(0);

  const supported = () =>
    typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!supported()) return;
    setCanListen(true);
    // Warm up voices; some browsers load them asynchronously.
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Stop playback when the text changes (e.g. version switch).
  useEffect(() => {
    if (supported()) window.speechSynthesis.cancel();
    session.current += 1;
    setStatus("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verses]);

  if (!canListen) return null;

  const pickVoice = (): SpeechSynthesisVoice | null => {
    const vs = window.speechSynthesis.getVoices();
    if (!vs.length) return null;
    return (
      vs.find((v) => v.lang === "en-US" && /google/i.test(v.name)) ??
      vs.find((v) => v.lang?.startsWith("en-US")) ??
      vs.find((v) => v.lang?.startsWith("en")) ??
      null
    );
  };

  const start = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    session.current += 1;
    const mySession = session.current;
    const voice = pickVoice();
    const parts = [`${bookTitle}, chapter ${chapterNum}.`];
    for (const v of verses) {
      const t = v.text.trim();
      if (t) parts.push(t);
    }
    parts.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      if (i === parts.length - 1) {
        u.onend = () => {
          if (session.current === mySession) setStatus("idle");
        };
      }
      synth.speak(u);
    });
    setStatus("playing");
  };

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (status === "idle") start();
    else if (status === "playing") {
      synth.pause();
      setStatus("paused");
    } else {
      synth.resume();
      setStatus("playing");
    }
  };

  const stop = () => {
    session.current += 1;
    window.speechSynthesis.cancel();
    setStatus("idle");
  };

  const btn =
    "rounded-full border border-[var(--reader-line)] px-4 py-1.5 text-sm font-medium text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)]";

  const label =
    status === "playing" ? "Pause" : status === "paused" ? "Resume" : "Listen";
  const icon = status === "playing" ? "⏸" : status === "paused" ? "▶" : "🔊";

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={status !== "idle"}
        aria-label={
          status === "playing"
            ? "Pause listening"
            : status === "paused"
              ? "Resume listening"
              : `Listen to ${bookTitle} ${chapterNum}`
        }
        title={status === "idle" ? "Listen to this chapter" : label}
        className={btn}
      >
        <span aria-hidden="true">{icon}</span>
        <span className="hidden sm:inline"> {label}</span>
      </button>
      {status !== "idle" && (
        <button
          type="button"
          onClick={stop}
          aria-label="Stop listening"
          title="Stop"
          className="rounded-full border border-[var(--reader-line)] px-3 py-1.5 text-sm text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)]"
        >
          ⏹
        </button>
      )}
    </span>
  );
}
