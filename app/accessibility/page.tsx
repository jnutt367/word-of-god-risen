import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "Word of God Risen is built to be read and heard by everyone — descriptive alt text on images, labeled buttons, visible keyboard focus, sane contrast, and listening built in. Audited and passed October 17, 2026.",
  alternates: { canonical: "/accessibility" },
};

const CHECKS: { title: string; body: string }[] = [
  {
    title: "Every picture is described",
    body: "Each meaningful image carries alt text that says what it shows. Purely decorative images are marked as decorative, so a screen reader passes over them instead of stumbling on them.",
  },
  {
    title: "Every button says what it does",
    body: "Buttons and controls are labeled in words — including the ones that show only an icon, like play, stop, share, and settings.",
  },
  {
    title: "Keyboard focus is always visible",
    body: "Move through any page with the Tab key and a gold ring shows you where you are. On the light “lamp” reading theme the ring turns a deeper amber so it stays easy to see.",
  },
  {
    title: "Text keeps a sane contrast",
    body: "Words are checked against their backgrounds in both reader themes — the dark vineyard night and the warm lamp light — so nothing important is whispered in a color too faint to read.",
  },
  {
    title: "Reading can be listening",
    body: "Every chapter can be heard, not only read: Grandpa Teddy’s narration where it exists, and your own device’s voices everywhere, with play, pause, seek, and speed controls — all labeled.",
  },
  {
    title: "Motion stays calm",
    body: "The site avoids busy movement, and its one gentle animation stops entirely for readers who prefer reduced motion.",
  },
];

export default function AccessibilityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
        Accessibility
      </p>
      <h1 className="mt-2 font-display text-3xl text-cream-50 sm:text-4xl">
        Built to be read — and heard — by everyone
      </h1>

      <div className="mt-8 space-y-6 font-scripture text-lg leading-relaxed text-cream-100/90">
        <p>
          The Word is for everybody, so this reader is too. Whether you read
          with your eyes, your ears, a keyboard, or a screen reader, this
          house was built with you in mind — calm, uncluttered, and easy to
          pick back up where you left off.
        </p>
      </div>

      <h2 className="mt-10 font-display text-2xl text-cream-50">
        What we check
      </h2>
      <div className="mt-5 space-y-4">
        {CHECKS.map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-gold-500/15 bg-vineyard-900 p-6"
          >
            <h3 className="font-display text-xl text-cream-50">{c.title}</h3>
            <p className="mt-2 leading-relaxed text-cream-100/90">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-gold-500/15 bg-vineyard-900 p-6">
        <h2 className="font-display text-xl text-cream-50">
          Audited, and kept that way
        </h2>
        <p className="mt-2 leading-relaxed text-cream-100/90">
          This site was audited against every check above and passed on
          October 17, 2026. Accessibility is a standing rule here, not a
          one-time project — each new page, picture, and button is held to
          the same standard before it is welcomed in.
        </p>
        <p className="mt-3 leading-relaxed text-cream-100/90">
          There are no accounts on this site, and nothing here tracks you as
          a person. Your reading progress lives only on your own device.
        </p>
        <p className="mt-3 leading-relaxed text-cream-100/90">
          If any part of this site is ever hard for you to read, hear, or
          use, please tell us at{" "}
          <a
            href="mailto:jnutt367@gmail.com"
            className="text-gold-300 underline"
          >
            jnutt367@gmail.com
          </a>{" "}
          — and we will make it right.
        </p>
      </div>
    </div>
  );
}
