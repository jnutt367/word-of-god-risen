"use client";

import { useEffect, useRef, useState } from "react";
import type { Verse } from "@/lib/verses";

interface Props {
  bookTitle: string;
  chapterNum: number;
  verses: Verse[];
}

type Status = "idle" | "playing" | "paused";

const VOICE_KEY = "wogr:tts-voice";
const RATE_KEY = "wogr:tts-rate";

/**
 * "Listen" — reads the chapter aloud with the device's built-in
 * text-to-speech (free, offline-capable, no backend). One utterance per
 * verse for natural cadence and reliable long-chapter playback.
 * The gear opens voice + speed settings (choice is remembered).
 */
export default function ListenButton({ bookTitle, chapterNum, verses }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [canListen, setCanListen] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const session = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const supported = () =>
    typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!supported()) return;
    setCanListen(true);
    try {
      setVoiceURI(localStorage.getItem(VOICE_KEY));
      const savedRate = parseFloat(localStorage.getItem(RATE_KEY) || "");
      if (savedRate >= 0.5 && savedRate <= 2) setRate(savedRate);
    } catch {
      /* ignore */
    }
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
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

  // Close settings on outside click / Escape.
  useEffect(() => {
    if (!showSettings) return;
    const onDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSettings(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showSettings]);

  if (!canListen) return null;

  const english = voices.filter((v) => v.lang?.startsWith("en"));

  /** Default: prefer a male English voice. */
  const defaultVoice = (): SpeechSynthesisVoice | null => {
    if (!english.length) return null;
    const maleHints = [
      "david",
      "daniel",
      "james",
      "mark",
      "aaron",
      "fred",
      "thomas",
      "george",
      "alex",
      "guy",
      "christopher",
      "male",
    ];
    const lowered = (v: SpeechSynthesisVoice) => v.name.toLowerCase();
    return (
      english.find((v) => maleHints.some((h) => lowered(v).includes(h))) ??
      english.find(
        (v) =>
          !/female|samantha|zira|jenny|aria|michelle|emma|olivia|karen|tessa|serena|veena|jane/i.test(
            v.name
          )
      ) ??
      english[0]
    );
  };

  const activeVoice =
    english.find((v) => v.voiceURI === voiceURI) ?? defaultVoice();

  const chooseVoice = (uri: string) => {
    setVoiceURI(uri);
    try {
      localStorage.setItem(VOICE_KEY, uri);
    } catch {
      /* ignore */
    }
  };

  const chooseRate = (r: number) => {
    setRate(r);
    try {
      localStorage.setItem(RATE_KEY, String(r));
    } catch {
      /* ignore */
    }
  };

  const start = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    session.current += 1;
    const mySession = session.current;
    const voice = activeVoice;
    const parts = [`${bookTitle}, chapter ${chapterNum}.`];
    for (const v of verses) {
      const t = v.text.trim();
      if (t) parts.push(t);
    }
    parts.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.rate = rate;
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
    <span ref={panelRef} className="relative inline-flex items-center gap-1.5">
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
      <button
        type="button"
        onClick={() => setShowSettings((v) => !v)}
        aria-expanded={showSettings}
        aria-label="Voice settings"
        title="Voice settings"
        className="rounded-full border border-[var(--reader-line)] px-2.5 py-1.5 text-sm text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)]"
      >
        <span aria-hidden="true">⚙</span>
      </button>
      {showSettings && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[var(--reader-line)] bg-[var(--reader-card)] p-4 shadow-xl">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--reader-muted)]">
              Voice
            </span>
            <select
              value={activeVoice?.voiceURI ?? ""}
              onChange={(e) => chooseVoice(e.target.value)}
              className="w-full rounded-lg border border-[var(--reader-line)] bg-[var(--reader-bg)] px-2 py-2 text-sm text-[var(--reader-ink)]"
            >
              {english.length === 0 && <option value="">Loading voices…</option>}
              {english.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--reader-muted)]">
              Speed
            </span>
            <select
              value={rate}
              onChange={(e) => chooseRate(parseFloat(e.target.value))}
              className="w-full rounded-lg border border-[var(--reader-line)] bg-[var(--reader-bg)] px-2 py-2 text-sm text-[var(--reader-ink)]"
            >
              <option value={0.75}>0.75× — slow</option>
              <option value={1}>1× — normal</option>
              <option value={1.25}>1.25×</option>
              <option value={1.5}>1.5× — fast</option>
            </select>
          </label>
          <p className="mt-3 text-xs leading-relaxed text-[var(--reader-muted)]">
            Voices come from your device — every phone ships with several.
          </p>
        </div>
      )}
    </span>
  );
}
