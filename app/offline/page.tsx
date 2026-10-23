import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline",
  description:
    "You're offline. Word of God Risen will be right here when the connection returns.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <Image
        src="/images/truvine-emblem.png"
        alt="TruVINE emblem"
        width={96}
        height={68}
        className="mx-auto h-auto w-24 object-contain"
      />
      <h1 className="mt-6 font-display text-3xl text-cream-50">
        You&rsquo;re offline — and that&rsquo;s all right
      </h1>
      <p className="mt-4 font-scripture text-lg leading-relaxed text-cream-100/90">
        The connection has stepped away for a moment. Any chapter you opened
        while you were connected may still be here for you — and the moment
        you&rsquo;re back online, the whole Bible is, too: every chapter,
        read aloud by Grandpa Teddy, free as always.
      </p>
      <p className="mt-6">
        <Link href="/" className="text-gold-300 underline">
          Try the front door again →
        </Link>
      </p>
    </div>
  );
}
