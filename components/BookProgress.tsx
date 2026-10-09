"use client";

import { useProgress } from "@/components/ProgressProvider";

export default function BookProgress({
  slug,
  total,
}: {
  slug: string;
  total: number;
}) {
  const { readOnPage, listenedOnPage } = useProgress();
  const read = readOnPage(slug).length;
  const listened = listenedOnPage(slug).length;
  const pct = total > 0 ? Math.round((read / total) * 100) : 0;

  if (read === 0 && listened === 0) {
    return (
      <p className="text-sm text-sage-400">
        {total} chapters — your reading progress will grow here.
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm text-sage-300">
        <span className="font-semibold text-gold-300">{read}</span> of {total}{" "}
        chapters read
        {listened > 0 && (
          <>
            {" "}·{" "}
            <span className="font-semibold text-gold-300">{listened}</span>{" "}
            listened
          </>
        )}{" "}
        ({pct}%)
      </p>
      <div className="mt-2 h-2 max-w-md overflow-hidden rounded-full bg-vineyard-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-truvine-green transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
