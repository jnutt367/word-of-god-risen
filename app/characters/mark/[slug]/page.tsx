import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { existsSync } from "fs";
import { join } from "path";
import { CHARACTERS, getCharacter } from "@/data/characters";
import InlineMd from "@/components/InlineMd";

// Printify store URL — set when the trading card products go live.
const PRINTIFY_STORE_URL = "";

function cardImages(slug: string): { front: string; back: string } | null {
  const front = `/images/cards/${slug}-front.jpg`;
  const back = `/images/cards/${slug}-back.jpg`;
  const pub = join(process.cwd(), "public");
  if (existsSync(join(pub, front)) && existsSync(join(pub, back))) {
    return { front, back };
  }
  return null;
}

export function generateStaticParams() {
  return CHARACTERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getCharacter(slug);
  if (!c) return { title: "Character" };
  return {
    title: `${c.name} · Characters · Word of God Risen`,
    description: `${c.name} — ${c.subtitle}. Key moments from the Gospel of Mark with verse references.`,
  };
}

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getCharacter(slug);
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/characters"
        className="text-sm font-medium text-gold-300 hover:text-gold-400"
      >
        ← All characters
      </Link>

      <div className="mt-6 grid gap-8 sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] sm:items-start">
        <div>
          <div className="overflow-hidden rounded-2xl border border-gold-500/20">
            {c.image ? (
              <img src={c.image} alt={c.name} className="w-full object-cover" />
            ) : null}
          </div>
          {c.caption ? (
            <p className="mt-3 font-scripture text-sm italic leading-relaxed text-sage-400">
              {c.caption}
            </p>
          ) : null}
        </div>

        <div>
          <h1 className="font-display text-3xl text-cream-50 sm:text-4xl">
            {c.name}
          </h1>
          <p className="mt-2 text-lg text-gold-300">{c.subtitle}</p>
          {c.unnamed && (
            <p className="mt-3 inline-block rounded-full border border-gold-500/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-300">
              Scripture gives no name
            </p>
          )}
        </div>
      </div>

      {/* Key moments */}
      <section className="mt-10">
        <h2 className="font-display text-2xl text-cream-100">
          In Mark&rsquo;s Gospel
        </h2>
        <ul className="mt-4 space-y-4">
          {c.facts.map((f, i) => (
            <li
              key={i}
              className="rounded-xl border border-gold-500/15 bg-vineyard-900 p-4 sm:p-5"
            >
              <p className="leading-relaxed text-cream-100">
                <InlineMd text={f.text} />
              </p>
              {f.ref ? (
                <p className="mt-2 text-sm font-medium text-gold-300">{f.ref}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {/* Personality */}
      {c.personality.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl text-cream-100">
            Who they were
          </h2>
          <ul className="mt-4 space-y-3">
            {c.personality.map((p, i) => (
              <li key={i} className="flex gap-3 leading-relaxed text-sage-300">
                <span aria-hidden="true" className="mt-1 text-gold-400">
                  ✦
                </span>
                <span>
                  <InlineMd text={p} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Read in Scripture */}
      {c.chapters.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl text-cream-100">
            Read about them
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {c.chapters.map((ch) => (
              <Link
                key={ch}
                href={`/book/mark/${ch - 1}`}
                className="rounded-full border border-gold-500/30 px-4 py-2 text-sm font-medium text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300"
              >
                Mark {ch}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trading card showcase */}
      {(() => {
        const card = cardImages(slug);
        if (!card) return null;
        return (
          <section className="mt-10">
            <h2 className="font-display text-2xl text-cream-100">
              Trading Card
            </h2>
            <p className="mt-2 max-w-2xl leading-relaxed text-sage-400">
              A keepsake of {c.name}&rsquo;s story — the portrait on the
              front, the key moments on the back.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 sm:gap-8">
              <figure>
                <div className="overflow-hidden rounded-2xl border border-gold-500/20 shadow-lg shadow-black/30">
                  <img
                    src={card.front}
                    alt={`${c.name} trading card — front`}
                    loading="lazy"
                    className="w-full"
                  />
                </div>
                <figcaption className="mt-2 text-center text-xs uppercase tracking-[0.18em] text-sage-500">
                  Front
                </figcaption>
              </figure>
              <figure>
                <div className="overflow-hidden rounded-2xl border border-gold-500/20 shadow-lg shadow-black/30">
                  <img
                    src={card.back}
                    alt={`${c.name} trading card — back`}
                    loading="lazy"
                    className="w-full"
                  />
                </div>
                <figcaption className="mt-2 text-center text-xs uppercase tracking-[0.18em] text-sage-500">
                  Back
                </figcaption>
              </figure>
            </div>
            <div className="mt-6">
              {PRINTIFY_STORE_URL ? (
                <a
                  href={PRINTIFY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gold-300 underline decoration-gold-500/40 underline-offset-4 transition-colors hover:text-gold-400"
                >
                  Available in the TruVINE store
                </a>
              ) : (
                <p className="text-sm italic text-sage-500">
                  Trading cards coming soon to the TruVINE store.
                </p>
              )}
            </div>
          </section>
        );
      })()}

      <p className="mt-10 border-t border-gold-500/15 pt-6 font-scripture text-sm italic text-sage-500">
        Every claim above is from Scripture unless labeled &ldquo;Tradition.&rdquo;
        Depictions are checked against the WEB text on this site.
      </p>
    </div>
  );
}
