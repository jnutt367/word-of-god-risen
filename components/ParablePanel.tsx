import type { CSSProperties } from "react";

/** Branded header panel for a parable card whose film has not been
 *  made yet, so there is no real frame to show (Jason, Oct 27, 2026:
 *  all 40 parables stand on the page). It fills the same 2:1 art slot
 *  the film-frame card images occupy, in the page's own brand family —
 *  deep vine green, gold, cream, and the app's shipped emblem
 *  (/images/truvine-emblem.png, whole and margined) over the parable's
 *  title. No scene art is generated or faked for these cards: the
 *  panel honestly says whose story this is, and the card below it
 *  carries the reading, the doors, and the "Video coming" notice.
 *
 *  Type law: Quicksand is loaded at true 700 only (app/layout.tsx),
 *  and font-weight 700 is set explicitly — never the variable
 *  font's light default instance. */

const QUICKSAND_700: CSSProperties = {
  fontFamily: 'var(--font-quicksand), "Quicksand", sans-serif',
  fontWeight: 700,
};

export default function ParablePanel({
  title,
  refText,
}: {
  title: string;
  refText: string;
}) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-1.5 bg-vineyard-950 px-6 text-center">
      {/* The soft gold glow the "Video coming" frames carry, so the
          panel reads as part of the same family. Decoration only. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,164,65,0.12),transparent_65%)]"
      />
      <img
        src="/images/truvine-emblem.png"
        alt=""
        aria-hidden="true"
        className="relative h-12 w-auto sm:h-14"
      />
      <p
        className="relative text-lg leading-snug tracking-wide text-cream-100"
        style={QUICKSAND_700}
      >
        {title}
      </p>
      <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
        {refText}
      </p>
    </div>
  );
}
