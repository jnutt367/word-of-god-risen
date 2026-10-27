import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parables of Jesus · Word of God Risen",
  description: "Listen to the parables of Jesus in Grandpa Teddy's voice — the Sower, the Prodigal Son, the Good Samaritan, and more.",
};

interface Parable {
  slug: string;
  title: string;
  ref: string;
  videoId?: string;
  audioSrc?: string;
  /** Jason's rule (Oct 27, 2026): a card shows only when it has BOTH the
   *  Teddy audio and the film. Parked cards keep their data here and come
   *  back the moment their film is published and wired. */
  parked?: boolean;
  /** The two doors (Jason, Oct 27, 2026): every card links to its source —
   *  the Gospel chapter it lives in, and its own page in the Parables of
   *  Jesus book where that book carries the parable. */
  gospel: string;
  gospelHref: string;
  parablesHref?: string;
}

const PARABLES: Parable[] = [
  { slug: "sower", title: "The Sower", ref: "Matthew 13:3–9", videoId: "2GF8AFwXDp0", gospel: "Matthew 13", gospelHref: "/book/matthew/12", parablesHref: "/book/parables/1" },
  { slug: "true-vine", title: "I Am the True Vine", ref: "John 15:1–8", videoId: "-2vOTb-puBw", audioSrc: "/audio/parables/true-vine.mp3", gospel: "John 15", gospelHref: "/book/john/14" },
  { slug: "wheat-and-tares", title: "The Wheat and the Tares", ref: "Matthew 13:24–30", videoId: "2WrO7EEckM8", gospel: "Matthew 13", gospelHref: "/book/matthew/12", parablesHref: "/book/parables/6" },
  { slug: "mustard-seed", title: "The Mustard Seed", ref: "Matthew 13:31–32", videoId: "uLQlOIS864I", gospel: "Matthew 13", gospelHref: "/book/matthew/12", parablesHref: "/book/parables/7" },
  { slug: "leaven", title: "The Leaven", ref: "Matthew 13:33", videoId: "HH3SRIZO9ww", audioSrc: "/audio/parables/leaven.mp3", gospel: "Matthew 13", gospelHref: "/book/matthew/12", parablesHref: "/book/parables/10" },
  { slug: "hidden-treasure", title: "The Hidden Treasure", ref: "Matthew 13:44", videoId: "9od-dL2sgWY", gospel: "Matthew 13", gospelHref: "/book/matthew/12", parablesHref: "/book/parables/8" },
  { slug: "pearl-of-great-price", title: "The Pearl of Great Price", ref: "Matthew 13:45–46", videoId: "bxtra5KWcmI", gospel: "Matthew 13", gospelHref: "/book/matthew/12", parablesHref: "/book/parables/9" },
  { slug: "unforgiving-servant", title: "The Unforgiving Servant", ref: "Matthew 18:23–35", parked: true, gospel: "Matthew 18", gospelHref: "/book/matthew/17", parablesHref: "/book/parables/13" },
  { slug: "workers-in-the-vineyard", title: "The Workers in the Vineyard", ref: "Matthew 20:1–16", parked: true, gospel: "Matthew 20", gospelHref: "/book/matthew/19", parablesHref: "/book/parables/14" },
  { slug: "wedding-feast", title: "The Wedding Feast", ref: "Matthew 22:1–14", parked: true, gospel: "Matthew 22", gospelHref: "/book/matthew/21", parablesHref: "/book/parables/17" },
  { slug: "ten-virgins", title: "The Ten Virgins", ref: "Matthew 25:1–13", parked: true, gospel: "Matthew 25", gospelHref: "/book/matthew/24", parablesHref: "/book/parables/20" },
  { slug: "talents", title: "The Talents", ref: "Matthew 25:14–30", parked: true, gospel: "Matthew 25", gospelHref: "/book/matthew/24" },
  { slug: "good-samaritan", title: "The Good Samaritan", ref: "Luke 10:30–37", videoId: "SvzeYQRektk", gospel: "Luke 10", gospelHref: "/book/luke/9", parablesHref: "/book/parables/33" },
  { slug: "rich-fool", title: "The Rich Fool", ref: "Luke 12:16–21", parked: true, gospel: "Luke 12", gospelHref: "/book/luke/11", parablesHref: "/book/parables/34" },
  { slug: "lost-sheep", title: "The Lost Sheep", ref: "Luke 15:4–7", parked: true, gospel: "Luke 15", gospelHref: "/book/luke/14", parablesHref: "/book/parables/12" },
  { slug: "prodigal-son", title: "The Prodigal Son", ref: "Luke 15:11–32", videoId: "7CkIfYz21lw", gospel: "Luke 15", gospelHref: "/book/luke/14", parablesHref: "/book/parables/38" },
  { slug: "shrewd-manager", title: "The Shrewd Manager", ref: "Luke 16:1–13", parked: true, gospel: "Luke 16", gospelHref: "/book/luke/15" },
  { slug: "rich-man-and-lazarus", title: "The Rich Man and Lazarus", ref: "Luke 16:19–31", parked: true, gospel: "Luke 16", gospelHref: "/book/luke/15", parablesHref: "/book/parables/39" },
  { slug: "pharisee-and-tax-collector", title: "The Pharisee and the Tax Collector", ref: "Luke 18:9–14", parked: true, gospel: "Luke 18", gospelHref: "/book/luke/17", parablesHref: "/book/parables/41" },
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
            src="https://www.youtube.com/embed/QCF-t91FnQE"
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
        {PARABLES.filter((p) => !p.parked).map((p) => (
          <div
            key={p.slug}
            className="overflow-hidden rounded-2xl border border-gold-500/15 bg-vineyard-900"
          >
            <div className="aspect-[2/1] w-full overflow-hidden">
              <img
                src={`/images/parable-${p.slug}-card.jpg`}
                alt={`${p.title} parable illustration`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-5">
              <h2 className="font-display text-xl text-cream-100">{p.title}</h2>
              <p className="mt-1 text-sm text-sage-400">{p.ref}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <a
                  href={p.gospelHref}
                  className="text-gold-400 underline underline-offset-4 hover:text-gold-300"
                >
                  Read in {p.gospel} →
                </a>
                {p.parablesHref ? (
                  <a
                    href={p.parablesHref}
                    className="text-gold-400 underline underline-offset-4 hover:text-gold-300"
                  >
                    This parable on its own page →
                  </a>
                ) : null}
              </div>
              {"videoId" in p && p.videoId ? (
                <div className="mt-3 aspect-video overflow-hidden rounded-xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${p.videoId}`}
                    title={`${p.title} — Parable Short`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              ) : null}
              <audio
                controls
                preload="none"
                src={p.audioSrc ?? `${BASE}/audio/parables/${p.slug}.mp3`}
                className="mt-3 w-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
