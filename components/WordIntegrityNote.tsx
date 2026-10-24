/**
 * The Word Integrity note — a calm, standing promise to every reader:
 * the accuracy of God's Word is valued here, every Grandpa Teddy
 * reading is being checked against the written Word word for word,
 * and a recording that doesn't match comes down right away.
 *
 * Jason's direction (Oct 23, 2026): app users should KNOW this —
 * wherever in the world they are reading from.
 *
 * Honesty rule for this copy: the full-library check is IN PROGRESS,
 * so the wording stays present-continuous — "we are checking" —
 * never a claim that every chapter has already passed. No numbers.
 *
 * Like OpenDoor, this component is deliberately inert: no client
 * JavaScript, no fetch, nothing gathered. It leads the homepage —
 * the first content after the hero, moved up Oct 23, 2026 so a
 * visitor meets it before the books and the map — and is mirrored
 * on the About page (bare = no outer page-frame, for embedding in
 * About's narrower container), where chapter pages link to it at
 * /about#word-integrity.
 */
export default function WordIntegrityNote({
  bare = false,
}: {
  bare?: boolean;
}) {
  const card = (
    <section
      aria-labelledby="word-integrity-heading"
      className="rounded-2xl border border-gold-500/15 bg-vineyard-900 px-6 py-8 sm:px-10"
    >
      <p className="text-center font-display text-lg text-gold-300" aria-hidden="true">
        ✦
      </p>
      <h2
        id="word-integrity-heading"
        className="mt-2 text-center font-display text-2xl text-cream-50 sm:text-3xl"
      >
        Word Integrity — Checked Word for Word
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center leading-relaxed text-cream-100/85">
        The accuracy of God&rsquo;s Word matters here. We are checking
        every Grandpa Teddy reading against the written Word, word for
        word. If a chapter doesn&rsquo;t match, Teddy&rsquo;s recording
        comes down right away and a backup voice reads the chapter until
        a corrected reading passes the check.
      </p>
      <p className="mx-auto mt-3 max-w-xl text-center leading-relaxed text-cream-100/85">
        If you hear something that sounds wrong, tap &lsquo;Something
        sounds wrong&rsquo; — wherever you are in the world, we act first
        and verify right away.
      </p>
    </section>
  );

  if (bare) return card;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-4 pt-2 sm:px-6">{card}</div>
  );
}
