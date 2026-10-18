"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TEDDY_FACES, type TeddyFaceKey } from "@/lib/teddy-faces";

/** Teddy's homepage welcome — the reader's own browser only.
 * v1 (batch #2) was a single "seen" note. v2 gives the welcome ONE
 * second chance for a reader who never actually met Teddy (Jason's
 * ruling, Oct 18): the welcome may auto-open up to twice in all, on
 * separate later visits, and only until the first real interaction
 * makes it stop forever — an accidental dismissal shouldn't cost
 * Grandma her tour guide. */
const WELCOME_KEY_V1 = "wogr_teddy_welcomed_v1";
const WELCOME_KEY = "wogr_teddy_welcome_v2";
/** Session note: the welcome has already been offered during THIS
 * browser session — the second chance belongs to a later visit,
 * never later in the same sitting. */
const WELCOME_SESSION_KEY = "wogr_teddy_welcome_session_v2";
const WELCOME_MAX_AUTO_OPENS = 2;
/** A "later visit" is at least this long after the last auto-open. */
const WELCOME_LATER_VISIT_MS = 4 * 60 * 60 * 1000;

type WelcomeState = { shown: number; met: boolean; lastShownAt?: number };

/** Read the welcome state, migrating a v1 "seen" note if there is
 * one: a reader who saw the one-time welcome but never met Teddy
 * holds exactly one second chance (shown: 1) — Jason's intent.
 * Returns null when storage is unavailable (never auto-open). */
function readWelcomeState(): WelcomeState | null {
  try {
    const raw = localStorage.getItem(WELCOME_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WelcomeState>;
      return {
        shown: typeof parsed.shown === "number" ? parsed.shown : 0,
        met: parsed.met === true,
        lastShownAt:
          typeof parsed.lastShownAt === "number"
            ? parsed.lastShownAt
            : undefined,
      };
    }
    if (localStorage.getItem(WELCOME_KEY_V1) != null) {
      const migrated: WelcomeState = { shown: 1, met: false };
      writeWelcomeState(migrated);
      return migrated;
    }
    return { shown: 0, met: false };
  } catch {
    return null;
  }
}

function writeWelcomeState(state: WelcomeState) {
  try {
    localStorage.setItem(WELCOME_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — the welcome simply won't track */
  }
}

/** Any real hello counts as meeting Teddy: she opens his panel
 * herself, taps a quick question or chip, sends a message, or taps
 * "Hear Teddy" on one of his answers. From that moment the welcome
 * never auto-opens again, ever. */
function markTeddyMet() {
  const state = readWelcomeState();
  if (!state || state.met) return;
  writeWelcomeState({ ...state, met: true });
}

type TeddyResponse = {
  id: string; // matches /audio/teddy-chat/<id>.mp3
  text: string;
  links?: { label: string; href: string }[];
  /** Follow-on chips rendered inside the answer itself — the farm
   * walk chains its stops this way, one door at a time. A chip's
   * exact words route through CHIP_ROUTES in send(). */
  chips?: string[];
  /** Tender answers (prayer, comfort) and joyful ones wear their own
   * faces — see faceForResponse below. */
  mood?: "tender" | "joyful";
};

const RESPONSES: Record<string, TeddyResponse> = {
  greeting: {
    id: "greeting",
    text: "Well hey there! I'm Teddy. What can I help you find on the farm today?",
  },
  start: {
    id: "start",
    text: "If you're new here, I'd start with the Walk with Jesus plan — seven days, walkin' right alongside Him through the Gospels. It's the best first step on the farm.",
    links: [{ label: "Walk with Jesus — 7 days", href: "/plans" }],
  },
  listen: {
    id: "listen",
    text: "You can listen to the whole Bible right here — every chapter read aloud in my voice, with a soft desert breeze underneath. Just open any chapter and tap the listen button.",
    links: [{ label: "Start listening", href: "/book/genesis/0" }],
  },
  plans: {
    id: "plans",
    text: "We've got readin' plans for every pace — Walk with Jesus in seven days, the Gospels in thirty, Genesis, Acts and Romans, even the lost books like Enoch.",
    links: [{ label: "Browse reading plans", href: "/plans" }],
  },
  characters: {
    id: "characters",
    text: "Oh, you'll love this — we've got the whole cast of Mark ready to meet! Every disciple, every face, with their story straight from Scripture.",
    links: [{ label: "Meet the characters", href: "/characters" }],
  },
  /* The farm walk — Teddy shows a new arrival around himself, one
   * door at a time, in plain words. Every stop carries its door, so
   * faceForResponse dresses him as the Guide all the way through. */
  farm: {
    id: "farm",
    text: "Well, come on then — I'll show you around the farm myself, one door at a time. We've built a fair bit here, but don't you worry: I'll walk slow, and you can stop me anytime.",
    chips: ["First stop: the Bible →", "That's all I need, thanks"],
  },
  "farm-bible": {
    id: "farm-bible",
    text: "First stop is the heart of the whole farm — the Bible itself, every chapter read out loud in my voice. Just tap a book, tap a chapter, and tap the gold Listen button, and I'll read to you. And don't you worry about losin' your place — it's kept right here on your own phone.",
    links: [{ label: "See all the books", href: "/#books" }],
    chips: ["Next: the movies →", "That's all I need, thanks"],
  },
  "farm-movies": {
    id: "farm-movies",
    text: "Next up, the movies! We've made a film of the Gospel of Mark, where I read the whole chapter word-for-word, and “Come and Hear” — that's our family's story so far. This door takes you to a gentle page where both films are waitin' for you.",
    links: [
      {
        label: "Watch the movies",
        href: "https://jnutt367.github.io/truvine/come-and-hear/",
      },
    ],
    chips: ["Next: the Family Wall →", "That's all I need, thanks"],
  },
  "farm-wall": {
    id: "farm-wall",
    text: "This here's the Family Wall, where our family hangs — every face up there by permission and by love. Joinin' is simple: you send Jason a letter, he reads every word himself, and he hangs you on the wall by hand. Welcomed, not processed — that's the way of this house.",
    links: [
      {
        label: "Visit the Family Wall",
        href: "https://jnutt367.github.io/truvine/family-wall/",
      },
    ],
    chips: ["Next: all the videos →", "That's all I need, thanks"],
  },
  "farm-videos": {
    id: "farm-videos",
    text: "Over on YouTube you'll find the whole TruVINE channel — the films, the little Shorts, and new videos as they come. If you like watchin' on the television or passin' a video along to family, that's the place to go.",
    links: [
      { label: "TruVINE on YouTube", href: "https://www.youtube.com/@TruVINE365" },
    ],
    chips: ["Last stop: the store →", "That's all I need, thanks"],
  },
  "farm-store": {
    id: "farm-store",
    text: "Last stop on our walk — the little store. It's got shirts and hoodies with the Word on 'em, for anybody who'd like one. No pressure at all, friend — we're just glad you came by the farm.",
    links: [{ label: "Visit the store", href: "https://truvine.printify.me/" }],
    chips: ["Finish the walk →", "That's all I need, thanks"],
  },
  "farm-close": {
    id: "farm-close",
    text: "Well, that's the whole farm, friend — and you did just fine. Anytime you want another look around, just tap my face down in the corner and ask. I'll be right here.",
  },
  "feature-ask": {
    id: "feature-ask",
    text: "Oh, I do love hearin' new ideas! What's on your mind, friend? Type it out and I'll carry it straight to the builders.",
  },
  "feature-confirm": {
    id: "feature-confirm",
    text: "That's a mighty fine idea! Let me run it past the builders — Jason and Judah — and we'll see what we can do.",
    mood: "joyful",
  },
  pray: {
    id: "pray",
    text: "Let's take a breath together, friend. The Lord is near to all who call on Him. Whatever's weighin' on you today, He's already holdin' it. I'll be prayin' for you.",
    mood: "tender",
  },
  fallback: {
    id: "fallback",
    text: "Hmm, I'm just a simple farmer, and that one's a bit beyond my fence line. But I can help you find your way around — ask me where to start readin', how to listen, about readin' plans, or the characters. Or if you've got an idea for the farm, just say “feature idea!”",
  },
  thanks: {
    id: "thanks",
    text: "Anytime, friend. That's what I'm here for. Now go on and enjoy the Word!",
  },
};

const QUICK_REPLIES = [
  "Where do I start?",
  "How do I listen?",
  "Show me reading plans",
  "Meet the characters",
  "I have a feature idea",
  "Show me around the farm",
];

/** Exact chip words → the answer they open. Checked in send() before
 * the keyword matcher, so the farm walk's "next stop" chips (and its
 * entry chip) always land on the right answer. */
const CHIP_ROUTES: Record<string, string> = {
  "Show me around the farm": "farm",
  "First stop: the Bible →": "farm-bible",
  "Next: the movies →": "farm-movies",
  "Next: the Family Wall →": "farm-wall",
  "Next: all the videos →": "farm-videos",
  "Last stop: the store →": "farm-store",
  "Finish the walk →": "farm-close",
  "That's all I need, thanks": "thanks",
};

type Message = {
  from: "teddy" | "user";
  response?: TeddyResponse;
  text?: string;
  /** The face Teddy wore for this message — set when he speaks. */
  face?: TeddyFaceKey;
};

/**
 * Teddy's face for an answer, by the shape of the moment:
 * tender words (prayer, comfort) wear the Shepherd's calm; joyful
 * words wear the Laugh; an answer that sends her somewhere wears
 * the Guide; anything else, he's listening. The greeting is set by
 * greet() — the Wave when he opens his own homepage welcome, the
 * Welcome when she comes to him herself.
 */
function faceForResponse(response: TeddyResponse): TeddyFaceKey {
  if (response.mood === "tender") return "shepherd";
  if (response.mood === "joyful") return "laugh";
  if (response.links && response.links.length > 0) return "guide";
  return "listener";
}

function matchIntent(input: string): string {
  const t = input.toLowerCase();
  if (/\b(feature|suggestion|request|idea)\b/.test(t)) return "feature-ask";
  if (/\b(pray|prayer|praying|worried|anxious|anxiety|sad|scared|afraid)\b/.test(t))
    return "pray";
  if (/\b(thank|thanks|appreciated)\b/.test(t)) return "thanks";
  if (/\b(listen|audio|hear|hearing|play|voice)\b/.test(t)) return "listen";
  if (/\b(plan|plans)\b/.test(t)) return "plans";
  if (/\b(character|characters|disciple|disciples|who is|people)\b/.test(t))
    return "characters";
  if (
    /(show me around|take me around|walk me around|around the farm|show me the farm|\btour\b|what'?s all this|what is all this|what'?s this place|what is this place)/.test(
      t
    )
  )
    return "farm";
  if (
    /\b(start|begin|beginning|new here|first time|where do i|how do i start)\b/.test(
      t
    )
  )
    return "start";
  return "fallback";
}

function logFeatureRequest(text: string) {
  try {
    const key = "teddy-feature-requests";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push({ text, at: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    /* storage unavailable — Teddy still answers warmly */
  }
}

export default function AskTeddy() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const onReaderPage = pathname?.startsWith("/book/") ?? false;
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const greetedRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open ]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [awaitingIdea, setAwaitingIdea] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const playAudio = (id: string) => {
    markTeddyMet(); // she asked to hear his voice — they've met
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setPlayingId(null);
    }
    audioRef.current.src = `/audio/teddy-chat/${id}.mp3`;
    audioRef.current.play().catch(() => setPlayingId(null));
    setPlayingId(id);
  };

  const pushTeddy = (key: string) => {
    const response = RESPONSES[key];
    setMessages((m) => [
      ...m,
      { from: "teddy", response, face: faceForResponse(response) },
    ]);
    if (key === "feature-ask") setAwaitingIdea(true);
  };

  /** Teddy says hello the first time his panel opens — once per visit-set.
   * When he opened the panel himself (his homepage welcome), he
   * waves; when she tapped his bubble, he welcomes. */
  const greet = (viaAutoWelcome: boolean) => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const response = RESPONSES.greeting;
    setMessages((m) => [
      ...m,
      {
        from: "teddy",
        response,
        face: viaAutoWelcome ? "wave" : "welcome",
      },
    ]);
  };

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      markTeddyMet(); // she came to him herself — they've met
      greet(false);
    }
  };

  /* Teddy's homepage welcome — with one second chance. After a
   * gentle beat (~2s or her first scroll), Teddy opens his panel
   * himself, as before. But if she never actually met him — never
   * opened his panel herself, never tapped a question, never heard
   * his voice — the welcome may return ONCE more: on a later visit
   * (a new browser session, at least four hours after the last
   * auto-open). Two auto-opens in all, ever; the moment she truly
   * meets him, or after the second showing, he never pops up again.
   * Not a modal — the page stays fully usable beside him — and
   * silent, as always: no audio ever plays uninvited. */
  useEffect(() => {
    if (!onHome) return;
    const state = readWelcomeState();
    if (!state || state.met || state.shown >= WELCOME_MAX_AUTO_OPENS) return;
    try {
      // Already offered during this sitting — the second chance
      // waits for a later visit.
      if (sessionStorage.getItem(WELCOME_SESSION_KEY) != null) return;
    } catch {
      /* session storage unavailable — the four-hour rule still gates */
    }
    if (
      state.lastShownAt != null &&
      Date.now() - state.lastShownAt < WELCOME_LATER_VISIT_MS
    ) {
      return;
    }
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      try {
        // One offer per sitting at most — claim this session before
        // counting, so a second trigger can't count twice.
        if (sessionStorage.getItem(WELCOME_SESSION_KEY) != null) return;
        sessionStorage.setItem(WELCOME_SESSION_KEY, "offered");
      } catch {
        /* ignore */
      }
      // Count this showing — unless she met him in the meantime
      // (her own tap already said hello first).
      const fresh = readWelcomeState();
      if (fresh && !fresh.met && fresh.shown < WELCOME_MAX_AUTO_OPENS) {
        writeWelcomeState({
          shown: fresh.shown + 1,
          met: false,
          lastShownAt: Date.now(),
        });
      }
      window.removeEventListener("scroll", onScroll);
      if (!openRef.current) {
        setOpen(true);
        greet(true);
      }
    };
    const onScroll = () => fire();
    const t = setTimeout(fire, 2000);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, [onHome]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    markTeddyMet(); // a question or a chip tap — they've met
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    if (awaitingIdea) {
      setAwaitingIdea(false);
      logFeatureRequest(text);
      setTimeout(() => pushTeddy("feature-confirm"), 400);
      return;
    }
    const chipTarget = CHIP_ROUTES[text];
    if (chipTarget) {
      setTimeout(() => pushTeddy(chipTarget), 400);
      return;
    }
    const intent = matchIntent(text);
    setTimeout(() => pushTeddy(intent), 400);
  };

  // The face on Teddy's chrome (header + bubble) follows the moment:
  // closed and at rest he's the Shepherd, calm in his corner; while the
  // panel is open he wears the face of his latest word — or the
  // Listener's, while he's still waiting on hers.
  const lastTeddyFace = [...messages]
    .reverse()
    .find((m) => m.from === "teddy")?.face;
  const chromeFace: TeddyFaceKey = open
    ? (lastTeddyFace ?? "listener")
    : "shepherd";
  const chrome = TEDDY_FACES[chromeFace];

  return (
    /* On reader pages Teddy lifts his bubble (bottom-32) so he never
     * sits on the floating Listen bar at the foot of the chapter. */
    <div
      className={`pointer-events-none fixed right-5 z-50 flex flex-col items-end gap-3 ${
        onReaderPage ? "bottom-32" : "bottom-5"
      }`}
    >
      {/* Chat panel */}
      <div
        className={`askteddy-panel w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-gold-500/40 bg-cream-50 shadow-2xl shadow-black/40 transition-all duration-300 origin-bottom-right ${
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-90 opacity-0"
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center gap-3 bg-vineyard-900 px-4 py-3">
          <Image
            key={chromeFace}
            src={chrome.src}
            alt={chrome.alt}
            width={44}
            height={44}
            className="teddy-face-swap h-11 w-11 rounded-full border-2 border-gold-400 object-cover"
          />
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight text-gold-300">
              Ask Teddy
            </p>
            <p className="truncate text-xs text-sage-300">
              Your farmhand for the Word
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="ml-auto rounded-lg p-1.5 text-cream-100 hover:bg-vineyard-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex max-h-[46vh] min-h-[280px] flex-col gap-3 overflow-y-auto px-4 py-4"
        >
          {messages.map((m, i) =>
            m.from === "user" ? (
              <div
                key={i}
                className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-vineyard-800 px-4 py-2.5 text-sm text-cream-100"
              >
                {m.text}
              </div>
            ) : (
              <div key={i} className="flex max-w-[92%] items-start gap-2">
                <Image
                  src={TEDDY_FACES[m.face ?? "listener"].src}
                  alt=""
                  width={28}
                  height={28}
                  className="mt-0.5 h-7 w-7 shrink-0 rounded-full border border-gold-500/60 object-cover"
                />
                <div className="rounded-2xl rounded-bl-md border border-gold-500/30 bg-white px-4 py-2.5 shadow-sm">
                  <p className="text-sm leading-relaxed text-vineyard-950">
                    {m.response!.text}
                  </p>
                  {m.response!.links && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.response!.links.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          className="rounded-full bg-vineyard-800 px-3 py-1.5 text-xs font-semibold text-gold-300 hover:bg-vineyard-700"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  )}
                  {m.response!.chips && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.response!.chips.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => send(c)}
                          className="rounded-full border border-gold-500/60 px-3 py-1.5 text-xs font-medium text-vineyard-900 hover:bg-gold-500/15"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => playAudio(m.response!.id)}
                    aria-label={
                      playingId === m.response!.id
                        ? "Stop Teddy's voice"
                        : "Hear Teddy say this"
                    }
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold-500/50 px-2.5 py-1 text-xs font-medium text-[#865c10] hover:bg-gold-500/10"
                  >
                    {playingId === m.response!.id ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M11 5L6 9H2v6h4l5 4V5z"
                          fill="currentColor"
                        />
                        <path
                          d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                    {playingId === m.response!.id ? "Stop" : "Hear Teddy"}
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Quick replies */}
        <div className="flex gap-2 overflow-x-auto border-t border-gold-500/20 bg-cream-100/60 px-4 py-2.5">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="shrink-0 rounded-full border border-gold-500/60 px-3 py-1.5 text-xs font-medium text-vineyard-900 hover:bg-gold-500/15"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-gold-500/20 bg-cream-50 px-3 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              awaitingIdea ? "Tell Teddy your idea…" : "Ask Teddy…"
            }
            aria-label="Message Teddy"
            className="min-w-0 flex-1 rounded-full border border-gold-500/40 bg-white px-4 py-2 text-sm text-vineyard-950 placeholder:text-vineyard-950/60 focus:border-gold-500 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-500 text-vineyard-950 hover:bg-gold-400"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      </div>

      {/* Bubble button */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label={open ? "Close Ask Teddy chat" : "Open Ask Teddy chat"}
        aria-expanded={open}
        className="group pointer-events-auto relative grid h-16 w-16 place-items-center rounded-full border-[3px] border-gold-400 bg-vineyard-900 shadow-xl shadow-black/40 transition-transform hover:scale-105 active:scale-95"
      >
        <Image
          key={chromeFace}
          src={chrome.src}
          alt=""
          width={64}
          height={64}
          className="teddy-face-swap h-full w-full rounded-full object-cover"
        />
        {/* A word chip for eyes — the screen-reader name already exists;
            Grandma's eyes get the same courtesy while he's closed. */}
        {!open && (
          <span
            aria-hidden="true"
            className="absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-gold-500 px-3 py-1.5 text-xs font-semibold text-vineyard-950 shadow-lg"
          >
            Ask Teddy
          </span>
        )}
      </button>
    </div>
  );
}
