"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Verse } from "@/lib/verses";
import { getBook } from "@/lib/bible-client";
import { beatListenStart, beatListenComplete, notePlayedSpan } from "@/lib/heartbeat";

interface Props {
  bookSlug: string;
  bookTitle: string;
  chapterNum: number;
  verses: Verse[];
  autoplay?: boolean;
  /** Reader pages: also show the floating Listen bar + Teddy helper. */
  floating?: boolean;
  /**
   * Read-only narration-end note for the parent (the chapter-end line).
   * Called with true when the narration finishes on its own, false when
   * playback starts or stops. It changes NO audio behavior — the warm
   * bed keeps looping after the Scripture ends, exactly as always.
   */
  onEndedChange?: (ended: boolean) => void;
}

/** Teddy helper "seen it" note — the reader's own browser only. */
const HELPER_KEY = "wogr_teddy_helper_v1";

type Status = "idle" | "playing" | "paused";

const VOICE_KEY = "wogr:tts-voice";
const RATE_KEY = "wogr:tts-rate";
const AMBIENT_KEY = "wogr:ambient";
const MANIFEST_URL = "/audio-manifest.json";
/** Channel bed for all books (Jason 2026-10-18: the TruVINE video music bed, one bed across app + channel). */
function ambientUrlFor(slug: string): string {
  return "/audio/ambient-channel.mp3";
}
/** Channel bed sits well under narration without fighting it (house recipe). */
const AMBIENT_VOL = 0.12;

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
  autoplay = false,
  floating = false,
  onEndedChange,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [canListen, setCanListen] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [mp3Url, setMp3Url] = useState<string | null | undefined>(undefined);
  // Plain-words note when the sound can't start (Oct 19 kindness pass)
  // — said out loud on the bar instead of failing in silence.
  const [notice, setNotice] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ambientOn, setAmbientOn] = useState(true);
  const session = useRef(0);
  // Bible Heartbeat: the audio element's handlers are attached once, so
  // they read the current chapter from this ref instead of stale props.
  const chapterRef = useRef({ bookSlug, chapterNum });
  useEffect(() => {
    chapterRef.current = { bookSlug, chapterNum };
  }, [bookSlug, chapterNum]);
  // The audio handlers are attached once, so the ended-note for the
  // parent is read from a ref too (same pattern as chapterRef).
  const endedRef = useRef(onEndedChange);
  useEffect(() => {
    endedRef.current = onEndedChange;
  }, [onEndedChange]);
  const panelRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  // Teddy helper (floating mode): open state + the two ends of the
  // reader's path — the "Got it" button and the "New here?" link.
  const [helperOpen, setHelperOpen] = useState(false);
  const gotItRef = useRef<HTMLButtonElement>(null);
  const showHelperRef = useRef<HTMLButtonElement>(null);

  const dismissHelper = () => {
    try {
      localStorage.setItem(HELPER_KEY, "seen");
    } catch {
      /* storage unavailable — just close */
    }
    setHelperOpen(false);
    showHelperRef.current?.focus();
  };

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
    // Teddy helper: a first-time reader (no "seen it" note saved)
    // meets Grandpa Teddy's pointer to the Listen button.
    if (floating) {
      try {
        if (!localStorage.getItem(HELPER_KEY)) setHelperOpen(true);
      } catch {
        /* storage unavailable — don't auto-show */
      }
    }
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [floating]);

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

  // Autoplay when ?autoplay=1 (e.g. from the homepage "Start listening" button).
  // Browsers may block this without prior interaction — if so, the button
  // stays ready for the user to press manually.
  const autoplayed = useRef(false);
  useEffect(() => {
    if (!autoplay || autoplayed.current) return;
    if (typeof mp3Url !== "string" || !mp3Url) return;
    autoplayed.current = true;
    toggleMp3(mp3Url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, mp3Url]);

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

  /* ---------------- Teddy helper (floating mode) ----------------
   * The first time a reader opens a chapter, Grandpa Teddy himself
   * points out the Listen button (the mount effect below checks the
   * "seen it" note). "Got it" is remembered only in the reader's own
   * browser; the "New here?" link brings him back anytime. */

  // Land keyboard readers on "Got it" so the card is easy to dismiss.
  useEffect(() => {
    if (helperOpen) gotItRef.current?.focus();
  }, [helperOpen]);

  // Escape closes the helper, like the settings panel.
  useEffect(() => {
    if (!helperOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissHelper();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [helperOpen]);

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
    endedRef.current?.(false);
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
      a.ontimeupdate = () => {
        setProgress(a!.currentTime || 0);
        // Bible Heartbeat "listened through": feed the tracker's own
        // played ranges — the browser's record of what genuinely
        // sounded, with gaps where the reader scrubbed — to the
        // heartbeat. At 80% truly played the chapter counts, without
        // demanding the track's very last second.
        const d = a!.duration;
        if (isFinite(d) && d > 0) {
          try {
            const { bookSlug: slug, chapterNum: num } = chapterRef.current;
            for (let i = 0; i < a!.played.length; i++) {
              notePlayedSpan(slug, num, a!.played.start(i), a!.played.end(i), d);
            }
          } catch {
            /* counting never breaks playback */
          }
        }
      };
      a.onended = () => {
        setStatus("idle");
        setProgress(0);
        beatListenComplete(
          chapterRef.current.bookSlug,
          chapterRef.current.chapterNum
        );
        // Read-only note for the chapter-end line. The ambient bed is
        // deliberately NOT touched here — it keeps looping after the
        // Scripture ends (Jason's beloved behavior, preserved exactly).
        endedRef.current?.(true);
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
      setNotice(null);
      a.play().catch(() => {
        setStatus("idle");
        setNotice(
          "The reading couldn't start just now. Check your sound is turned up, then tap Listen again."
        );
      });
      ambientPlay();
      setStatus("playing");
      endedRef.current?.(false);
      beatListenStart(bookSlug, chapterNum);
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
          if (session.current === mySession) {
            setStatus("idle");
            beatListenComplete(bookSlug, chapterNum);
            // Same read-only ended note as the MP3 path; the bed is
            // untouched and keeps playing, exactly as before.
            endedRef.current?.(true);
          }
        };
      }
      synth.speak(u);
    });
    ambientPlay();
    setStatus("playing");
    endedRef.current?.(false);
    beatListenStart(bookSlug, chapterNum);
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
    "min-h-12 rounded-full border border-[var(--reader-line)] px-4 py-1.5 text-sm font-medium text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)] sm:min-h-0";
  const label =
    status === "playing" ? "Pause" : status === "paused" ? "Resume" : "Listen";
  const icon = status === "playing" ? "⏸" : status === "paused" ? "▶" : "🔊";
  const toggle = () => (useMp3 ? toggleMp3(mp3Url as string) : toggleTts());

  const listenAriaLabel =
    status === "playing"
      ? "Pause listening"
      : status === "paused"
        ? "Resume listening"
        : `Listen to ${bookTitle} ${chapterNum}`;

  return (
    <>
    <span ref={panelRef} className="relative inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={status !== "idle"}
        aria-label={listenAriaLabel}
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
          className="min-h-12 rounded-full border border-[var(--reader-line)] px-4 py-1.5 text-sm text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)] sm:min-h-0 sm:px-3"
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
          className="min-h-12 rounded-full border border-[var(--reader-line)] px-3.5 py-1.5 text-sm text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)] sm:min-h-0 sm:px-2.5"
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
          aria-label="Choose a reading voice"
          title="Choose a reading voice"
          className="min-h-12 rounded-full border border-[var(--reader-line)] px-3.5 py-1.5 text-sm text-[var(--reader-muted)] transition-colors hover:text-[var(--reader-verse-num)] sm:min-h-0 sm:px-2.5"
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
            This chapter doesn&rsquo;t have a recording yet, so your phone
            or computer reads it out loud in its own voice. Every device
            comes with several voices — pick the one that&rsquo;s easiest
            for you to hear.
          </p>
        </div>
      )}
    </span>

    {/* Floating Listen bar — the same control, kept in reach while the
        reader scrolls. Same gold pill language as the reader's own
        "Mark as read" button; the big tap target is for every hand. */}
    {floating && (
      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2">
          {notice && (
            <p
              role="status"
              className="w-full rounded-xl border border-[var(--reader-line)] bg-[var(--reader-card)] px-4 py-3 text-center text-sm text-[var(--reader-ink)] shadow-lg"
            >
              {notice}
            </p>
          )}
          <div className="flex w-full items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              aria-pressed={status !== "idle"}
              aria-label={listenAriaLabel}
              className={`flex min-h-14 flex-1 items-center justify-center gap-2.5 rounded-full bg-[var(--reader-verse-num)] px-6 py-3.5 text-lg font-semibold text-[var(--reader-bg)] shadow-xl transition-opacity hover:opacity-95 ${helperOpen ? "teddy-point" : ""}`}
            >
              <span aria-hidden="true" className="text-2xl leading-none">
                {status === "playing"
                  ? "⏸"
                  : status === "paused"
                    ? "▶"
                    : "🔊"}
              </span>
              {status === "playing"
                ? "Listening… Pause"
                : status === "paused"
                  ? "Tap to Resume"
                  : "Tap to Listen"}
            </button>
            {status !== "idle" && (
              <button
                type="button"
                onClick={stopAll}
                aria-label="Stop listening"
                title="Stop"
                className="flex min-h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[var(--reader-line)] bg-[var(--reader-card)] px-5 text-[var(--reader-ink)] shadow-xl transition-colors hover:text-[var(--reader-verse-num)]"
              >
                <span aria-hidden="true" className="text-xl leading-none">⏹</span>
                <span className="text-base font-semibold">Stop</span>
              </button>
            )}
            {status !== "idle" && (
              <button
                type="button"
                onClick={toggleAmbientPref}
                aria-pressed={ambientOn}
                aria-label={ambientOn ? "Turn off the background music" : "Turn on the background music"}
                title={ambientOn ? "Background music on" : "Background music off"}
                className="flex min-h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[var(--reader-line)] bg-[var(--reader-card)] px-5 text-[var(--reader-ink)] shadow-xl transition-colors hover:text-[var(--reader-verse-num)]"
                style={ambientOn ? undefined : { opacity: 0.55 }}
              >
                <span aria-hidden="true" className="text-xl leading-none">🎵</span>
                <span className="text-base font-semibold">Music</span>
              </button>
            )}
          </div>
          <button
            ref={showHelperRef}
            type="button"
            onClick={() => setHelperOpen(true)}
            aria-haspopup="dialog"
            className="rounded-full border border-[var(--reader-line)] bg-[var(--reader-card)]/95 px-4 py-1.5 text-sm font-medium text-[var(--reader-muted)] shadow-lg transition-colors hover:text-[var(--reader-verse-num)]"
          >
            New here? Teddy can show you
          </button>
        </div>
      </div>
    )}

    {/* Teddy helper — Grandpa Teddy points out the Listen button, once,
        in plain words. He comes back anytime via "New here?". */}
    {floating && helperOpen && (
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Grandpa Teddy shows you how to listen"
        className="teddy-helper fixed inset-x-0 bottom-36 z-50 px-3 sm:px-6"
      >
        <div className="mx-auto flex max-w-md items-start gap-4 rounded-2xl border border-[var(--reader-line)] bg-[var(--reader-card)] p-5 shadow-2xl">
          <Image
            src="/images/teddy-faces/guide.webp"
            alt="Grandpa Teddy pointing the way, in his straw hat and overalls"
            width={72}
            height={72}
            className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
          />
          <div>
            <p className="text-lg leading-relaxed text-[var(--reader-ink)]">
              Hello, friend. Tap the gold Listen button and I&rsquo;ll read
              this chapter out loud to you.
            </p>
            <button
              ref={gotItRef}
              type="button"
              onClick={dismissHelper}
              className="mt-4 rounded-full bg-[var(--reader-verse-num)] px-6 py-2.5 text-base font-semibold text-[var(--reader-bg)] transition-opacity hover:opacity-95"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
