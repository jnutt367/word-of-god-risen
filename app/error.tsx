"use client";

import { useEffect } from "react";
import Link from "next/link";
import BuildersArt from "@/components/BuildersArt";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <BuildersArt />

      <p className="mt-10 text-sm font-semibold uppercase tracking-[0.22em] text-gold-300">
        Something went wrong
      </p>
      <h1 className="mt-4 font-display text-4xl leading-tight text-cream-50 sm:text-5xl">
        Something on the farm broke — we&rsquo;re on it.
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg text-sage-300">
        Give it another try — the crew has its tools out. And if it keeps
        acting up, the porch light&rsquo;s always on at home.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-400"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-cream-100/25 px-6 py-3 text-sm font-semibold text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-300"
        >
          Back to the farm
        </Link>
      </div>
    </section>
  );
}
