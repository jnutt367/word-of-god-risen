import type { Metadata } from "next";
import Link from "next/link";
import HighlightsList from "@/components/HighlightsList";

export const metadata: Metadata = {
  title: "My Highlights — Word of God Risen",
  description:
    "Every verse you've highlighted, gathered in one place — kept on your phone only. Tap a verse in any chapter to mark it.",
};

export default function HighlightsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center text-sm font-medium text-sage-300 transition-colors hover:text-gold-300"
      >
        ← Home
      </Link>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
        Kept on this phone
      </p>
      <h1 className="mt-1 font-display text-3xl text-cream-100 sm:text-4xl">
        My <span className="text-truvine-gradient">Highlights</span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sage-300">
        The verses that spoke to you, gathered in one place — like the
        marked pages of a well-loved Bible. They live on this phone
        alone: no account, nothing sent anywhere.
      </p>
      <div className="mt-8">
        <HighlightsList />
      </div>
    </main>
  );
}
