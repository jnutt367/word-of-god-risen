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

function variantForHour(hour: number): ArtVariant {
  // Morning crew (5:00–10:59 local) gets the sunrise art. Day and
  // night variants are still to come; those hours keep the evening
  // lantern art for now.
  if (hour >= 5 && hour < 11) return MORNING;
  return EVENING;
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
