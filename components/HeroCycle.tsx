"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * The cycling hero (Jason, crowned and ordered published
 * Oct 31, 2026). The old hero preached Friday — three crosses over
 * the vineyard. Jason's word: this app is all about the risen
 * Jesus, so the hero now walks resurrection morning in eight
 * crowned stills, in this order: the empty tomb, the folded
 * cloths, the angel's "He is not here", Mary turning at her name,
 * the Ascension, Emmaus, breakfast on the shore, and the open
 * Word at first light. The Hands Shown still was built and loved
 * but is NOT in the cycle, by Jason's ruling ("all except for the
 * ones with his hands") — at phone width its nail mark fell at
 * the crop's edge, and the wound is that picture's whole point.
 *
 * The rhythm is Jason's settled design: a new picture every 8
 * seconds, a slow 1.5-second crossfade, no hard cuts, and the
 * headline never moves — the words live outside this component,
 * exactly as before; only the picture breathes behind them.
 *
 * Calm is law here (accessibility is personal in this house):
 * a visitor who prefers reduced motion gets the empty tomb,
 * still — no cycling at all. The cycle also pauses while the
 * page is hidden, and stops for good once the visitor reaches
 * for the hero's own doors (a tap or click on any hero link or
 * button) — nobody's reading gets chased by a moving picture.
 *
 * Mobile is optimized on purpose (Jason's explicit ask): each
 * slide carries its own tall 9:16 crop, cut around the picture's
 * verified heart — the angel, Mary's face, Jesus by the fire —
 * so the phone frame keeps the subject whole. The desktop and
 * phone variants of a slide share one fading wrapper, so the two
 * never drift out of step.
 */
const SLIDES = [
  { desktop: "/images/hero-cycle/slide-01-desktop.jpg", mobile: "/images/hero-cycle/slide-01-mobile.jpg" },
  { desktop: "/images/hero-cycle/slide-02-desktop.jpg", mobile: "/images/hero-cycle/slide-02-mobile.jpg" },
  { desktop: "/images/hero-cycle/slide-03-desktop.jpg", mobile: "/images/hero-cycle/slide-03-mobile.jpg" },
  { desktop: "/images/hero-cycle/slide-04-desktop.jpg", mobile: "/images/hero-cycle/slide-04-mobile.jpg" },
  { desktop: "/images/hero-cycle/slide-05-desktop.jpg", mobile: "/images/hero-cycle/slide-05-mobile.jpg" },
  { desktop: "/images/hero-cycle/slide-06-desktop.jpg", mobile: "/images/hero-cycle/slide-06-mobile.jpg" },
  { desktop: "/images/hero-cycle/slide-07-desktop.jpg", mobile: "/images/hero-cycle/slide-07-mobile.jpg" },
  { desktop: "/images/hero-cycle/slide-08-desktop.jpg", mobile: "/images/hero-cycle/slide-08-mobile.jpg" },
];

const HOLD_MS = 8000;

export default function HeroCycle() {
  const [active, setActive] = useState(0);
  // Set true once the visitor interacts with the hero's doors —
  // the cycle then rests on whatever picture is showing.
  const [stopped, setStopped] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // The walking itself: advance every 8 seconds unless the
  // visitor prefers reduced motion (then the tomb simply stays),
  // pausing whenever the page is hidden so the morning never
  // walks on without its witness.
  useEffect(() => {
    if (stopped) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: number | undefined;
    const start = () => {
      stopTimer();
      timer = window.setInterval(() => {
        setActive((i) => (i + 1) % SLIDES.length);
      }, HOLD_MS);
    };
    const stopTimer = () => {
      if (timer !== undefined) window.clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      if (document.hidden) stopTimer();
      else start();
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [stopped]);

  // A hand on any of the hero's doors (the nav pills, Start
  // reading, Start listening, the speaker bubble, Search) rests
  // the cycle — the visitor has chosen where they're going.
  useEffect(() => {
    const section = rootRef.current?.closest("section");
    if (!section) return;
    const onInteract = (e: Event) => {
      if ((e.target as HTMLElement).closest("a, button")) setStopped(true);
    };
    section.addEventListener("pointerdown", onInteract);
    return () => section.removeEventListener("pointerdown", onInteract);
  }, []);

  return (
    <div ref={rootRef} className="absolute inset-0">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.desktop}
          aria-hidden={i !== 0}
          className={`pointer-events-none absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.desktop}
            alt={
              i === 0
                ? "The empty tomb at sunrise — the stone rolled away, warm light shining from the open doorway"
                : ""
            }
            fill
            preload={i === 0}
            loading={i === 0 ? undefined : "lazy"}
            sizes="100vw"
            className="hidden object-cover object-top md:block"
          />
          <Image
            src={slide.mobile}
            alt=""
            fill
            preload={i === 0}
            loading={i === 0 ? undefined : "lazy"}
            sizes="100vw"
            className="block object-cover object-top md:hidden"
          />
        </div>
      ))}
    </div>
  );
}
