"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * "Start listening" — a dropdown that lets visitors pick where to begin:
 * Old Testament, New Testament, or Lost Books. Each goes to the first
 * chapter with ?autoplay=1 so Teddy starts reading immediately.
 */
const OPTIONS = [
  { label: "Old Testament", href: "/book/genesis/0?autoplay=1", hint: "Genesis → Malachi" },
  { label: "New Testament", href: "/book/matthew/0?autoplay=1", hint: "Matthew → Revelation" },
  { label: "Lost Books", href: "/book/enoch/0?autoplay=1", hint: "Enoch, Jasher & more" },
];

export default function ListenDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="rounded-lg bg-cream-100 px-6 py-3 text-sm font-semibold text-vineyard-950 transition-colors hover:bg-gold-300"
      >
        <span aria-hidden="true" className="mr-1.5">▶</span> Start listening
        <span aria-hidden="true" className="ml-1.5 text-xs">▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 overflow-hidden rounded-xl border border-gold-500/20 bg-vineyard-900 shadow-2xl"
        >
          {OPTIONS.map((opt) => (
            <Link
              key={opt.label}
              href={opt.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-5 py-3.5 text-left transition-colors hover:bg-vineyard-800"
            >
              <span className="block text-sm font-semibold text-cream-50">
                {opt.label}
              </span>
              <span className="block text-xs text-sage-300">{opt.hint}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
