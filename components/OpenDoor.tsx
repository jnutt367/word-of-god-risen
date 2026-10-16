/**
 * The Open Door — a quiet card beside the Body Heartbeat, linking out
 * to the TruVINE Family Wall.
 *
 * The covenant it carries (Jason, crowned Oct 16, 2026): "Every sheep
 * counted — with a face and a name, by permission and by love." Every
 * face and name on the Wall is there by its owner's own yes; joining
 * is optional, the display name is the sender's choice, and being
 * counted without being shown — or held in prayer unseen — is honored
 * the same.
 *
 * This component is deliberately inert: a plain outbound link and
 * nothing more. No accounts, no tracking, no data collection, no
 * fetch, no client JavaScript — the door opens outward, and nothing
 * is gathered at the threshold.
 */
export default function OpenDoor() {
  return (
    <section
      aria-labelledby="open-door-heading"
      className="mx-auto max-w-6xl px-4 pb-4 pt-2 sm:px-6"
    >
      <div className="rounded-2xl border border-gold-500/15 bg-vineyard-900 px-6 py-8 text-center sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
          The Open Door
        </p>
        <h2
          id="open-door-heading"
          className="mt-2 font-display text-xl text-cream-50 sm:text-2xl"
        >
          The TruVINE Family Wall
        </h2>
        <p className="mx-auto mt-3 max-w-xl font-scripture italic text-cream-100/85">
          &ldquo;Every sheep counted — with a face and a name, by permission
          and by love.&rdquo;
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-sage-300">
          Faces and names from the family of faith, each one there by its
          owner&rsquo;s own yes. Come meet the family — and add yours only
          if you&rsquo;d like: by name, by a name you choose, or quietly,
          unseen. Your choice, always.
        </p>
        <p className="mt-5">
          <a
            href="https://jnutt367.github.io/truvine/family-wall/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg border border-cream-100/25 px-5 py-2.5 text-sm font-semibold text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300"
          >
            Visit the Family Wall
          </a>
        </p>
      </div>
    </section>
  );
}
