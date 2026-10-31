"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ShareAppButton from "@/components/ShareAppButton";
import { useVideoChoice, VideoChoiceModal } from "@/components/VideoChoice";

const NAV_SECTIONS = [
  {
    heading: "Scripture",
    items: [
      { href: "/#old-testament", label: "Old Testament" },
      { href: "/#new-testament", label: "New Testament" },
      { href: "/#more", label: "Lost Books" },
    ],
  },
  {
    heading: "Watch & Listen",
    items: [
      { href: "/parables", label: "Parables" },
      { href: "/shorts", label: "Shorts" },
    ],
  },
  {
    heading: "More",
    items: [
      { href: "/", label: "Home" },
      { href: "/characters", label: "Characters" },
      { href: "/plans", label: "Plans" },
      { href: "/search", label: "Search" },
      { href: "/about", label: "About" },
    ],
  },
];

// Flat list for desktop nav
const NAV = NAV_SECTIONS.flatMap((s) => s.items);

// "Visit the Farm" — the TruVINE doors beyond this app, grouped the way
// Teddy walks the farm: watch a film, sit on the porch, then the rest.
// They open in a new tab — except the Mark film, which asks first
// (watch here, or YouTube) like every video door in the app.
const FARM_SECTIONS = [
  {
    heading: "Watch",
    items: [
      {
        href: "https://www.youtube.com/watch?v=z9pwCVw7Rf0",
        label: "The Gospel of Mark — the film",
        videoId: "z9pwCVw7Rf0",
      },
      {
        href: "https://jnutt367.github.io/truvine/come-and-hear/",
        label: "Come and Hear — our story",
      },
      {
        href: "https://www.youtube.com/@TruVINE365",
        label: "All our videos",
        hint: "(opens YouTube)",
      },
    ],
  },
  {
    heading: "The Porch",
    items: [
      {
        href: "https://jnutt367.github.io/truvine/family-wall/",
        label: "The Family Wall",
      },
      {
        href: "https://jnutt367.github.io/truvine/field-report/",
        label: "The Field Report",
      },
      {
        href: "https://jnutt367.github.io/truvine/links/",
        label: "The Key Ring — every door",
      },
    ],
  },
  {
    heading: "More from the Farm",
    items: [
      {
        href: "https://cash.app/$TRUVINE365",
        label: "Give",
        hint: "only if you'd like to",
      },
    ],
  },
];

type FarmItem = (typeof FARM_SECTIONS)[number]["items"][number];

// Mobile farm order (Jason, Oct 21): "More from the Farm" rides
// top-right, beside Watch, so the Give door never sits at the
// bottom of the panel where the floating Listen bar lives.
// (The Store item left this menu Oct 30, 2026, on Jason's ruling —
// John 2:16, in his words: "I don't want to make my Father's house
// a marketplace." The store keeps its own door outside the app;
// the Give door stays, untouched.)
const MOBILE_FARM_SECTIONS = [
  FARM_SECTIONS[0],
  FARM_SECTIONS[2],
  FARM_SECTIONS[1],
];

/**
 * The Mark film door asks first (VideoChoice) instead of opening
 * YouTube on tap: watch here in the app, or go to YouTube by choice.
 * The farm menu stays open behind the dialog, so closing it lands the
 * reader right back on this door.
 */
function FarmVideoItem({ item }: { item: FarmItem }) {
  const choice = useVideoChoice();
  if (!item.videoId) return null;

  return (
    <>
      <button
        type="button"
        onClick={choice.openChoice}
        aria-haspopup="dialog"
        className="flex min-h-[52px] w-full flex-col justify-center rounded-lg px-3 py-3 text-left transition-colors hover:bg-vineyard-800"
      >
        <span className="block text-lg font-medium leading-snug text-cream-100">
          {item.label}
        </span>
      </button>
      {choice.open && (
        <VideoChoiceModal
          onClose={choice.closeChoice}
          videoId={item.videoId}
          title={item.label}
          youtubeUrl={item.href}
        />
      )}
    </>
  );
}

function FarmLink({
  item,
  onNavigate,
}: {
  item: FarmItem;
  onNavigate: () => void;
}) {
  if (item.videoId) return <FarmVideoItem item={item} />;
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      aria-label={`${item.label} (opens in a new tab)`}
      className="flex min-h-[52px] flex-col justify-center rounded-lg px-3 py-3 transition-colors hover:bg-vineyard-800"
    >
      <span className="block text-lg font-medium leading-snug text-cream-100">
        {item.label}
      </span>
      {item.hint && (
        <span aria-hidden="true" className="mt-0.5 block text-sm text-sage-300">
          {item.hint}
        </span>
      )}
    </a>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [farmOpen, setFarmOpen] = useState(false);
  const farmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setFarmOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The farm panel closes when a tap lands anywhere outside it.
  useEffect(() => {
    if (!farmOpen) return;
    const onDown = (e: MouseEvent) => {
      if (farmRef.current && !farmRef.current.contains(e.target as Node)) {
        setFarmOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [farmOpen]);

  return (
    <header className="sticky top-0 z-[60] border-b border-gold-500/15 bg-vineyard-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5"
          aria-label="Word of God Risen — home"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/images/truvine-emblem.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
          />
          <span className="wordmark truncate text-lg sm:text-xl">
            Word of God Risen
          </span>
        </Link>

        {/* Desktop: the Bible's own nav stays first and primary, then
            one door out to the rest of the farm. */}
        <div className="hidden items-center gap-1 lg:flex">
          <nav aria-label="Main">
            <ul className="flex items-center gap-1 sm:gap-2">
              {NAV.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="block rounded-lg px-3 py-3 text-sm font-medium text-sage-300 transition-colors hover:bg-vineyard-800 hover:text-gold-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div ref={farmRef} className="relative">
            <button
              type="button"
              aria-expanded={farmOpen}
              aria-haspopup="true"
              aria-controls="farm-menu"
              onClick={() => setFarmOpen((v) => !v)}
              className="flex min-h-[48px] items-center gap-1.5 rounded-lg px-3 py-3 text-sm font-semibold text-gold-300 transition-colors hover:bg-vineyard-800 hover:text-gold-400"
            >
              Visit the Farm
              <span aria-hidden="true" className="text-xs">
                {farmOpen ? "▴" : "▾"}
              </span>
            </button>
            {farmOpen && (
              <div
                id="farm-menu"
                aria-label="Visit the farm"
                className="absolute right-0 top-full z-50 mt-2 w-[44rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-gold-500/25 bg-vineyard-950 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
              >
                <div className="grid grid-cols-3 gap-6">
                  {FARM_SECTIONS.map((section) => (
                    <div
                      key={section.heading}
                      role="group"
                      aria-labelledby={`farm-desktop-${section.heading.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <p
                        id={`farm-desktop-${section.heading.replace(/\s+/g, "-").toLowerCase()}`}
                        className="px-3 pb-1 text-sm font-semibold tracking-[0.06em] text-gold-400"
                      >
                        {section.heading}
                      </p>
                      <ul className="space-y-1">
                        {section.items.map((item) => (
                          <li key={item.label}>
                            <FarmLink
                              item={item}
                              onNavigate={() => setFarmOpen(false)}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Share this app — in the header so the door to hand the
              app to a friend is one tap away on every page, the way
              it is when the app is opened beside somebody. */}
          <ShareAppButton />
        </div>

        {/* Mobile share — the same door, sized for the phone bar */}
        <div className="ml-auto lg:hidden">
          <ShareAppButton compact />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="rounded-lg p-3 text-cream-100 hover:bg-vineyard-800 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile nav panel — sections stay grouped as blocks and flow
          into 2 columns on phones (3 on wider small screens) so the
          growing list of doors fits; the panel scrolls internally
          rather than ever clipping a door out of reach. */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-gold-500/15 bg-vineyard-950/95 px-4 pb-32 pt-2 backdrop-blur lg:hidden"
        >
          <div className="flex items-center gap-2.5 px-3 pb-2 pt-1">
            <Image
              src="/images/truvine-emblem.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 object-contain"
            />
            <span className="wordmark text-base">Word of God Risen</span>
          </div>
          <div className="grid grid-cols-2 gap-x-8 md:grid-cols-3">
            {NAV_SECTIONS.map((section) => (
              <div key={section.heading} className="mt-3 first:mt-1">
                <p className="px-3 pb-1 text-sm font-semibold tracking-[0.06em] text-gold-400/80">
                  {section.heading}
                </p>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex min-h-[48px] items-center rounded-lg px-3 py-3 text-lg font-medium text-cream-100 transition-colors hover:bg-vineyard-800 hover:text-gold-300"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Visit the Farm — every other TruVINE door, below the
              Bible's own pages so the app's nav stays primary. */}
          <div className="mt-5 border-t border-gold-500/15 pt-4">
            <p className="px-3 pb-1 font-display text-lg text-gold-300">
              Visit the Farm
            </p>
            <div className="grid grid-cols-2 gap-x-8 md:grid-cols-3">
              {MOBILE_FARM_SECTIONS.map((section) => (
                <div
                  key={section.heading}
                  role="group"
                  aria-labelledby={`farm-mobile-${section.heading.replace(/\s+/g, "-").toLowerCase()}`}
                  className="mt-3"
                >
                  <p
                    id={`farm-mobile-${section.heading.replace(/\s+/g, "-").toLowerCase()}`}
                    className="px-3 pb-1 text-sm font-semibold tracking-[0.06em] text-gold-400/80"
                  >
                    {section.heading}
                  </p>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.label}>
                        <FarmLink item={item} onNavigate={() => setOpen(false)} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
