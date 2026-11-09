import type { Metadata } from "next";
import Link from "next/link";
import { CHARACTERS, type Character } from "@/data/characters";
import { BOOKS, bookBySlug, type BookMeta } from "@/data/books";
import { getBookDoc, castCount } from "@/data/book-docs";

export const metadata: Metadata = {
  title: "Characters of the Bible · Word of God Risen",
  description:
    "The people of the Bible, shelved by the Bible itself — every book documented, every person in it. Every fact from Scripture, with verse references.",
};

/** NT books with crowned cast today, in Bible order (preview, Nov 9). */
const NT_CAST_BOOKS = ["matthew", "mark", "luke", "john", "acts", "romans", "corinthians-1"];
/** NT books shown quietly while their cast is gathered. */
const NT_GATHERING = ["galatians", "ephesians"];
const OT_GATHERING = ["genesis", "exodus", "ruth"];
/** The lost books carried on the app (testament: 'extra'), minus the
    hidden legacy Parables entry and Jason's own Testimony. */
const LOST_BOOKS = BOOKS.filter(
  (b) => b.testament === "extra" && !b.hidden && b.slug !== "developer"
);

function CharacterCard({ c }: { c: Character }) {
  return (
    <Link
      href={`/characters/${c.slug}`}
      className="group overflow-hidden rounded-2xl border border-gold-500/15 bg-vineyard-900 transition-transform hover:-translate-y-1 hover:border-gold-500/40"
    >
      <div className="aspect-square w-full overflow-hidden">
        {c.image ? (
          <img
            src={c.image}
            alt={`Portrait of ${c.name}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-vineyard-800 text-sage-400">
            {c.name}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg leading-tight text-cream-50">
          {c.name}
          {c.unnamed && (
            <span className="ml-2 inline-block rounded-full border border-gold-500/40 px-2 py-0.5 align-middle text-[11px] font-semibold uppercase tracking-wide text-gold-300">
              Unnamed
            </span>
          )}
        </h3>
        <p className="mt-1 text-sm text-gold-300">{c.roles.join(" · ")}</p>
        <p className="mt-1 text-sm text-sage-400">{c.subtitle}</p>
      </div>
    </Link>
  );
}

function BookTile({ book, quiet }: { book: BookMeta; quiet?: boolean }) {
  const doc = getBookDoc(book.slug);
  const count = castCount(book.slug);
  const inner = (
    <>
      <div className="aspect-[16/9] w-full overflow-hidden">
        <img
          src={book.image}
          alt={`Cover of ${book.title}`}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg leading-tight text-cream-50">{book.title}</h3>
        {quiet ? (
          <p className="mt-1 text-sm text-sage-400">Cast being gathered along the road.</p>
        ) : (
          <>
            {doc?.tileLine ? (
              <p className="mt-1 text-sm leading-relaxed text-sage-400">{doc.tileLine}</p>
            ) : null}
            <p className="mt-2 text-sm font-semibold text-gold-300">
              {count > 0 ? `${count} in the cast` : "Faces: being gathered"}
            </p>
          </>
        )}
      </div>
    </>
  );
  if (quiet) {
    return (
      <div className="overflow-hidden rounded-2xl border border-dashed border-gold-500/25 bg-vineyard-900/60 opacity-80">
        {inner}
      </div>
    );
  }
  return (
    <Link
      href={`/characters/book/${book.slug}`}
      className="group overflow-hidden rounded-2xl border border-gold-500/15 bg-vineyard-900 transition-transform hover:-translate-y-1 hover:border-gold-500/40"
    >
      {inner}
    </Link>
  );
}

function ShelfHeading({
  shelf,
  title,
  blurb,
}: {
  shelf: string;
  title: string;
  blurb?: string;
}) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
        {shelf}
      </p>
      <h2 className="mt-2 font-display text-2xl text-cream-100 sm:text-3xl">{title}</h2>
      {blurb ? <p className="mt-2 max-w-2xl text-sage-400">{blurb}</p> : null}
    </>
  );
}

export default function CharactersPage() {
  const heavenly = CHARACTERS.filter((c) => c.roles.includes("Angel"));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
        TruVINE
      </p>
      <h1 className="mt-2 font-display text-3xl text-cream-50 sm:text-4xl">
        The People of the Bible
      </h1>
      <p className="mt-3 max-w-2xl font-scripture text-lg italic leading-relaxed text-sage-300">
        Every book documented. Every person in it.
      </p>
      <p className="mt-3 max-w-2xl leading-relaxed text-sage-400">
        Characters, shelved by the Bible itself — Testament → Book → People.
        A person is filed under their first book and cross-linked from every
        other book they appear in. One person, one page, one portrait set.
      </p>

      {/* Shelf 1 — The Heavenly Company */}
      <section className="mt-12">
        <ShelfHeading
          shelf="Shelf 1"
          title="The Heavenly Company"
          blurb="Only two angels are named in all of Scripture. One stands in God's presence and announces; the other contends for God's people. Their faces are shown, for Scripture names them."
        />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {heavenly.map((c) => (
            <CharacterCard key={c.slug} c={c} />
          ))}
        </div>
      </section>

      {/* Shelf 2 — The New Testament, by book */}
      <section className="mt-14">
        <ShelfHeading
          shelf="Shelf 2"
          title="The New Testament — by book"
          blurb="Counts: people with crowned pages who appear in the book."
        />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {NT_CAST_BOOKS.map((slug) => {
            const book = bookBySlug(slug);
            return book ? <BookTile key={slug} book={book} /> : null;
          })}
          {NT_GATHERING.map((slug) => {
            const book = bookBySlug(slug);
            return book ? <BookTile key={slug} book={book} quiet /> : null;
          })}
        </div>
      </section>

      {/* Shelf 3 — The Old Testament, by book */}
      <section className="mt-14">
        <ShelfHeading shelf="Shelf 3" title="The Old Testament — by book" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {(() => {
            const obadiah = bookBySlug("obadiah");
            return obadiah ? <BookTile book={obadiah} /> : null;
          })()}
          {OT_GATHERING.map((slug) => {
            const book = bookBySlug(slug);
            return book ? <BookTile key={slug} book={book} quiet /> : null;
          })}
        </div>
      </section>

      {/* Shelf 4 — The Lost Books */}
      <section className="mt-14">
        <ShelfHeading
          shelf="Shelf 4"
          title="The Lost Books"
          blurb="Enoch · Jasher · Jubilees · Apocrypha — same documentation, their own shelf, presented as the lost books and never merged into the 66."
        />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {LOST_BOOKS.map((book) => (
            <BookTile key={book.slug} book={book} />
          ))}
        </div>
      </section>

      <p className="mt-14 border-t border-gold-500/15 pt-6 font-scripture text-sm italic text-sage-500">
        &ldquo;Being gathered&rdquo; means no faces are crowned for that book
        yet — never strangers in their place.
      </p>
    </div>
  );
}
