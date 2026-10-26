import Image from "next/image";
import Link from "next/link";

/**
 * A note from Grandpa Teddy — resting directly under "Meet Grandpa
 * Teddy" on the home page (Jason, Oct 26, 2026). Not a replacement
 * for the introduction: a postscript from Teddy himself — "hey, I
 * have a little bit more to tell you here" — pointing to the
 * long-form film "One Chapter Is Enough" and telling every visitor,
 * up front, that the readings are being tested word for word and
 * that any chapter can be flagged from its own page.
 *
 * Kept to the house pattern (TaiwanPrayer): a heading, a few lines
 * in Teddy's voice, and a plain way to watch. The emblem is the
 * app's own shipped mark, shown whole.
 */

// The film: "One Chapter Is Enough" (long-form, TruVINE channel).
const FILM_URL = "https://www.youtube.com/watch?v=2ZF3agQryng";

export default function TeddyNote() {
  return (
    <section
      aria-labelledby="teddy-note-heading"
      className="mx-auto max-w-6xl px-4 pt-5 sm:px-6"
    >
      <div className="rounded-2xl border border-gold-500/15 bg-vineyard-900 px-6 py-8 text-center sm:px-10">
        <Image
          src="/images/truvine-emblem.png"
          alt=""
          width={249}
          height={192}
          className="mx-auto h-14 w-auto object-contain"
        />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
          A note from Grandpa Teddy
        </p>
        <h2
          id="teddy-note-heading"
          className="mt-2 font-display text-xl text-cream-50 sm:text-2xl"
        >
          One more thing, friend
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-cream-100/85">
          Every word you hear me read here is being tested word for
          word against the page. If anything ever sounds wrong,
          there&rsquo;s a button on every chapter to flag it — and
          that chapter comes down until it&rsquo;s right. I told the
          whole story in a short film: the night God&rsquo;s Word lit
          up Taiwan, and how one chapter is enough for God to begin.
        </p>
        <p className="mt-5">
          <a
            href={FILM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Watch the story — One Chapter Is Enough, the film on YouTube"
            className="inline-block rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
          >
            Watch the story
          </a>
        </p>
        <p className="mt-4 text-sm">
          <Link
            href="/about#word-integrity"
            className="text-sage-300 underline decoration-sage-300/40 underline-offset-4 transition-colors hover:text-gold-300"
          >
            See how we check every word
          </Link>
        </p>
      </div>
    </section>
  );
}
