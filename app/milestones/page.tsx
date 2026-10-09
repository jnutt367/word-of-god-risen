import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ministry Milestones",
  description:
    "Watch the TruVINE ministry grow — YouTube subscribers, Bible app readers, videos published, and every milestone along the way. Centered on the King, not the crowds.",
  alternates: { canonical: "/milestones" },
};

// Current numbers — updated monthly
// Subscribers: from YouTube Studio | Visitors: from Vercel Analytics
const MILESTONES = {
  subscribers: 700,
  subscriberGoal: 1000,
  // Monthly history (newest last)
  history: [
    { month: "Oct 2026", subscribers: 700, note: "Matthew funnel launches, 53 new subs in one day" },
  ],
  // Ecosystem stats
  videosPublished: 343,
  shortsPublished: 15,
  booksWithOverviews: 8,
  parableShorts: 17,
  audioChapters: 1503,
};

export default function MilestonesPage() {
  const { subscribers, subscriberGoal, history, videosPublished, shortsPublished, booksWithOverviews, parableShorts, audioChapters } = MILESTONES;
  const progress = Math.round((subscribers / subscriberGoal) * 100);
  const remaining = subscriberGoal - subscribers;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
        Ministry Milestones
      </p>
      <h1 className="mt-2 font-display text-3xl text-cream-50 sm:text-4xl">
        Growing together
      </h1>

      <div className="mt-6 space-y-4 font-scripture text-lg leading-relaxed text-cream-100/90">
        <p>
          This is the story of what God is building through TruVINE — told in
          numbers, but driven by hearts. Every subscriber is a person. Every
          view is a moment with the Word.
        </p>
      </div>

      {/* Subscriber progress */}
      <div className="mt-10 rounded-2xl border border-gold-500/15 bg-vineyard-900 p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl text-cream-100">
            YouTube Family
          </h2>
          <p className="text-sm text-sage-400">
            <a
              href="https://www.youtube.com/@TruVINE365"
              className="text-gold-300 underline"
            >
              @TruVINE365
            </a>
          </p>
        </div>
        <p className="mt-4 font-display text-5xl text-gold-300">
          {subscribers.toLocaleString()}
        </p>
        <p className="mt-1 text-sm text-sage-400">
          subscribers — {remaining} to go until {subscriberGoal.toLocaleString()}
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-vineyard-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-sage-500">{progress}% of the way to {subscriberGoal.toLocaleString()}</p>
      </div>

      {/* Ecosystem */}
      <div className="mt-8">
        <h2 className="font-display text-xl text-cream-100">
          The ecosystem we&apos;re building
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gold-500/10 bg-vineyard-900/60 p-4">
            <p className="font-display text-3xl text-cream-50">{videosPublished}</p>
            <p className="mt-1 text-xs text-sage-400">Videos published</p>
          </div>
          <div className="rounded-xl border border-gold-500/10 bg-vineyard-900/60 p-4">
            <p className="font-display text-3xl text-cream-50">{shortsPublished}</p>
            <p className="mt-1 text-xs text-sage-400">Shorts live</p>
          </div>
          <div className="rounded-xl border border-gold-500/10 bg-vineyard-900/60 p-4">
            <p className="font-display text-3xl text-cream-50">{booksWithOverviews}</p>
            <p className="mt-1 text-xs text-sage-400">Book overviews</p>
          </div>
          <div className="rounded-xl border border-gold-500/10 bg-vineyard-900/60 p-4">
            <p className="font-display text-3xl text-cream-50">{parableShorts}</p>
            <p className="mt-1 text-xs text-sage-400">Parable Shorts</p>
          </div>
          <div className="rounded-xl border border-gold-500/10 bg-vineyard-900/60 p-4">
            <p className="font-display text-3xl text-cream-50">{audioChapters.toLocaleString()}</p>
            <p className="mt-1 text-xs text-sage-400">Audio chapters</p>
          </div>
          <div className="rounded-xl border border-gold-500/10 bg-vineyard-900/60 p-4">
            <p className="font-display text-3xl text-cream-50">78</p>
            <p className="mt-1 text-xs text-sage-400">Books in the reader</p>
          </div>
        </div>
      </div>

      {/* Journey */}
      <div className="mt-10">
        <h2 className="font-display text-xl text-cream-100">The journey</h2>
        <div className="mt-4 space-y-4">
          {history.map((entry) => (
            <div
              key={entry.month}
              className="rounded-xl border border-gold-500/10 bg-vineyard-900/40 p-4"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold text-gold-300">{entry.month}</p>
                <p className="font-display text-2xl text-cream-50">
                  {entry.subscribers.toLocaleString()}
                </p>
              </div>
              <p className="mt-1 text-sm text-sage-400">{entry.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="vine-divider my-10" aria-hidden="true">
        <span>✦</span>
      </div>

      <div className="space-y-4 font-scripture text-lg leading-relaxed text-cream-100/90">
        <p>
          &ldquo;And we know that in all things God works for the good of those
          who love him, who have been called according to his purpose.&rdquo;
          (Romans 8:28)
        </p>
        <p className="text-base text-sage-400">
          Updated monthly. Centered on the King, not the crowds.
        </p>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-sm text-sage-300 hover:text-gold-300">
          ← Back to the reader
        </Link>
      </div>
    </div>
  );
}
