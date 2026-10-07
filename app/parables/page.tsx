import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parables of Jesus · Word of God Risen",
  description: "Listen to the parables of Jesus in Grandpa Teddy's voice — the Sower, the Prodigal Son, the Good Samaritan, and more.",
};

const PARABLES = [
  { slug: "sower", title: "The Sower", ref: "Matthew 13:3–9" },
  { slug: "wheat-and-tares", title: "The Wheat and the Tares", ref: "Matthew 13:24–30" },
  { slug: "mustard-seed", title: "The Mustard Seed", ref: "Matthew 13:31–32" },
  { slug: "hidden-treasure", title: "The Hidden Treasure", ref: "Matthew 13:44" },
  { slug: "pearl-of-great-price", title: "The Pearl of Great Price", ref: "Matthew 13:45–46" },
  { slug: "unforgiving-servant", title: "The Unforgiving Servant", ref: "Matthew 18:23–35" },
  { slug: "workers-in-the-vineyard", title: "The Workers in the Vineyard", ref: "Matthew 20:1–16" },
  { slug: "wedding-feast", title: "The Wedding Feast", ref: "Matthew 22:1–14" },
  { slug: "ten-virgins", title: "The Ten Virgins", ref: "Matthew 25:1–13" },
  { slug: "talents", title: "The Talents", ref: "Matthew 25:14–30" },
  { slug: "good-samaritan", title: "The Good Samaritan", ref: "Luke 10:30–37" },
  { slug: "rich-fool", title: "The Rich Fool", ref: "Luke 12:16–21" },
  { slug: "lost-sheep", title: "The Lost Sheep", ref: "Luke 15:4–7" },
  { slug: "prodigal-son", title: "The Prodigal Son", ref: "Luke 15:11–32" },
  { slug: "shrewd-manager", title: "The Shrewd Manager", ref: "Luke 16:1–13" },
  { slug: "rich-man-and-lazarus", title: "The Rich Man and Lazarus", ref: "Luke 16:19–31" },
  { slug: "pharisee-and-tax-collector", title: "The Pharisee and the Tax Collector", ref: "Luke 18:9–14" },
];

const BASE = "https://pub-4ff11efe5fbe4087acc9ff74fc56f179.r2.dev";

export default function ParablesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
        TruVINE
      </p>
      <h1 className="mt-2 font-display text-3xl text-cream-50 sm:text-4xl">
        Parables of Jesus
      </h1>
      <p className="mt-3 max-w-2xl font-scripture text-lg italic leading-relaxed text-sage-300">
        Earthly stories with heavenly meanings — read aloud in Grandpa Teddy's voice.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-gold-500/15 bg-vineyard-900">
        <div className="aspect-video">
          <iframe
            src="https://www.youtube.com/embed/sybue2EZMQI"
            title="Why Jesus Spoke in Parables"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
        <div className="p-5">
          <h2 className="font-display text-xl text-cream-100">
            Why Jesus Spoke in Parables
          </h2>
          <p className="mt-1 text-sm text-sage-400">
            Grandpa Teddy explains what parables are and why Jesus used them.
          </p>
        </div>
      </div>

      <h2 className="mt-10 font-display text-2xl text-cream-100">
        Listen to each parable
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {PARABLES.map((p) => (
          <div
            key={p.slug}
            className="rounded-2xl border border-gold-500/15 bg-vineyard-900 p-5"
          >
            <h2 className="font-display text-xl text-cream-100">{p.title}</h2>
            <p className="mt-1 text-sm text-sage-400">{p.ref}</p>
            <audio
              controls
              preload="none"
              src={`${BASE}/audio/parables/${p.slug}.mp3`}
              className="mt-3 w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
