import type { Metadata } from "next";
import ShortsGrid from "@/components/ShortsGrid";

export const metadata: Metadata = {
  title: "TruVINE Shorts",
  description:
    "Film clips from TruVINE's animated Gospel films — the canon cast, straight from the movies, searchable by word or verse.",
};

export default function ShortsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
        From the channel
      </p>
      <h1 className="mt-1 font-display text-3xl text-cream-100 sm:text-4xl">
        TruVINE <span className="text-truvine-gradient">Shorts</span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sage-300">
        Short clips from the animated Gospel films — every face here is one
        of the canon characters. Watch any of them right here, or{" "}
        <a
          href="https://www.youtube.com/@TruVINE365"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-300 underline decoration-gold-500/40 underline-offset-2 hover:text-gold-200"
        >
          visit the channel
        </a>
        .
      </p>
      <div className="mt-8">
        <ShortsGrid />
      </div>
    </main>
  );
}
