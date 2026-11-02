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
 * simply never exists and the walk goes on without it.
 * Under reduced motion the cycle never advances at all, so the
 * map slide is never reached — the tomb stands, as always.
 *
 * The ninth turn is the welcome film's poster (Jason, Nov 2,
 * 2026): the film itself leads the river directly under the
 * hero, and Jason ruled it be both — a standing door below AND
 * a turn of this walk, riding after the vineyard crosses and
 * before the living map, wearing the same glowing gold play
 * circle at its top right. A tap on the turn hands the ask to
 * the standing film (components/WelcomeFilm.tsx), which
 * scrolls into view and plays here in the app. Under reduced
 * motion the cycle never advances, so — like the map — the
 * film turn is never reached; the tomb stands, and the
 * standing film below keeps its own door for everyone.
 */
const SLIDES: { desktop: string; mobile: string; mobilePos?: string }[] = [
  // Phone pictures crowned Oct 31, 2026 are PORTRAIT-NATIVE
  // generations (hero-recreation/mobile-native/), composed for
  // the tall frame — they replace the wide-frame phone crops on
  // the slides Jason crowned: the tomb, the ascension, Emmaus,
  // and the family around the Word (which takes the open-book
  // slide's phone place); the Rabboni and shore remakes joined
  // them on his crown later the same day. The angel's remake
  // came on Jason's ruling Nov 2, 2026: seeded from the crowned
  // tomb plate (cover-recreation/cast-angels/), the unnamed
  // angel of Matthew 28 seated on the rolled-away stone at
  // dawn, his face turned away. Scripture never names him, so
  // no label here does either — the picture may put a viewer
  // in mind of Gabriel, and nothing in it settles that.
  { desktop: "/images/hero-cycle/slide-01-desktop.jpg", mobile: "/images/hero-cycle/slide-01-mobile-native.jpg" },
  { desktop: "/images/hero-cycle/slide-03-desktop.jpg", mobile: "/images/hero-cycle/slide-03-mobile.jpg" },
  { desktop: "/images/hero-cycle/slide-04-desktop.jpg", mobile: "/images/hero-cycle/slide-04-mobile-native.jpg" },
  { desktop: "/images/hero-cycle/slide-05-desktop.jpg", mobile: "/images/hero-cycle/slide-05-mobile-native.jpg" },
  { desktop: "/images/hero-cycle/slide-06-desktop.jpg", mobile: "/images/hero-cycle/slide-06-mobile-native.jpg" },
  { desktop: "/images/hero-cycle/slide-07-desktop.jpg", mobile: "/images/hero-cycle/slide-07-mobile-native.jpg" },
  { desktop: "/images/hero-cycle/slide-08-desktop.jpg", mobile: "/images/hero-cycle/slide-08-mobile-native.jpg" },
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
  // The showing turn, readable inside the tap listener below
  // without re-binding it on every turn.
  const activeRef = useRef(active);
  activeRef.current = active;
  // The live Earth map slide's payload — null until (and unless)
  // the live record answers. Fetched ONCE on mount, the same
  // endpoint and no-store pattern BodyHeartbeat's loader uses,
  // and held to a stricter gate than the section map's: the hero
  // slide joins only on the LIVE record itself (data.live), never
  // on any fallback — a frozen picture of the map is the one
  // thing Jason ruled out. A failed or unusable fetch leaves
  // this null forever and the map turn simply never joins.
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

  // The eight pictures and the film turn, plus the map slide
  // when it has joined.
  const totalSlides = SLIDES.length + 1 + (mapData ? 1 : 0);

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

  // The film turn's own tap (Jason, Nov 2, 2026): while the
  // welcome film's poster is the showing turn, a tap anywhere
  // on the hero that doesn't land on one of its doors asks the
  // standing film below to open — the walk rests, as it does
  // for any door, and components/WelcomeFilm.tsx hears the
  // event, scrolls itself into view and plays. The poster is a
  // second path to the same door, never a second player.
  useEffect(() => {
    const section = rootRef.current?.closest("section");
    if (!section) return;
    const onTap = (e: Event) => {
      if (activeRef.current !== SLIDES.length) return;
      if ((e.target as HTMLElement).closest("a, button")) return;
      setStopped(true);
      window.dispatchEvent(new CustomEvent("wogr:welcome-film:open"));
    };
    section.addEventListener("pointerdown", onTap);
    return () => section.removeEventListener("pointerdown", onTap);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`absolute inset-0 ${
        active === SLIDES.length ? "cursor-pointer" : ""
      }`}
    >
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
                : i === 1
                  ? "The angel at the tomb at dawn — seated on the stone rolled away from the empty tomb, his face turned away"
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
      {/* The ninth turn — the welcome film's poster (Jason,
          Nov 2, 2026), riding after the vineyard crosses and
          before the living map. It wears the same glowing gold
          play circle at its top right — set below the hero's
          bubble trio and glowing above the scrim, in the family
          of the trio's own un-scrimmed gold rims, so the "this
          plays" signal keeps its full light. The turn is a
          poster, not a player: a tap on it is caught at the
          section level (see the effect above) and handed to
          the standing film below the hero. Decorative here —
          the standing film's own button is the real, reachable
          control — so the turn is aria-hidden, like the map. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
          active === SLIDES.length ? "opacity-100" : "opacity-0"
        }`}
      >
        <Image
          src="/images/welcome-film-thumb.webp"
          alt=""
          fill
          loading="lazy"
          sizes="100vw"
          className="object-cover object-top"
        />
        <span
          aria-hidden="true"
          className="watch-bubble-glow absolute top-[4.25rem] right-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 shadow-lg sm:top-[4.75rem] sm:right-6"
        >
          <svg
            viewBox="0 0 24 24"
            className="ml-0.5 h-5 w-5"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M8 5.5v13l11-6.5-11-6.5z" fill="var(--color-gold-400)" />
          </svg>
        </span>
      </div>
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
            active === SLIDES.length + 1 ? "opacity-100" : "opacity-0"
          }`}
        >
          <HeroMapSlide data={mapData} />
        </div>
      ) : null}
    </div>
  );
}
