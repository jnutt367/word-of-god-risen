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
import HeroWatchBubble from "@/components/HeroWatchBubble";
import HeroCycle from "@/components/HeroCycle";
import OpenDoor from "@/components/OpenDoor";
import TestimonyBand from "@/components/TestimonyBand";
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
      {/* The hero's full stage (Jason, Nov 2, 2026): on desktop
          the section was only as tall as its words (~500px), so
          the cycle's scenes were cropped into a shallow band and
          the welcome film already shared the first screen — the
          film "eating into the scenes" on his computer, while the
          phone (where the words nearly fill the screen) read
          fine. At md+ the section now stands a full viewport
          tall — 100svh minus the sticky header's measured 65px —
          as a flex column with the words centered (md:my-auto on
          the content below), so the scenes own the whole first
          screen and the film begins beneath it. Below md nothing
          changes: the phone layout stands exactly as graded. */}
      <section className="relative overflow-hidden md:flex md:min-h-[calc(100svh_-_65px)] md:flex-col">
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
        {/* The hero's bubble trio (Jason, Nov 2, 2026): the three
            actions ride small at the hero's top corner, in the
            app's bubble idiom — the gold-rimmed round chips of the
            watch bubble and the speaker bubble. Subtle, not
            distracting, but there from the first glance and
            recognizable: read, listen, search, each going where
            its big button under the film goes. The full doors row
            remains the main road; these are the shortcut bubbles
            tucked inside the hero itself. They sit on the section
            itself (not the words block) so they keep the hero's
            true top corner now that the words center on the tall
            desktop stage. Later the same day Jason asked for a
            fourth bubble beside them — the gold play bubble, the
            one mark that means a film plays here in the app: it
            leads the row, scrolls the visitor down to the welcome
            film and starts it playing in place (see
            components/HeroWatchBubble.tsx). */}
        <div className="absolute right-4 top-4 z-20 flex gap-2 sm:right-6 sm:top-6">
          <HeroWatchBubble />
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
        {/* Extra bottom room on phones (Jason, Nov 2, 2026):
            the floating Ask Teddy helper (avatar + his name pill)
            rests at the screen's bottom right, and the hero's
            last line — "✦ Featuring the lost books…" — was
            passing underneath it, covered mid-word. pb-28 lifts
            that line clear of the helper's band; the helper
            himself is untouched and works exactly as before. */}
        <div className="relative mx-auto w-full max-w-4xl px-4 pt-14 pb-28 text-center sm:px-6 sm:py-20 md:my-auto">
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
              className="relative rounded-full border border-cream-100/25 px-4 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
            >
              {/* The legend in miniature (Jason, Nov 2, 2026):
                  six little dots ride the pill's top rim in the
                  Earth map legend's own colors — gold for the
                  Word read or heard, the same gold dimmed to an
                  ember for the app opened, green for a book
                  finished, purple for still knocking, warm red
                  for kindled, and the watch trace's blue for a
                  video watched (the hundredfold's gold ring is
                  the first gold again, so six dots carry all
                  seven marks). A wordless signal that the map
                  has lights on it. Decorative only — the pill's
                  name already says Earth Map. */}
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 gap-[5px]"
              >
                <span className="h-[5px] w-[5px] rounded-full shadow-[0_0_0_1px_rgba(9,12,19,0.45)]" style={{ backgroundColor: "#e4b95c" }} />
                <span className="h-[5px] w-[5px] rounded-full shadow-[0_0_0_1px_rgba(9,12,19,0.45)]" style={{ backgroundColor: "#e4b95c", opacity: 0.45 }} />
                <span className="h-[5px] w-[5px] rounded-full shadow-[0_0_0_1px_rgba(9,12,19,0.45)]" style={{ backgroundColor: "#94c64a" }} />
                <span className="h-[5px] w-[5px] rounded-full shadow-[0_0_0_1px_rgba(9,12,19,0.45)]" style={{ backgroundColor: "#a855f7" }} />
                <span className="h-[5px] w-[5px] rounded-full shadow-[0_0_0_1px_rgba(9,12,19,0.45)]" style={{ backgroundColor: "#d9482f" }} />
                <span className="h-[5px] w-[5px] rounded-full shadow-[0_0_0_1px_rgba(9,12,19,0.45)]" style={{ backgroundColor: "#8fd8ff" }} />
              </span>
              Earth Map
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
          {/* The welcome film and the doors row rested here for
              one morning (Nov 2, 2026) — until Jason ruled the
              film's frame covered the hero's cycling stills and
              dulled the walk. The hero keeps its whole first
              screen now; the film + doors unit leads the river
              directly below (next section). The film's poster
              rode as a turn of the cycle for one morning more —
              out the same day on Jason's verdict: Teddy doesn't
              belong in the hero carousel. */}
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

      {/* The introduction leads the river (Jason, Nov 2, 2026):
          the welcome film spent one morning inside the hero,
          where its frame covered the cycling stills and dulled
          the walk. Jason's ruling: the hero keeps its whole
          first screen — stills, headline, verse, line, bubbles
          and pills — and the film steps out to lead everything
          under it, the doors row resting directly beneath it,
          the whole unit traveling together. On desktop the hero
          now stands a full screen tall (see the hero section
          above), so this film begins only after the complete
          hero — never sharing the scenes' screen. */}
      <section
        aria-label="Welcome to the Farm — the welcome film and the first doors"
        className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 sm:pt-10"
      >
        <WelcomeFilm />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {/* Start reading opens an actual chapter (Jason,
              Oct 31, 2026): it used to scroll to the book grid,
              which left the visitor still choosing. Now it
              opens Genesis chapter 1 in the reader — the same
              one-tap honesty as the speaker bubble beside it.
              The bubble on its corner wore the gold play mark
              for one morning (Oct 31 – Nov 2, 2026), opening
              the Mark 1 film — until Jason's icon-truth ruling
              (Nov 2, 2026): the gold glowing play circle now
              means VIDEO, strictly — it belongs on thumbnails
              that play here in the app, and nowhere else. A
              play mark on the reading button promised the
              wrong thing, so the bubble is the BOOK now — the
              same 📖 treatment as the hero trio's read bubble —
              and it goes where the button goes: Genesis 1.
              Icons tell the truth here: book = read,
              speaker = listen, gold play = watch here. */}
          <span className="relative inline-block">
            <Link
              href="/book/genesis/0"
              className="rounded-lg bg-gold-500 px-6 py-3.5 text-base font-semibold text-vineyard-950 transition-colors hover:bg-gold-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
            >
              Start reading
            </Link>
            <Link
              href="/book/genesis/0"
              aria-label="Start reading — opens Genesis chapter 1"
              title="Start reading — Genesis 1"
              className="absolute -top-2.5 -right-2.5 z-10 grid h-9 w-9 place-items-center rounded-full border border-gold-400/70 bg-vineyard-900 text-base shadow-lg transition-colors hover:border-gold-300 hover:bg-vineyard-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300"
            >
              <span aria-hidden="true">📖</span>
            </Link>
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
      </section>

      {/* A note from Grandpa Teddy — resting directly under the
          welcome film and the doors row (Jason, Nov 2, 2026). It
          was born as his postscript under "Meet Grandpa Teddy" on
          Oct 26, 2026; that section came off the page today —
          the welcome film IS the meeting now, Jason's word, and
          a portrait card saying "meet him" after the film has
          introduced him is redundant. The note carries the "One
          Chapter Is Enough" film (id="film" — the YouTube door
          for that film lands on this anchor) and the
          word-for-word promise, whole and intact. */}
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
          day that the introduction leads: the welcome film leads
          the river directly under the hero now, and the note
          film rests under the doors row, above. The Meet Grandpa
          Teddy section itself is gone (Jason, Nov 2, 2026) —
          the film is the meeting.) */}

      {/* The Open Door — a quiet link out to the TruVINE Family Wall,
          resting beside the heartbeat. A plain outbound link only:
          no accounts, no tracking, no data gathered at the door. */}
      <OpenDoor />

      {/* My Testimony — moved below the books (Jason, Nov 5, 2026):
          Jason worried the band's old spot — between the map and
          the book grids — put his own story where it could distract
          from the Word itself, so it now rests after the books: the
          Word leads, and the testimony follows as a door for anyone
          who wants it. Its picture changed the same day, from the
          painted vineyard cover to the film's "free indeed" frame —
          the image that tells the story. (The band first stood here
          on Nov 4, 2026, on Revelation 12:11 — "…and by the word of
          their testimony" — and the developer book's own cover keeps
          the vineyard painting.) */}

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

      {/* My Testimony — the door after the books (moved here
          Nov 5, 2026; see the note above the book grid). */}
      <TestimonyBand />

      {/* Walk the Farm — the quiet last door on the page, below the
          books and every other card (Jason, Oct 26, 2026): the
          Gather the Flock walking game, everybody edition, living
          inside the app at /walk-the-farm. */}
      <WalkTheFarm />
    </div>
  );
}
