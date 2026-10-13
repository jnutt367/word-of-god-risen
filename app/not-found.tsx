import type { Metadata } from "next";
import Link from "next/link";
import BuildersArt from "@/components/BuildersArt";
import BuildersSubline from "@/components/BuildersSubline";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "Well now — this path doesn't lead anywhere. The True Vine Construction Crew is fixing it; meanwhile, let us walk you home.",
};

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <BuildersArt />

      <p className="mt-10 text-sm font-semibold uppercase tracking-[0.22em] text-gold-300">
        404 · Off the path
      </p>
      <h1 className="mt-4 font-display text-4xl leading-tight text-cream-50 sm:text-5xl">
        Well now — this path doesn&rsquo;t lead anywhere.
      </h1>
      <BuildersSubline />

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400"
        >
          Back to the farm
        </Link>
        <Link
          href="/book/john/0"
          className="rounded-lg border border-cream-100/25 px-6 py-3 text-sm font-semibold text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300"
        >
          Start today&rsquo;s reading
        </Link>
      </div>

      <div className="vine-divider mx-auto mt-12 max-w-xs" aria-hidden="true">
        <span className="text-sm">✦</span>
      </div>
      <p className="mt-4 font-scripture text-base italic text-cream-100/80">
        &ldquo;Thy word is a lamp unto my feet, and a light unto my
        path.&rdquo; — Psalm 119:105
      </p>
    </section>
  );
}
