import Link from "next/link";
import type { Metadata } from "next";
import { getAllBooks } from "@/lib/bible";
import BookCard from "@/components/BookCard";
import VerseOfDay from "@/components/VerseOfDay";
import ContinueReading from "@/components/ContinueReading";
import PlanContinue from "@/components/PlanContinue";
import ListenDropdown from "@/components/ListenDropdown";
import LatestShorts from "@/components/LatestShorts";
import BodyHeartbeat from "@/components/BodyHeartbeat";
import WordIntegrityNote from "@/components/WordIntegrityNote";
import WelcomeFilm from "@/components/WelcomeFilm";
import HeroCycle from "@/components/HeroCycle";
import OpenDoor from "@/components/OpenDoor";
import CarvedDivider from "@/components/CarvedDivider";
import TeddyNote from "@/components/TeddyNote";
import WalkTheFarm from "@/components/WalkTheFarm";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  const books = getAllBooks();
  const ot = books.filter((b) => b.testament === "old");
  const nt = books.filter((b) => b.testament === "new");
  const extra = books.filter((b) => b.testament === "extra");

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* The cycling hero (Jason, crowned Oct 31, 2026): the
              three-crosses banner stood here from the beginning,
              but this app is all about the risen Jesus — so the
              hero now crossfades through eight crowned
              resurrection-morning stills (the Hands still
              excluded by Jason's ruling), each with its own
              phone-shaped crop. The headline, the doors and
              this scrim are untouched; only the picture walks.
              See components/HeroCycle.tsx for the whole ruling. */}
          <HeroCycle />
          <div className="absolute inset-0 bg-gradient-to-b from-vineyard-950/70 via-vineyard-950/55 to-vineyard-950" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold-300">
            Centered on the King, not the crowds
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-cream-50 sm:text-6xl">
            The Word of God,{" "}
            <span className="text-truvine-gradient">Risen</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl font-scripture text-lg italic text-cream-100/90 sm:text-xl">
            &ldquo;I am the way, the truth, and the life.&rdquo;
          </p>
          {/* The doors row (Jason, Oct 27, 2026): four named doors
              directly under the hero title — Read to the books, the
              Light Map to the heartbeat, Parables to their page, and
              One Is Enough to the featured film below the map. One
              calm row, nothing else. */}
          <nav
            aria-label="Explore"
            className="mt-7 flex flex-wrap items-center justify-center gap-2.5"
          >
            <Link
              href="#books"
              className="rounded-full border border-cream-100/25 px-4 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
            >
              Read
            </Link>
            <Link
              href="#earth-map"
              className="rounded-full border border-cream-100/25 px-4 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
            >
              Light Map
            </Link>
            <Link
              href="/parables"
              className="rounded-full border border-cream-100/25 px-4 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
            >
              Parables
            </Link>
            <Link
              href="#film"
              className="rounded-full border border-cream-100/25 px-4 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
            >
              One Is Enough
            </Link>
          </nav>
          <p className="mx-auto mt-5 max-w-xl text-sage-300">
            The whole Bible, read out loud by Grandpa Teddy — every
            chapter free. No account, no password: tap a book, tap a
            chapter, tap Listen.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {/* Start reading opens an actual chapter (Jason,
                Oct 31, 2026): it used to scroll to the book grid,
                which left the visitor still choosing. Now it
                opens Genesis chapter 1 in the reader — the same
                one-tap honesty as the speaker bubble beside it. */}
            <Link
              href="/book/genesis/0"
              className="rounded-lg bg-gold-500 px-6 py-3.5 text-base font-semibold text-vineyard-950 transition-colors hover:bg-gold-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
            >
              Start reading
            </Link>
            {/* The first door, minimized (Jason, Oct 31, 2026): the
                "Hear one chapter" door began the morning as a full
                card under the hero; Jason shrank it to this speaker
                bubble on Start listening's top-right corner. The
                button keeps its own job; the bubble is the fast
                lane — one tap and Teddy reads Mark chapter 1 (the
                ?autoplay=1 start intent). */}
            <span className="relative inline-block">
              <ListenDropdown />
              <Link
                href="/book/mark/0?autoplay=1"
                aria-label="Hear one chapter — Grandpa Teddy reads Mark chapter 1"
                title="Hear one chapter — Mark 1"
                className="absolute -top-2.5 -right-2.5 z-10 grid h-9 w-9 place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 text-base shadow-lg transition-colors hover:border-gold-300 hover:bg-vineyard-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
              >
                <span aria-hidden="true">🔊</span>
              </Link>
            </span>
            <Link
              href="/search"
              className="rounded-lg border border-cream-100/25 px-6 py-3.5 text-base font-semibold text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300"
            >
              Search the Word
            </Link>
          </div>
          <p className="mt-6 text-sm text-sage-300">
            <Link
              href="/#more"
              className="transition-colors hover:text-gold-300"
            >
              <span className="mr-1.5 text-gold-300">✦</span>
              Featuring the lost books — Enoch, Jasher, Jubilees &amp; the
              Apocrypha
            </Link>
          </p>
        </div>
      </section>

      {/* Meet Grandpa Teddy — moved up to rest directly under the
          hero (Jason, Oct 31, 2026), so a new visitor meets him
          first. (The first door itself lives in the hero now, as
          the speaker bubble on Start listening — Jason minimized
          it there the same morning.) */}
      <section
        id="meet-teddy"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-8 sm:px-6"
      >
        <div className="overflow-hidden rounded-2xl border border-gold-500/15 bg-vineyard-900">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="flex flex-col justify-center bg-vineyard-950/40 p-4 sm:p-5">
              {/* Canon-only law (Jason, Oct 28, 2026): the old welcome
                  video showed a pre-package Teddy, so it came off the
                  site and the canon portrait stood here one night.
                  The new welcome film (canon throughout, blessed by
                  Jason Oct 29, 2026) now holds this spot — and when
                  it ends, the Mark 1 reader opens right here. */}
              <WelcomeFilm />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
                Meet Grandpa Teddy
              </p>
              <h2 className="mt-2 font-display text-2xl text-cream-50 sm:text-3xl">
                Your guide through the Word
              </h2>
              <p className="mt-3 text-cream-100/85">
                Grandpa Teddy reads every chapter aloud in his warm, unhurried voice —
                the whole Bible, the lost books, and the parables. Pull up a chair,
                friend — he&rsquo;ll read it to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Word Integrity — the promise near the top of the page, on
          purpose (Jason, Oct 23, 2026): a visitor should meet the
          promise before the books and the map. Every Teddy reading is
          being checked word for word, and a chapter that doesn't match
          comes down right away. (Oct 31, 2026: the first door — the
          hero's speaker bubble — and Grandpa Teddy's film moved in
          above it; the promise still comes before the books and
          the map.) */}
      <div className="pt-6">
        <WordIntegrityNote />
      </div>

      {/* Widgets */}
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-10 sm:px-6">
        <VerseOfDay />
        <PlanContinue />
        <ContinueReading />
      </div>

      {/* The Body, Reading — the Bible Heartbeat */}
      <BodyHeartbeat />

      {/* One Chapter Is Enough — the full film, featured directly
          under the heartbeat. Until Oct 27, 2026 this spot held the
          Taiwan prayer Short; Jason's word that day: the Short's
          card comes off the homepage and the full-length film is
          the featured film presence here. So Grandpa Teddy's note
          (Oct 26, 2026 — "hey, I have a little bit more to tell
          you here"), which carries the film, moved down from under
          "Meet Grandpa Teddy" to this spot: one clear presence for
          the film, still through VideoChoice — "Watch here" plays
          it in the app; nobody is carried to YouTube unasked. The
          Short itself is untouched on the channel. */}
      <TeddyNote />

      {/* The Open Door — a quiet link out to the TruVINE Family Wall,
          resting beside the heartbeat. A plain outbound link only:
          no accounts, no tracking, no data gathered at the door. */}
      <OpenDoor />

      {/* Book grid */}
      <section id="books" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6">
        {/* The Carved Divider (Jason, crowned Oct 27, 2026): the
            Temple-language pomegranate band replaces the plain
            vine-divider above the book grid. Pure decoration. */}
        <CarvedDivider className="mb-8" />

        <div id="old-testament" className="scroll-mt-20">
          <h2 className="font-display text-2xl text-cream-100 sm:text-3xl">
            Old Testament
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ot.map((b) => (
              <BookCard key={b.slug} book={b} />
            ))}
          </div>
        </div>

        <div id="new-testament" className="scroll-mt-20">
          <h2 className="mt-14 font-display text-2xl text-cream-100 sm:text-3xl">
            New Testament
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {nt.map((b) => (
              <BookCard key={b.slug} book={b} />
            ))}
          </div>
        </div>

        {extra.length > 0 && (
          <div id="more" className="scroll-mt-20">
            <h2 className="mt-14 font-display text-2xl text-cream-100 sm:text-3xl">
              Lost Books
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {extra.map((b) => (
                <BookCard key={b.slug} book={b} />
              ))}
            </div>
          </div>
        )}

        <LatestShorts />
      </section>

      {/* Walk the Farm — the quiet last door on the page, below the
          books and every other card (Jason, Oct 26, 2026): the
          Gather the Flock walking game, everybody edition, living
          inside the app at /walk-the-farm. */}
      <WalkTheFarm />
    </div>
  );
}
