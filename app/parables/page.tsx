import { Metadata } from "next";
import ParableAudio from "@/components/ParableAudio";
import ParablePanel from "@/components/ParablePanel";
import VideoComing from "@/components/VideoComing";

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
  /** Cards whose films don't exist yet have no real frame to show:
   *  they carry the branded ParablePanel in the art slot instead of
   *  a card image (never generated or faked scene art). */
  panel?: boolean;
  /** Jason's rule, amended by Jason (Oct 27, 2026 evening): every card
   *  carries the Teddy audio; a card whose film isn't published yet
   *  stands with a branded "Video coming" placeholder in the film's
   *  place (components/VideoComing.tsx) until the film is published
   *  and wired — then videoId is added and the placeholder retires. */
  /** The two doors (Jason, Oct 27, 2026): every card links to its source —
   *  the Gospel chapter it lives in, and its own page in the Parables of
   *  Jesus book where that book carries the parable. */
  gospel: string;
  gospelHref: string;
  parablesHref?: string;
}

/** All 40 parables stand on this page (Jason, Oct 27, 2026), in the
 *  master list's order: the Sower first, the True Vine second, then
 *  biblical order. Every card carries its Teddy reading — the first
 *  nineteen from the film batch and R2, the Net and the Two Sons cut
 *  from their chapter masters, and nineteen more cut passage by
 *  passage from the chapter masters — every cut gated word-for-word
 *  against the app's own text before it was allowed to stand. */
const PARABLES: Parable[] = [
  { slug: "sower", title: "The Sower", ref: "Matthew 13:3–9", videoId: "2GF8AFwXDp0", gospel: "Matthew 13", gospelHref: "/book/matthew/12", parablesHref: "/book/parables/1" },
  { slug: "true-vine", title: "I Am the True Vine", ref: "John 15:1–8", videoId: "-2vOTb-puBw", audioSrc: "/audio/parables/true-vine.mp3", gospel: "John 15", gospelHref: "/book/john/14" },
  { slug: "wheat-and-tares", title: "The Wheat and the Tares", ref: "Matthew 13:24–30", videoId: "2WrO7EEckM8", gospel: "Matthew 13", gospelHref: "/book/matthew/12", parablesHref: "/book/parables/6" },
  { slug: "mustard-seed", title: "The Mustard Seed", ref: "Matthew 13:31–32", videoId: "uLQlOIS864I", gospel: "Matthew 13", gospelHref: "/book/matthew/12", parablesHref: "/book/parables/7" },
  { slug: "leaven", title: "The Leaven", ref: "Matthew 13:33", videoId: "HH3SRIZO9ww", audioSrc: "/audio/parables/leaven.mp3", gospel: "Matthew 13", gospelHref: "/book/matthew/12", parablesHref: "/book/parables/10" },
  { slug: "hidden-treasure", title: "The Hidden Treasure", ref: "Matthew 13:44", videoId: "9od-dL2sgWY", gospel: "Matthew 13", gospelHref: "/book/matthew/12", parablesHref: "/book/parables/8" },
  { slug: "pearl-of-great-price", title: "The Pearl of Great Price", ref: "Matthew 13:45–46", videoId: "bxtra5KWcmI", gospel: "Matthew 13", gospelHref: "/book/matthew/12", parablesHref: "/book/parables/9" },
  { slug: "net", title: "The Net", ref: "Matthew 13:47–50", audioSrc: "/audio/parables/net.mp3", gospel: "Matthew 13", gospelHref: "/book/matthew/12", parablesHref: "/book/parables/11" },
  { slug: "unforgiving-servant", title: "The Unforgiving Servant", ref: "Matthew 18:23–35", gospel: "Matthew 18", gospelHref: "/book/matthew/17", parablesHref: "/book/parables/13" },
  { slug: "workers-in-the-vineyard", title: "The Workers in the Vineyard", ref: "Matthew 20:1–16", gospel: "Matthew 20", gospelHref: "/book/matthew/19", parablesHref: "/book/parables/14" },
  { slug: "two-sons", title: "The Two Sons", ref: "Matthew 21:28–32", audioSrc: "/audio/parables/two-sons.mp3", gospel: "Matthew 21", gospelHref: "/book/matthew/20", parablesHref: "/book/parables/15" },
  { slug: "wicked-tenants", title: "The Wicked Tenants", ref: "Matthew 21:33–46", audioSrc: "/audio/parables/wicked-tenants.mp3", panel: true, gospel: "Matthew 21", gospelHref: "/book/matthew/20", parablesHref: "/book/parables/16" },
  { slug: "wedding-feast", title: "The Wedding Feast", ref: "Matthew 22:1–14", gospel: "Matthew 22", gospelHref: "/book/matthew/21", parablesHref: "/book/parables/17" },
  { slug: "ten-virgins", title: "The Ten Virgins", ref: "Matthew 25:1–13", gospel: "Matthew 25", gospelHref: "/book/matthew/24", parablesHref: "/book/parables/20" },
  { slug: "talents", title: "The Talents", ref: "Matthew 25:14–30", gospel: "Matthew 25", gospelHref: "/book/matthew/24" },
  { slug: "sheep-and-the-goats", title: "The Sheep and the Goats", ref: "Matthew 25:31–46", audioSrc: "/audio/parables/sheep-and-the-goats.mp3", panel: true, gospel: "Matthew 25", gospelHref: "/book/matthew/24" },
  { slug: "growing-seed", title: "The Growing Seed", ref: "Mark 4:26–29", audioSrc: "/audio/parables/growing-seed.mp3", panel: true, gospel: "Mark 4", gospelHref: "/book/mark/3", parablesHref: "/book/parables/25" },
  { slug: "good-samaritan", title: "The Good Samaritan", ref: "Luke 10:30–37", videoId: "SvzeYQRektk", gospel: "Luke 10", gospelHref: "/book/luke/9", parablesHref: "/book/parables/33" },
  { slug: "friend-at-midnight", title: "The Friend at Midnight", ref: "Luke 11:5–8", audioSrc: "/audio/parables/friend-at-midnight.mp3", panel: true, gospel: "Luke 11", gospelHref: "/book/luke/10", parablesHref: "/book/parables/32" },
  { slug: "rich-fool", title: "The Rich Fool", ref: "Luke 12:16–21", gospel: "Luke 12", gospelHref: "/book/luke/11", parablesHref: "/book/parables/34" },
  { slug: "watchful-servants", title: "The Watchful Servants", ref: "Luke 12:35–40", audioSrc: "/audio/parables/watchful-servants.mp3", panel: true, gospel: "Luke 12", gospelHref: "/book/luke/11" },
  { slug: "faithful-servant", title: "The Faithful Servant", ref: "Luke 12:42–48", audioSrc: "/audio/parables/faithful-servant.mp3", panel: true, gospel: "Luke 12", gospelHref: "/book/luke/11", parablesHref: "/book/parables/19" },
  { slug: "barren-fig-tree", title: "The Barren Fig Tree", ref: "Luke 13:6–9", audioSrc: "/audio/parables/barren-fig-tree.mp3", panel: true, gospel: "Luke 13", gospelHref: "/book/luke/12", parablesHref: "/book/parables/35" },
  { slug: "great-banquet", title: "The Great Banquet", ref: "Luke 14:15–24", audioSrc: "/audio/parables/great-banquet.mp3", panel: true, gospel: "Luke 14", gospelHref: "/book/luke/13" },
  { slug: "cost-of-discipleship", title: "The Cost of Discipleship (Tower & King)", ref: "Luke 14:28–33", audioSrc: "/audio/parables/cost-of-discipleship.mp3", panel: true, gospel: "Luke 14", gospelHref: "/book/luke/13" },
  { slug: "lost-sheep", title: "The Lost Sheep", ref: "Luke 15:4–7", gospel: "Luke 15", gospelHref: "/book/luke/14", parablesHref: "/book/parables/12" },
  { slug: "lost-coin", title: "The Lost Coin", ref: "Luke 15:8–10", audioSrc: "/audio/parables/lost-coin.mp3", panel: true, gospel: "Luke 15", gospelHref: "/book/luke/14", parablesHref: "/book/parables/37" },
  { slug: "prodigal-son", title: "The Prodigal Son", ref: "Luke 15:11–32", videoId: "7CkIfYz21lw", gospel: "Luke 15", gospelHref: "/book/luke/14", parablesHref: "/book/parables/38" },
  { slug: "shrewd-manager", title: "The Shrewd Manager", ref: "Luke 16:1–13", gospel: "Luke 16", gospelHref: "/book/luke/15" },
  { slug: "rich-man-and-lazarus", title: "The Rich Man and Lazarus", ref: "Luke 16:19–31", gospel: "Luke 16", gospelHref: "/book/luke/15", parablesHref: "/book/parables/39" },
  { slug: "persistent-widow", title: "The Persistent Widow", ref: "Luke 18:1–8", audioSrc: "/audio/parables/persistent-widow.mp3", panel: true, gospel: "Luke 18", gospelHref: "/book/luke/17", parablesHref: "/book/parables/40" },
  { slug: "pharisee-and-tax-collector", title: "The Pharisee and the Tax Collector", ref: "Luke 18:9–14", gospel: "Luke 18", gospelHref: "/book/luke/17", parablesHref: "/book/parables/41" },
  { slug: "minas", title: "The Minas (Pounds)", ref: "Luke 19:11–27", audioSrc: "/audio/parables/minas.mp3", panel: true, gospel: "Luke 19", gospelHref: "/book/luke/18" },
  { slug: "two-debtors", title: "The Two Debtors", ref: "Luke 7:41–43", audioSrc: "/audio/parables/two-debtors.mp3", panel: true, gospel: "Luke 7", gospelHref: "/book/luke/6" },
  { slug: "children-in-the-marketplace", title: "The Children in the Marketplace", ref: "Luke 7:31–35", audioSrc: "/audio/parables/children-in-the-marketplace.mp3", panel: true, gospel: "Luke 7", gospelHref: "/book/luke/6" },
  { slug: "lamp-under-a-basket", title: "The Lamp Under a Basket", ref: "Mark 4:21–25", audioSrc: "/audio/parables/lamp-under-a-basket.mp3", panel: true, gospel: "Mark 4", gospelHref: "/book/mark/3", parablesHref: "/book/parables/21" },
  { slug: "house-on-the-rock", title: "The House on the Rock", ref: "Matthew 7:24–27", audioSrc: "/audio/parables/house-on-the-rock.mp3", panel: true, gospel: "Matthew 7", gospelHref: "/book/matthew/6" },
  { slug: "new-wine-in-old-wineskins", title: "The New Wine in Old Wineskins", ref: "Matthew 9:16–17", audioSrc: "/audio/parables/new-wine-in-old-wineskins.mp3", panel: true, gospel: "Matthew 9", gospelHref: "/book/matthew/8", parablesHref: "/book/parables/4" },
  { slug: "pruning", title: "The Pruning (Abiding)", ref: "John 15:2", audioSrc: "/audio/parables/pruning.mp3", panel: true, gospel: "John 15", gospelHref: "/book/john/14" },
  { slug: "good-shepherd", title: "The Good Shepherd", ref: "John 10:1–18", audioSrc: "/audio/parables/good-shepherd.mp3", panel: true, gospel: "John 10", gospelHref: "/book/john/9" },
];

const BASE = "https://pub-4ff11efe5fbe4087acc9ff74fc56f179.r2.dev";

/** The Bible Heartbeat target for a parable's audio: the source
 *  Gospel chapter the card's "Read in {Gospel} →" door points to —
 *  playing the parable counts as listening to that chapter (Jason,
 *  Oct 27, 2026). gospelHref is "/book/<slug>/<idx>" with a 0-based
 *  chapter index; the heartbeat counts by 1-based chapter number. */
function beatTarget(gospelHref: string): { bookSlug: string; chapterNum: number } {
  const parts = gospelHref.split("/");
  return { bookSlug: parts[2], chapterNum: Number(parts[3]) + 1 };
}

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
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sage-400">
        Every parable here can be heard in Grandpa Teddy&rsquo;s voice.{" "}
        {PARABLES.filter((p) => p.videoId).length} also have their film
        today; the other {PARABLES.filter((p) => !p.videoId).length} are
        marked &ldquo;Video coming&rdquo; while their films are being
        finished.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PARABLES.map((p) => (
          <div
            key={p.slug}
            className="overflow-hidden rounded-2xl border border-gold-500/15 bg-vineyard-900"
          >
            <div className="aspect-[2/1] w-full overflow-hidden">
              {p.panel ? (
                <ParablePanel title={p.title} refText={p.ref} />
              ) : (
                <img
                  src={`/images/parable-${p.slug}-card.jpg`}
                  alt={`${p.title} parable illustration`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
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
              {p.videoId ? (
                <div className="mt-3 aspect-video overflow-hidden rounded-xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${p.videoId}`}
                    title={`${p.title} — Parable Short`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <VideoComing title={p.title} />
              )}
              <ParableAudio
                src={p.audioSrc ?? `${BASE}/audio/parables/${p.slug}.mp3`}
                {...beatTarget(p.gospelHref)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
