import Link from "next/link";

/**
 * The first door (Jason, Oct 31, 2026): one calm door at the very
 * top of the homepage, under the hero, for the visitor who has
 * just arrived and doesn't yet know where to begin.
 *
 *   🔊 New here? Hear one chapter — one tap takes the visitor to
 *      Mark chapter 1 with Teddy's reading started. The tap is the
 *      gesture, so the link carries the start intent the reader
 *      pages already understand (?autoplay=1 — the same intent the
 *      Listen menu's doors carry); the chapter's own Listen control
 *      begins the reading and counts it exactly as any chapter
 *      listen is counted. No new tracking of any kind.
 *
 * A "Watch Grandpa Teddy" door stood beside this one for its
 * first hours; Jason removed it the same morning — the welcome
 * film rests directly below this door, so a door that only
 * scrolls to it is redundant.
 *
 * The door is a plain link and nothing more: no accounts, no
 * data gathered at the threshold.
 */
export default function FirstDoors() {
  return (
    <section
      aria-label="A door for a first visit"
      className="mx-auto max-w-6xl px-4 pt-6 sm:px-6"
    >
      <div className="mx-auto max-w-xl">
        <Link
          href="/book/mark/0?autoplay=1"
          className="flex flex-col items-center rounded-2xl border border-gold-500/15 bg-vineyard-900 px-6 py-7 text-center transition-colors hover:border-gold-400/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 sm:px-8"
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            🔊
          </span>
          <span className="mt-3 font-display text-xl text-cream-50 sm:text-2xl">
            New here? Hear one chapter
          </span>
          <span className="mt-2 max-w-sm text-sm text-sage-300">
            Grandpa Teddy reads Mark chapter 1 — one tap, no choosing.
          </span>
        </Link>
      </div>
    </section>
  );
}
