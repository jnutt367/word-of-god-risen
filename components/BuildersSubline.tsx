"use client";

import { useEffect, useState } from "react";

const DAY_LINE =
  "We\u2019re fixing it right now\u2026 meanwhile, let us walk you home.";
const NIGHT_LINE =
  "Even the broken paths get fixed around here\u2026 just a little slower after midnight.";

/**
 * The 404 sub-line, matched to the visitor's local time: the night
 * crew (21:00–4:59 local) gets its own slower-after-midnight line.
 */
export default function BuildersSubline() {
  const [night, setNight] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    setNight(h >= 21 || h < 5);
  }, []);

  return (
    <p className="mx-auto mt-5 max-w-xl text-lg text-sage-300">
      {night ? NIGHT_LINE : DAY_LINE}
    </p>
  );
}
