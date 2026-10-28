import Image from "next/image";
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
import OpenDoor from "@/components/OpenDoor";
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
          <Image
            src="/images/wogr-hero-banner.jpg"
            alt="Three crosses on a hill at sunrise, above rows of grapevines"
            fill
            priority
            sizes="100vw"
            className="hidden object-cover object-top md:block"
          />
          <Image
            src="/images/wogr-hero-mobile.jpg"
            alt="Three crosses on a hill at sunrise, above rows of grapevines"
            fill
            priority
            sizes="100vw"
            className="block object-cover object-top md:hidden"
          />
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
              Earth Map to the heartbeat, Parables to their page, and
              Watch the Film to the featured film below the map. One
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
              The Earth Map
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
              Watch the Film
            </Link>
          </nav>
          <p className="mx-auto mt-5 max-w-xl text-sage-300">
            The whole Bible, read out loud by Grandpa Teddy — every
            chapter free. No account, no password: tap a book, tap a
            chapter, tap Listen.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#books"
              className="rounded-lg bg-gold-500 px-6 py-3.5 text-base font-semibold text-vineyard-950 transition-colors hover:bg-gold-400"
            >
              Start reading
            </Link>
            <ListenDropdown />
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

      {/* Word Integrity — first content after the hero, on purpose
          (Jason, Oct 23, 2026): a visitor should meet the promise
          before the books and the map. Every Teddy reading is being
          checked word for word, and a chapter that doesn't match
          comes down right away. */}
      <div className="pt-6">
        <WordIntegrityNote />
      </div>

      {/* Meet Grandpa Teddy */}
      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-gold-500/15 bg-vineyard-900">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="aspect-video md:aspect-auto md:min-h-[280px]">
              <iframe
                src="https://www.youtube.com/embed/25A7EQBDeI0"
                title="Welcome to Word of God Risen — Meet Grandpa Teddy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
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
                the whole Bible, the lost books, and the parables. Pull up a chair
                and let's hear the Word together.
              </p>
            </div>
          </div>
        </div>
      </section>

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
        <div className="vine-divider mb-8" aria-hidden="true">
          <span className="font-display text-lg tracking-wide">✦</span>
        </div>

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
