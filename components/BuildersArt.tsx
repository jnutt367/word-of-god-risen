"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type ArtVariant = { src: string; alt: string };

const EVENING: ArtVariant = {
  src: "/images/builders-404.png",
  alt: "Jason and Judah of the True Vine Construction Crew on a vineyard path at golden hour — Jason kneels repairing a broken wooden signpost while Judah holds up a lantern and points the way home",
};

const MORNING: ArtVariant = {
  src: "/images/builders-404-morning.png",
  alt: "Jason and Judah of the True Vine Construction Crew on a vineyard path at sunrise — a rooster crows from the fence rail while Jason tightens the last bolt on the repaired signpost, coffee steaming beside his toolbox, and Judah smiles over his own mug of coffee",
};

const DAY: ArtVariant = {
  src: "/images/builders-404-day.png",
  alt: "Jason and Judah of the True Vine Construction Crew on a vineyard path at midday — Jason kneels repairing a broken signpost post while chickens scatter around his open toolbox, a sheepdog trots down the path between the vines, and Judah holds up a lantern in the bright sun",
};

const NIGHT: ArtVariant = {
  src: "/images/builders-404-night.png",
  alt: "Jason and Judah of the True Vine Construction Crew on a vineyard path at night under a starry sky and crescent moon — Jason rests on a stool with a mug of coffee beside the broken signpost, Judah holds up a glowing lantern, and a sleepy donkey watches them, unimpressed",
};

function variantForHour(hour: number): ArtVariant {
  // The crew keeps the visitor's hours: morning (5:00–10:59),
  // day (11:00–16:59), evening (17:00–20:59), night (21:00–4:59).
  if (hour >= 5 && hour < 11) return MORNING;
  if (hour >= 11 && hour < 17) return DAY;
  if (hour >= 17 && hour < 21) return EVENING;
  return NIGHT;
}

/**
 * The Construction Crew art for the 404 / error pages, matched to the
 * visitor's local time of day. Server-rendered as the evening scene,
 * then swapped on mount — so there's no hydration mismatch.
 */
export default function BuildersArt() {
  const [art, setArt] = useState<ArtVariant>(EVENING);

  useEffect(() => {
    setArt(variantForHour(new Date().getHours()));
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-gold-500/15 bg-vineyard-900 shadow-2xl">
      <Image
        src={art.src}
        alt={art.alt}
        width={1920}
        height={1280}
        priority
        className="h-auto w-full"
      />
    </div>
  );
}
