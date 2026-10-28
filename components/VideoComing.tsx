import type { CSSProperties } from "react";

/** "Video coming" — the placeholder that stands where a parable card's
 *  film will live (Jason, Oct 27, 2026 evening). Jason amended his
 *  morning rule (audio AND film, or the card comes down): the parables
 *  whose films aren't published yet are back on the page with their
 *  card art, their Teddy reading, and their two source doors — and in
 *  the film's place, this notice in the shape of a YouTube player:
 *  deep vine green, a gold play button, the real TruVINE emblem small
 *  in the corner, and Jason's exact words, "Video coming."
 *
 *  It is a NOTICE, never a door: no link, no button, nothing to tap —
 *  and role="img" with an aria-label so a screen reader hears the
 *  same promise a sighted reader sees. Zero image assets: the play
 *  glyph is one inline SVG triangle in a gold rounded rectangle (the
 *  shape YouTube's own button teaches the eye), and the emblem is the
 *  app's shipped /images/truvine-emblem.png, whole and margined.
 *
 *  Type law: Quicksand is loaded at true 700 only (app/layout.tsx),
 *  and font-weight 700 is set explicitly — never the variable
 *  font's light default instance. */

const QUICKSAND_700: CSSProperties = {
  fontFamily: 'var(--font-quicksand), "Quicksand", sans-serif',
  fontWeight: 700,
};

export default function VideoComing({ title }: { title: string }) {
  return (
    <div
      role="img"
      aria-label={`${title} — video coming. The film is on its way; Grandpa Teddy's reading of the parable is on this card now.`}
      className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl border border-gold-500/25 bg-vineyard-950"
    >
      {/* A soft gold glow behind the play button, so the frame feels
          lit rather than empty. Pure decoration — aria-hidden. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,164,65,0.12),transparent_65%)]"
      />
      {/* The real emblem, small, whole, with clear margin — the
          channel badge in the corner of the frame. */}
      <img
        src="/images/truvine-emblem.png"
        alt=""
        aria-hidden="true"
        className="absolute right-3 top-3 h-9 w-auto"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-6 text-center">
        {/* The play glyph in YouTube's visual language: a rounded
            rectangle with a triangle — here gold with a deep-green
            triangle, in the brand family. */}
        <span
          aria-hidden="true"
          className="flex h-12 w-[4.25rem] items-center justify-center rounded-[0.7rem] bg-gold-500 shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            className="ml-0.5 h-6 w-6 fill-vineyard-950"
          >
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
        <p
          className="text-base tracking-wide text-cream-100"
          style={QUICKSAND_700}
        >
          Video coming
        </p>
        <p className="text-xs leading-relaxed text-sage-300">
          The film is on its way — the reading is ready now.
        </p>
      </div>
    </div>
  );
}
