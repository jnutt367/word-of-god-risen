"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/#old-testament", label: "Old Testament" },
  { href: "/#new-testament", label: "New Testament" },
  { href: "/plans", label: "Plans" },
  { href: "/shorts", label: "Shorts" },
  { href: "/search", label: "Search" },
  { href: "/#more", label: "Apocrypha" },
  { href: "/book/enoch-1", label: "Enoch" },
  { href: "/#more", label: "More to Explore" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-gold-500/15 bg-vineyard-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5"
          aria-label="Word of God Risen — home"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/images/truvine-emblem.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
          />
          <span className="wordmark truncate text-lg sm:text-xl">
            Word of God Risen
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1 sm:gap-2">
            {NAV.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-sage-300 transition-colors hover:bg-vineyard-800 hover:text-gold-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="rounded-lg p-2 text-cream-100 hover:bg-vineyard-800 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile nav panel */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-gold-500/15 bg-vineyard-950/95 px-4 pb-4 pt-2 backdrop-blur lg:hidden"
        >
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-cream-100 transition-colors hover:bg-vineyard-800 hover:text-gold-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
