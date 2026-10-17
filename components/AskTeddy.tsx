"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type TeddyResponse = {
  id: string; // matches /audio/teddy-chat/<id>.mp3
  text: string;
  links?: { label: string; href: string }[];
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
  "feature-ask": {
    id: "feature-ask",
    text: "Oh, I do love hearin' new ideas! What's on your mind, friend? Type it out and I'll carry it straight to the builders.",
  },
  "feature-confirm": {
    id: "feature-confirm",
    text: "That's a mighty fine idea! Let me run it past the builders — Jason and Judah — and we'll see what we can do.",
  },
  pray: {
    id: "pray",
    text: "Let's take a breath together, friend. The Lord is near to all who call on Him. Whatever's weighin' on you today, He's already holdin' it. I'll be prayin' for you.",
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
];

type Message = {
  from: "teddy" | "user";
  response?: TeddyResponse;
  text?: string;
};

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
  const [open, setOpen] = useState(false);
  // Teddy's "look" for this visit — a slightly different outfit/scene each
  // time, like he's been out tending the farm. 1: hay field, 2: chicken coop,
  // 3: sunset fence line, 4: cozy indoors.
  const [look] = useState(() => 1 + Math.floor(Math.random() * 4));
  const faceSrc = `/images/teddy-face-${look}.png`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [awaitingIdea, setAwaitingIdea] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [hasGreeted, setHasGreeted] = useState(false);
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
    setMessages((m) => [...m, { from: "teddy", response }]);
    if (key === "feature-ask") setAwaitingIdea(true);
  };

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && !hasGreeted) {
      setHasGreeted(true);
      pushTeddy("greeting");
    }
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    if (awaitingIdea) {
      setAwaitingIdea(false);
      logFeatureRequest(text);
      setTimeout(() => pushTeddy("feature-confirm"), 400);
      return;
    }
    const intent = matchIntent(text);
    setTimeout(() => pushTeddy(intent), 400);
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      <div
        className={`w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-gold-500/40 bg-cream-50 shadow-2xl shadow-black/40 transition-all duration-300 origin-bottom-right ${
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-90 opacity-0"
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center gap-3 bg-vineyard-900 px-4 py-3">
          <Image
            src={faceSrc}
            alt="Grandpa Teddy"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full border-2 border-gold-400 object-cover"
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
                  src={faceSrc}
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
          src={faceSrc}
          alt=""
          width={64}
          height={64}
          className="h-full w-full rounded-full object-cover"
        />
      </button>
    </div>
  );
}
