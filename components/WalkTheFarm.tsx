import Image from "next/image";

/**
 * Walk the Farm — a quiet door card at the foot of the homepage,
 * below the books and every other card, opening the Gather the
 * Flock walking game where it lives inside the app at
 * /walk-the-farm (Jason, Oct 26, 2026).
 *
 * This is the EVERYBODY edition of the game: Teddy greets every
 * visitor as "friend." Will's own copy keeps his name and lives
 * untouched on the TruVINE Pages site. The game itself is a static
 * page served from public/, so this door is a plain anchor — a
 * full step through, no client routing, no tracking at the door.
 */
export default function WalkTheFarm() {
  return (
    <section
      aria-labelledby="walk-the-farm-heading"
      className="mx-auto max-w-6xl px-4 pb-20 sm:px-6"
    >
      <div className="rounded-2xl border border-gold-500/15 bg-vineyard-900 px-6 py-8 text-center sm:px-10">
        <Image
          src="/images/truvine-emblem.png"
          alt="The TruVINE emblem — a vine in a triangle"
          width={249}
          height={192}
          className="mx-auto h-auto w-20"
        />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
          Gather the Flock
        </p>
        <h2
          id="walk-the-farm-heading"
          className="mt-2 font-display text-xl text-cream-50 sm:text-2xl"
        >
          Walk the Farm
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-cream-100/85">
          A little walk with Grandpa Teddy — gather the flock and see
          the farm.
        </p>
        <p className="mt-5">
          <a
            href="/walk-the-farm"
            className="inline-block rounded-lg border border-cream-100/25 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300"
          >
            Walk the farm
          </a>
        </p>
      </div>
    </section>
  );
}
