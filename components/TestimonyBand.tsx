import Link from "next/link";
import Image from "next/image";

/**
 * My Testimony — the front door (Jason, Nov 4, 2026).
 *
 * Jason delegated the placement outright: "put the testimony where
 * you think it belongs," grounding it in Revelation 12:11 — we
 * overcome "by the blood of the Lamb and by the word of our
 * testimony." The band rests after the Body Heartbeat and the Open
 * Door, immediately before the book grid, so the page's order
 * preaches: Jesus (the hero) → the Word going out (the map) →
 * what the Word did for one man (this testimony) → the books
 * themselves. Until tonight the testimony was reachable only as an
 * unexplained card deep in the Lost Books grid; the card still
 * rests there, and this band is its door.
 *
 * A plain server component — a link and nothing more. No
 * counting, no tracking, no client JavaScript.
 */
export default function TestimonyBand() {
  return (
    <section
      aria-labelledby="testimony-heading"
      className="mx-auto max-w-6xl px-4 pb-4 pt-2 sm:px-6"
    >
      <Link
        href="/book/developer/0"
        className="group block overflow-hidden rounded-2xl border border-gold-500/15 bg-vineyard-900 transition-all hover:border-gold-500/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.45)] motion-reduce:transition-none"
      >
        <div className="sm:flex">
          <div className="relative aspect-[16/9] overflow-hidden sm:aspect-auto sm:min-h-[240px] sm:w-2/5">
            <Image
              src="/images/testimony-freeindeed.jpg"
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 40vw"
              className="object-cover object-[center_20%] transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-vineyard-950/60 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-vineyard-900/40" />
          </div>
          <div className="px-6 py-8 sm:flex sm:flex-1 sm:flex-col sm:justify-center sm:px-10 sm:py-10">
            <h2
              id="testimony-heading"
              className="font-display text-2xl text-cream-50 group-hover:text-gold-300 sm:text-3xl"
            >
              My Testimony
            </h2>
            <p className="mt-3 max-w-xl text-base text-sage-200">
              How Jesus set me free — Jason&rsquo;s own story, in five
              short chapters. Read it or hear it read out loud, free.
            </p>
            <p className="mt-4 max-w-xl font-scripture italic text-cream-100/85">
              &ldquo;&hellip;and by the word of their testimony.&rdquo; —
              Revelation 12:11
            </p>
            <p className="mt-5">
              <span className="inline-block rounded-lg border border-cream-100/25 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors group-hover:border-gold-400 group-hover:text-gold-300">
                Begin the testimony
              </span>
            </p>
          </div>
        </div>
      </Link>
    </section>
  );
}
