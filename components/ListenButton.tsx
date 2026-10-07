"use client";

import { useEffect, useRef, useState } from "react";
import type { Verse } from "@/lib/verses";
import { getBook } from "@/lib/bible";

interface Props {
  bookSlug: string;
  bookTitle: string;
  chapterNum: number;
  verses: Verse[];
}

type Status = "idle" | "playing" | "paused";

const VOICE_KEY = "wogr:tts-voice";
const RATE_KEY = "wogr:tts-rate";
const AMBIENT_KEY = "wogr:ambient";
const MANIFEST_URL = "/audio-manifest.json";
/** Ambient bed follows the book's mood: desert for the ancient books, warm for the tender ones. */
function ambientUrlFor(slug: string): string {
  const mood = getBook(slug)?.mood ?? "desert";
  return mood === "warm" ? "/audio/ambient-warm.mp3" : "/audio/ambient-desert.mp3";
}
/** Warm bed sits well under narration without fighting it. */
const AMBIENT_VOL = 0.18;

/** Fetched once, then reused for every chapter. */
let manifestPromise: Promise<Record<string, string>> | null = null;
function loadManifest(): Promise<Record<string, string>> {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL)
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return manifestPromise;
}

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

/**
 * "Listen" — plays the chapter aloud.
 * If the chapter has an AI-narrated MP3 (see public/audio-manifest.json),
 * it streams that with play/pause + a scrub bar. Otherwise it falls back
 * to the device's built-in text-to-speech (free, offline-capable).
 * The gear opens voice + speed settings for TTS (choice is remembered).
 */
export default function ListenButton({
  bookSlug,
  bookTitle,
  chapterNum,
  verses,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [canListen, setCanListen] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [mp3Url, setMp3Url] = useState<string | null | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ambientOn, setAmbientOn] = useState(true);
  const session = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  const supported = () =>
    typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!supported()) return;
    setCanListen(true);
    try {
      setVoiceURI(localStorage.getItem(VOICE_KEY));
      const savedRate = parseFloat(localStorage.getItem(RATE_KEY) || "");
      if (savedRate >= 0.5 && savedRate <= 2) setRate(savedRate);
      const amb = localStorage.getItem(AMBIENT_KEY);
      if (amb === "off") setAmbientOn(false);
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

  // Look up an MP3 for this chapter; reset playback when the chapter changes.
  useEffect(() => {
    const key = `${bookSlug}:${chapterNum}`;
    let live = true;
    stopAll();
    setMp3Url(undefined);
    loadManifest().then((m) => {
      if (live) setMp3Url(m[key] ?? null);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookSlug, chapterNum, verses]);

  // Tear down audio on unmount.
  useEffect(() => {
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const stopAll = () => {
    session.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    audioRef.current = null;
    stopAmbient();
    setStatus("idle");
    setProgress(0);
  };

  /* ---------------- warm ambient bed ---------------- */

  /** A soft looping bed that plays under the narration. */
  const getAmbient = (): HTMLAudioElement => {
    let m = ambientRef.current;
    if (!m) {
      m = new Audio(ambientUrlFor(bookSlug));
      m.loop = true;
      m.volume = AMBIENT_VOL;
      m.preload = "auto";
      ambientRef.current = m;
    }
    return m;
  };

  const ambientPlay = () => {
    if (!ambientOn) return;
    try {
      const m = getAmbient();
      if (m.paused) m.play().catch(() => {});
    } catch {
      /* ignore */
    }
  };

  const ambientPause = () => {
    try {
      ambientRef.current?.pause();
    } catch {
      /* ignore */
    }
  };

  const stopAmbient = () => {
    const m = ambientRef.current;
    if (m) {
      try {
        m.pause();
        m.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
  };

  const toggleAmbientPref = () => {
    const next = !ambientOn;
    setAmbientOn(next);
    try {
      localStorage.setItem(AMBIENT_KEY, next ? "on" : "off");
    } catch {
      /* ignore */
    }
    if (!next) ambientPause();
    else if (status === "playing") ambientPlay();
  };

  /* ---------------- MP3 path ---------------- */

  const getAudio = (url: string): HTMLAudioElement => {
    let a = audioRef.current;
    if (!a) {
      a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () => setDuration(a!.duration || 0);
      a.ontimeupdate = () => setProgress(a!.currentTime || 0);
      a.onended = () => {
        setStatus("idle");
        setProgress(0);
      };
      audioRef.current = a;
    }
    if (a.src !== url) {
      a.src = url;
      setProgress(0);
      setDuration(0);
    }
    return a;
  };

  const toggleMp3 = (url: string) => {
    const a = getAudio(url);
    if (status === "idle") {
      a.play().catch(() => setStatus("idle"));
      ambientPlay();
      setStatus("playing");
    } else if (status === "playing") {
      a.pause();
      ambientPause();
      setStatus("paused");
    } else {
      a.play().catch(() => {});
      ambientPlay();
      setStatus("playing");
    }
  };

  const seekMp3 = (to: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.min(Math.max(0, to), a.duration || to);
    setProgress(a.currentTime);
  };

  /* ---------------- TTS fallback path ---------------- */

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

  const startTts = () => {
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
    ambientPlay();
    setStatus("playing");
  };

  const toggleTts = () => {
    const synth = window.speechSynthesis;
    if (status === "idle") startTts();
    else if (status === "playing") {
      synth.pause();
      ambientPause();
      setStatus("paused");
    } else {
      synth.resume();
      ambientPlay();
      setStatus("playing");
    }
  };

  /* ---------------- render ---------------- */

  // MP3 mode only when the manifest actually has this chapter; while the
  // manifest is still loading (undefined) we fall through to the TTS UI
  // so the button is never missing. If TTS is unsupported and there's no
  // MP3, render nothing (previous behavior).
  const useMp3 = typeof mp3Url === "string";
  if (!useMp3 && !canListen) return null;

  const btn =
    "rounded-full border border-[var(--reader-line)] px-4 py-1.5 text-sm font-medium text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)]";
  const label =
    status === "playing" ? "Pause" : status === "paused" ? "Resume" : "Listen";
  const icon = status === "playing" ? "⏸" : status === "paused" ? "▶" : "🔊";
  const toggle = () => (useMp3 ? toggleMp3(mp3Url as string) : toggleTts());

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
          onClick={stopAll}
          aria-label="Stop listening"
          title="Stop"
          className="rounded-full border border-[var(--reader-line)] px-3 py-1.5 text-sm text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)]"
        >
          ⏹
        </button>
      )}
      {status !== "idle" && (
        <button
          type="button"
          onClick={toggleAmbientPref}
          aria-pressed={ambientOn}
          aria-label={ambientOn ? "Turn off warm background music" : "Turn on warm background music"}
          title={ambientOn ? "Background music on" : "Background music off"}
          className="rounded-full border border-[var(--reader-line)] px-2.5 py-1.5 text-sm text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)]"
          style={ambientOn ? undefined : { opacity: 0.45 }}
        >
          <span aria-hidden="true">🎵</span>
        </button>
      )}
      {useMp3 && status !== "idle" && duration > 0 && (
        <span className="inline-flex items-center gap-2 text-xs text-[var(--reader-muted)]">
          <span className="tabular-nums">{fmt(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.5}
            value={Math.min(progress, duration)}
            onChange={(e) => seekMp3(parseFloat(e.target.value))}
            aria-label="Seek"
            className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-[var(--reader-line)] accent-[var(--reader-verse-num)] sm:w-40"
          />
          <span className="tabular-nums">{fmt(duration)}</span>
        </span>
      )}
      {!useMp3 && (
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
      )}
      {showSettings && !useMp3 && (
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
