import type { Metadata } from "next";
import Link from "next/link";
import { CHARACTERS, CHARACTER_GROUPS, unnamedCharacters, type Character } from "@/data/characters";

export const metadata: Metadata = {
  title: "Characters of the Bible · Word of God Risen",
  description:
    "Meet the people of the Gospel of Mark — the Twelve, key figures, and the unnamed ones whose stories carry great meaning. Every fact from Scripture, with verse references.",
};

function CharacterCard({ c }: { c: Character }) {
  return (
    <Link
      href={`/characters/mark/${c.slug}`}
      className="group overflow-hidden rounded-2xl border border-gold-500/15 bg-vineyard-900 transition-transform hover:-translate-y-1 hover:border-gold-500/40"
    >
      <div className="aspect-square w-full overflow-hidden">
        {c.image ? (
          <img
            src={c.image}
            alt={c.name}
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
        <p className="mt-1 text-sm text-sage-400">{c.subtitle}</p>
      </div>
    </Link>
  );
}

function GroupSection({
  title,
  blurb,
  characters,
}: {
  title: string;
  blurb: string;
  characters: Character[];
}) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl text-cream-100">{title}</h2>
      <p className="mt-2 max-w-2xl text-sage-400">{blurb}</p>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {characters.map((c) => (
          <CharacterCard key={c.slug} c={c} />
        ))}
      </div>
    </section>
  );
}

export default function CharactersPage() {
  const unnamed = unnamedCharacters();
  const books = [
    { slug: "mark", title: "The Gospel of Mark", live: true, count: CHARACTERS.length },
    { slug: "john", title: "The Gospel of John", live: false, count: 0 },
    { slug: "genesis", title: "Genesis", live: false, count: 0 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
        TruVINE
      </p>
      <h1 className="mt-2 font-display text-3xl text-cream-50 sm:text-4xl">
        Characters of the Bible
      </h1>
      <p className="mt-3 max-w-2xl font-scripture text-lg italic leading-relaxed text-sage-300">
        Every person Mark introduces — fishermen and rulers, the healed and the
        hurting. Each one met Jesus. Every fact below is from Scripture, with
        verse references.
      </p>

      {/* Book selector — future books slot in here */}
      <div className="mt-8 flex flex-wrap gap-3">
        {books.map((b) =>
          b.live ? (
            <span
              key={b.slug}
              className="rounded-full bg-gold-500 px-5 py-2 text-sm font-semibold text-vineyard-950"
            >
              {b.title} · {b.count}
            </span>
          ) : (
            <span
              key={b.slug}
              className="rounded-full border border-gold-500/25 px-5 py-2 text-sm text-sage-400"
            >
              {b.title} · coming soon
            </span>
          )
        )}
      </div>

      {CHARACTER_GROUPS.map((g) => (
        <GroupSection
          key={g.id}
          title={g.title}
          blurb={g.blurb}
          characters={CHARACTERS.filter((c) => c.group === g.id)}
        />
      ))}

      {/* The Unnamed collection */}
      <section className="mt-14 overflow-hidden rounded-2xl border border-gold-500/25 bg-gradient-to-br from-vineyard-900 to-vineyard-800 p-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
          A collection of its own
        </p>
        <h2 className="mt-2 font-display text-2xl text-cream-50 sm:text-3xl">
          The Unnamed
        </h2>
        <p className="mt-3 max-w-2xl font-scripture text-lg italic leading-relaxed text-sage-300">
          Scripture never gives them names — the demoniac, the widow with two
          coins, the boy with the loaves, the thief on the cross. Their stories
          carry great meaning anyway. God works through willing hearts, not
          famous ones.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {unnamed.map((c) => (
            <CharacterCard key={c.slug} c={c} />
          ))}
        </div>
      </section>
    </div>
  );
}
