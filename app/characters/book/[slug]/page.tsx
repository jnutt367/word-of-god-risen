import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOKS, bookBySlug } from "@/data/books";
import { charactersInBook, type Character } from "@/data/characters";
import { getBookDoc, nameOnlyCast, NO_NAMED_CAST } from "@/data/book-docs";
import { audioStatusLine } from "@/lib/book-audio";

export function generateStaticParams() {
  return BOOKS.filter((b) => !b.hidden).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = bookBySlug(slug);
  if (!book || book.hidden) return { title: "Book" };
  return {
    title: `${book.title} — Its People · Characters · Word of God Risen`,
    description: `The book of ${book.title} documented — and the people who appear in it, every fact from Scripture.`,
  };
}

function PersonCard({ c }: { c: Character }) {
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

export default async function BookCharactersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = bookBySlug(slug);
  if (!book || book.hidden) notFound();

  const doc = getBookDoc(slug);
  const cast = charactersInBook(slug);
  const nameOnly = nameOnlyCast(slug);
  const noNamedCastKind = NO_NAMED_CAST[slug];

  const fields: { label: string; value: string }[] = [];
  if (doc?.author) fields.push({ label: "Author", value: doc.author });
  if (doc?.written) fields.push({ label: "Written", value: doc.written });
  fields.push({ label: "Chapters", value: String(book.chapters) });
  if (doc?.theme) fields.push({ label: "Theme", value: doc.theme });
  if (doc?.coverStatus) fields.push({ label: "Cover", value: doc.coverStatus });
  fields.push({ label: "Audio", value: audioStatusLine(slug, book.chapters) });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/characters"
        className="text-sm font-medium text-gold-300 hover:text-gold-400"
      >
        ← All characters
      </Link>

      {/* Cover banner */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-gold-500/20">
        <img
          src={book.image}
          alt={`Cover of ${book.title}`}
          className="aspect-[16/7] w-full object-cover"
        />
      </div>

      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
        {book.testament === "old"
          ? "Old Testament"
          : book.testament === "new"
            ? "New Testament"
            : "The Lost Books"}
      </p>
      <h1 className="mt-2 font-display text-3xl text-cream-50 sm:text-4xl">
        {book.title}
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/book/${slug}/0`}
          className="rounded-full bg-gold-500 px-5 py-2 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400"
        >
          Read {book.title} →
        </Link>
        {book.videoId ? (
          <a
            href={`https://www.youtube.com/watch?v=${book.videoId}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-gold-500/30 px-5 py-2 text-sm font-medium text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300"
          >
            Watch the overview ↗
          </a>
        ) : null}
      </div>

      {/* Documentation — only verified fields render */}
      <section className="mt-10">
        <h2 className="font-display text-2xl text-cream-100">The book, documented</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div
              key={f.label}
              className="rounded-xl border border-gold-500/15 bg-vineyard-900 p-4 sm:p-5"
            >
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
                {f.label}
              </dt>
              <dd className="mt-2 leading-relaxed text-cream-100">{f.value}</dd>
            </div>
          ))}
          {doc?.keyVerse ? (
            <div className="rounded-xl border border-gold-500/15 bg-vineyard-900 p-4 sm:p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
                Key verse
              </dt>
              <dd className="mt-2 leading-relaxed text-cream-100">
                <span className="font-scripture italic">
                  &ldquo;{doc.keyVerse.text}&rdquo;
                </span>{" "}
                <span className="text-gold-300">— {doc.keyVerse.ref}</span>
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {/* The cast */}
      <section className="mt-12">
        <h2 className="font-display text-2xl text-cream-100">
          The cast of {book.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sage-400">Who appears or speaks</p>

        {cast.length > 0 || nameOnly.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {cast.map((c) => (
              <PersonCard key={c.slug} c={c} />
            ))}
            {nameOnly.map((n) => (
              <div
                key={n.name}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-dashed border-gold-500/40 bg-vineyard-900/60 p-4"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
                    Portrait not yet crowned
                  </p>
                  <h3 className="mt-2 font-display text-lg leading-tight text-cream-50">
                    {n.name}
                  </h3>
                  <p className="mt-1 text-sm text-sage-400">{n.note}</p>
                </div>
              </div>
            ))}
          </div>
        ) : noNamedCastKind ? (
          <p className="mt-4 max-w-2xl font-scripture text-lg italic leading-relaxed text-sage-300">
            No named cast — this book speaks in {noNamedCastKind}.
          </p>
        ) : (
          <p className="mt-4 max-w-2xl font-scripture text-lg italic leading-relaxed text-sage-300">
            Faces: being gathered. No one is crowned for this book yet — and
            no stranger will ever be put in their place.
          </p>
        )}
      </section>
    </div>
  );
}
