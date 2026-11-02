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
import WatchBubble from "@/components/WatchBubble";
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
          {/* The hero's bubble trio (Jason, Nov 2, 2026): the three
              actions also ride small at the hero's top corner, in
              the app's bubble idiom — the gold-rimmed round chips
              of the watch bubble and the speaker bubble. Subtle,
              not distracting, but there from the first glance and
              recognizable: read, listen, search, each going where
              its big button under the film goes. The full doors
              row remains the main road; these are the shortcut
              bubbles tucked inside the hero itself. */}
          <div className="absolute right-4 top-4 z-20 flex gap-2 sm:right-6 sm:top-6">
            <Link
              href="/book/genesis/0"
              aria-label="Start reading — opens Genesis chapter 1"
              title="Start reading — Genesis 1"
              className="grid h-9 w-9 place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 text-base shadow-lg transition-colors hover:border-gold-300 hover:bg-vineyard-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
            >
              <span aria-hidden="true">📖</span>
            </Link>
            <Link
              href="/book/mark/0?autoplay=1"
              aria-label="Start listening — Grandpa Teddy reads Mark chapter 1"
              title="Start listening — Mark 1"
              className="grid h-9 w-9 place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 text-base shadow-lg transition-colors hover:border-gold-300 hover:bg-vineyard-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
            >
              <span aria-hidden="true">🔊</span>
            </Link>
            <Link
              href="/search"
              aria-label="Search the Word"
              title="Search the Word"
              className="grid h-9 w-9 place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 text-base shadow-lg transition-colors hover:border-gold-300 hover:bg-vineyard-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
            >
              <span aria-hidden="true">🔍</span>
            </Link>
          </div>
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
          {/* The doors row: two named doors directly under the hero
              title — the Light Map to the heartbeat and Parables to
              their page (Jason, Oct 27, 2026). The Read and One Is
              Enough pills were removed (Jason, Nov 2, 2026): the
              hero bubbles and the big Start reading button already
              carry Read, and the featured film now sits immediately
              below the hero. One calm row, nothing else. */}
          <nav
            aria-label="Explore"
            className="mt-7 flex flex-wrap items-center justify-center gap-2.5"
          >
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
          </nav>
          {/* The opening line, brightened one sage step (Jason,
              Nov 1, 2026): sage-300 read a little dim over the
              hero's scrim on his phone. Same words, same place —
              one step lighter, sage-200. */}
          <p className="mx-auto mt-5 max-w-xl text-sage-200">
            The whole Bible, read out loud by Grandpa Teddy — every
            chapter free. No account, no password: tap a book, tap a
            chapter, tap Listen.
          </p>
          {/* The film leads (Jason, Nov 2, 2026): chapters read and
              app opens were being counted all over the page while
              watches lagged — the featured film rested below the
              map where few ever reached it. Jason's ruling: the
              video moves up to where the buttons are, and the
              buttons rest underneath the video. His correction the
              same morning: the film that leads must be the
              INTRODUCTION — the welcome film ("Welcome to the
              Farm," n-1KCs0r2Bw) that tells what this app is — not
              the "One Chapter Is Enough" story film, which takes
              the welcome film's former home under Meet Grandpa
              Teddy below. The lead thumbnail wears the glowing
              gold play circle at its top right (the WatchBubble
              treatment), so the "this plays" signal sits exactly
              where his eye expects it; the Shorts shelf wears the
              same gold mark, so every video surface on the page
              reads as tappable at a glance. */}
          <div className="mt-6">
            <WelcomeFilm />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {/* Start reading opens an actual chapter (Jason,
                Oct 31, 2026): it used to scroll to the book grid,
                which left the visitor still choosing. Now it
                opens Genesis chapter 1 in the reader — the same
                one-tap honesty as the speaker bubble beside it.
                The bubble on its corner is the speaker bubble's
                twin (Jason, Oct 31, 2026): a little player in
                channel colors — gold screen, vineyard play mark,
                never YouTube red. It began as a link out to
                YouTube; Jason corrected it the same morning —
                "it should be able to play here" — so the bubble
                (components/WatchBubble.tsx) opens the Mark
                chapter 1 film in the app's own player, right on
                this page. The button reads; the bubble watches. */}
            <span className="relative inline-block">
              <Link
                href="/book/genesis/0"
                className="rounded-lg bg-gold-500 px-6 py-3.5 text-base font-semibold text-vineyard-950 transition-colors hover:bg-gold-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
              >
                Start reading
              </Link>
              <WatchBubble />
            </span>
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
            <div className="flex items-center justify-center bg-vineyard-950/40 p-6 md:min-h-[280px]">
              {/* Canon-only law (Jason, Oct 28, 2026): the old welcome
                  video showed a pre-package Teddy, so it came off the
                  site and the locked canon portrait stood here. The
                  new welcome film held this spot from Oct 29, 2026
                  until Nov 2, 2026, when Jason moved it up to lead
                  the page — the introduction goes first. So the
                  canon portrait stands here again, beside the words
                  that introduce him. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/characters/teddy.webp"
                alt="Grandpa Teddy — your guide through the Word"
                className="aspect-square w-56 rounded-2xl border border-gold-500/20 object-cover sm:w-64"
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
                the whole Bible, the lost books, and the parables. Pull up a chair,
                friend — he&rsquo;ll read it to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* A note from Grandpa Teddy — home again directly under
          Meet Grandpa Teddy (Jason, Nov 2, 2026), the postscript
          spot where it was born on Oct 26, 2026. It carries the
          "One Chapter Is Enough" film (id="film" — the YouTube
          door for that film lands on this anchor) and the
          word-for-word promise, whole and intact. It led the page
          for one morning until Jason ruled the introduction —
          the welcome film — leads instead. */}
      <TeddyNote />

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

      {/* (No film rests here anymore. Grandpa Teddy's note
          carrying "One Chapter Is Enough" held this spot under
          the heartbeat from Oct 27, 2026, then led the page for
          one morning on Nov 2, 2026 — until Jason ruled the same
          day that the introduction leads: the welcome film rests
          in the hero now, and the note film keeps house directly
          under Meet Grandpa Teddy, above.) */}

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
