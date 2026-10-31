"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import HeroMapSlide, { type HeroMapPayload } from "@/components/HeroMapSlide";

/**
 * The cycling hero (Jason, crowned and ordered published
 * Oct 31, 2026). The old hero preached Friday — three crosses over
 * the vineyard. Jason's word: this app is all about the risen
 * Jesus, so the hero now walks resurrection morning in seven
 * crowned stills, in this order: the empty tomb, the angel's
 * "He is not here", Mary turning at her name, the Ascension,
 * Emmaus, breakfast on the shore, and the open Word at first
 * light. The eighth picture is the hero this one replaced — the
 * three crosses over the vineyard (Jason, later the same
 * morning: "the image that we have now for the hero can be part
 * of the cycle"); it closes the walk, so the loop turns from
 * the cross back to the empty tomb. The Hands Shown still was
 * built and loved but is NOT in the cycle, by Jason's ruling
 * ("all except for the ones with his hands") — at phone width
 * its nail mark fell at the crop's edge, and the wound is that
 * picture's whole point. The Folded Cloths still left the cycle
 * the same morning on Jason's phone verdict ("the shot with the
 * burial clothes doesn't work") — his eye is the final grade;
 * the file stays banked in public/images/hero-cycle/ (slide-02),
 * out of the rotation only.
 *
 * The rhythm: Jason first settled 8 seconds, then ruled from
 * his phone the same morning — "the cycle needs to go faster" —
 * so a new picture every 5 seconds, a slow 1.5-second
 * crossfade, no hard cuts, and the headline never moves — the
 * words live outside this component, exactly as before; only
 * the picture breathes behind them.
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
 *
 * The LAST turn of the cycle is not a file at all (Jason, later the same
 * morning, Oct 31, 2026: "a polished version of the map that
 * actually shows updates… but looks a different kind of style"):
 * the live Earth map, drawn painterly by components/
 * HeroMapSlide.tsx from the same /api/heartbeat record and the
 * same display decisions as the real map below — today's lights,
 * never a frozen picture. It joins the rotation only when the
 * live record actually answers (see the fetch below); if the
 * fetch fails or the payload is not the live record, the slide
 * simply never exists and the nine pictures walk on without it.
 * Under reduced motion the cycle never advances at all, so the
 * map slide is never reached — the tomb stands, as always.
 */
const SLIDES: { desktop: string; mobile: string; mobilePos?: string }[] = [
  // The tomb rides raised on phones (Jason's phone verdict,
  // Oct 31, 2026): with the plain top crop, the doorway sat too
  // low to be seen clearly over the bottom of his screen, so
  // this slide's phone window centers lower (50% 45%).
  { desktop: "/images/hero-cycle/slide-01-desktop.jpg", mobile: "/images/hero-cycle/slide-01-mobile.jpg", mobilePos: "50% 36%" },
  { desktop: "/images/hero-cycle/slide-03-desktop.jpg", mobile: "/images/hero-cycle/slide-03-mobile.jpg" },
  { desktop: "/images/hero-cycle/slide-04-desktop.jpg", mobile: "/images/hero-cycle/slide-04-mobile.jpg" },
  { desktop: "/images/hero-cycle/slide-05-desktop.jpg", mobile: "/images/hero-cycle/slide-05-mobile.jpg" },
  { desktop: "/images/hero-cycle/slide-06-desktop.jpg", mobile: "/images/hero-cycle/slide-06-mobile.jpg" },
  { desktop: "/images/hero-cycle/slide-07-desktop.jpg", mobile: "/images/hero-cycle/slide-07-mobile.jpg" },
  { desktop: "/images/hero-cycle/slide-08-desktop.jpg", mobile: "/images/hero-cycle/slide-08-mobile.jpg" },
  // The eighth picture is the vineyard-crosses hero itself,
  // served from its own long-standing files — no copy, no
  // re-encode.
  { desktop: "/images/wogr-hero-banner.jpg", mobile: "/images/wogr-hero-mobile.jpg" },
];

const HOLD_MS = 5000;

export default function HeroCycle() {
  const [active, setActive] = useState(0);
  // Set true once the visitor interacts with the hero's doors —
  // the cycle then rests on whatever picture is showing.
  const [stopped, setStopped] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // The live Earth map slide's payload — null until (and unless)
  // the live record answers. Fetched ONCE on mount, the same
  // endpoint and no-store pattern BodyHeartbeat's loader uses,
  // and held to a stricter gate than the section map's: the hero
  // slide joins only on the LIVE record itself (data.live), never
  // on any fallback — a frozen picture of the map is the one
  // thing Jason ruled out. A failed or unusable fetch leaves
  // this null forever and the cycle stays at nine slides.
  const [mapData, setMapData] = useState<HeroMapPayload | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/heartbeat", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as HeroMapPayload;
        if (cancelled) return;
        if (
          data &&
          data.live === true &&
          typeof data.totals?.chaptersRead === "number" &&
          typeof data.today?.date === "string" &&
          Array.isArray(data.countries)
        ) {
          setMapData(data);
        }
      } catch {
        /* the slide simply never joins — the pictures walk on */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // The nine pictures, plus the map slide when it has joined.
  const totalSlides = SLIDES.length + (mapData ? 1 : 0);

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
        setActive((i) => (i + 1) % totalSlides);
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
  }, [stopped, totalSlides]);

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
            style={
              slide.mobilePos
                ? { objectPosition: slide.mobilePos }
                : undefined
            }
            className="block object-cover object-top md:hidden"
          />
        </div>
      ))}
      {/* The last turn — the live Earth map (Jason, Oct 31,
          2026), present only when the live record answered the
          fetch above. It fades on the same wrapper rhythm as the
          pictures, rests under the same pause and stop rules,
          and is decorative here: the real map below carries the
          marks' full names and meanings. */}
      {mapData ? (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
            active === SLIDES.length ? "opacity-100" : "opacity-0"
          }`}
        >
          <HeroMapSlide data={mapData} />
        </div>
      ) : null}
    </div>
  );
}
