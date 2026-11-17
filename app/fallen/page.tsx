import type { Metadata } from "next";
import Link from "next/link";
import { FALLEN, FALLEN_STATUS_LINES, type FallenChamber } from "@/data/fallen";
import { ZoomOverlayButton } from "@/components/ZoomableImage";

export const metadata: Metadata = {
  title: "The Fallen · Word of God Risen",
  description:
    "The chiefs of the Watchers named in 1 Enoch 6, shown as the book leaves them — bound: Azazel in Dudael, the company in the valleys of the earth, the seven stars in the abyss. From the Book of Enoch, held next to Scripture, never as Scripture.",
  alternates: { canonical: "/fallen" },
};

function ChamberCard({ c }: { c: FallenChamber }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[#2b2e33] bg-[#0a0b0d]">
      <div className="relative aspect-square w-full overflow-hidden">
        <img
          src={c.image}
          alt={c.alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <ZoomOverlayButton
          src={c.imageTall}
          alt={c.alt}
          name={c.name}
          className="absolute right-2 top-2 z-10"
        />
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl leading-tight text-cream-50">
          {c.name}
        </h3>
        <p className="mt-1 font-scripture text-[15px] italic leading-relaxed text-[#b9bdc2]">
          {c.chamberLine}
        </p>
        {c.nameNote ? (
          <p className="mt-2 text-sm leading-relaxed text-[#8f959b]">
            {c.nameNote}
          </p>
        ) : null}
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7d838a]">
          {c.status === "collective" ? "What they did" : "What he did"}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-sage-300">{c.deed}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7d838a]">
          {c.status === "collective" ? "Their binding" : "His binding"}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-sage-300">{c.binding}</p>
        {c.echo ? (
          <>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7d838a]">
              In Scripture
            </p>
            <p className="mt-1 text-sm leading-relaxed text-sage-300">
              {c.echo}
            </p>
          </>
        ) : null}
        <p className="mt-4 border-t border-[#23262b] pt-3 text-[13px] leading-relaxed text-[#7d838a]">
          {FALLEN_STATUS_LINES[c.status]}
        </p>
      </div>
    </article>
  );
}

export default function FallenPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/book/enoch-1"
        className="text-sm font-medium text-sage-400 hover:text-gold-300"
      >
        ← The Book of Enoch
      </Link>

      <div className="mt-6 rounded-2xl border border-[#2b2e33] bg-[#0a0b0d] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f959b]">
          From the Book of Enoch — held next to Scripture, never as Scripture
        </p>
        <h1 className="mt-2 font-display text-3xl text-cream-50 sm:text-4xl">
          The Fallen
        </h1>
        <p className="mt-4 max-w-3xl leading-relaxed text-sage-300">
          In the days of Jared, two hundred angels — the Watchers — descended
          on Mount Hermon, took wives from the daughters of men, and taught
          the secrets that corrupted the earth. The Book of Enoch names their
          leaders, the chiefs of tens. And it does not leave them standing in
          glory. It leaves them bound.
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed text-sage-300">
          So this page is not a gallery. It is the prison the book describes.
          Azazel sits alone in the desert of Dudael, under rough and jagged
          rocks, his face covered that he may not see light. Semjaza and his
          company are bound fast in the valleys of the earth for seventy
          generations, till the day of judgement. And at the end of heaven and
          earth, in an abyss of fire, seven stars are bound for ten thousand
          years.
        </p>
        <p className="mt-3 max-w-3xl font-scripture text-lg italic leading-relaxed text-sage-300">
          &ldquo;The angels which kept not their first estate, but left their
          own habitation, he hath reserved in everlasting chains under
          darkness unto the judgement of the great day.&rdquo;
        </p>
        <p className="mt-1 text-sm text-[#8f959b]">— Jude 6, Scripture&rsquo;s own sentence over them</p>
        <p className="mt-4 max-w-3xl leading-relaxed text-sage-400">
          Two of these portraits are finished and crowned. The rest stand as
          shadow-silhouettes shaped by each one&rsquo;s binding, until his
          portrait is built and crowned and takes its place in his chamber.
          Tap the magnifier on any chamber to look closer.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FALLEN.map((c) => (
          <ChamberCard key={c.slug} c={c} />
        ))}
      </div>

      <p className="mt-12 border-t border-[#23262b] pt-6 text-sm leading-relaxed text-[#7d838a]">
        The fallen are not displayed among{" "}
        <Link href="/characters" className="text-sage-300 underline decoration-[#3a3e44] underline-offset-4 hover:text-cream-100">
          the People of the Bible
        </Link>{" "}
        — that company is not theirs. To read the book that names them,{" "}
        <Link href="/book/enoch-1" className="text-sage-300 underline decoration-[#3a3e44] underline-offset-4 hover:text-cream-100">
          open 1 Enoch
        </Link>
        .
      </p>
    </div>
  );
}
