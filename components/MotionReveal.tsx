"use client";

import { useEffect } from "react";

/**
 * MotionReveal — the app's one scroll-reveal engine.
 *
 * Elements marked with `data-reveal` fade/slide in the first time
 * they enter the viewport. The hidden starting state is applied by
 * CSS only under `html.motion`, and this component adds that class
 * solely after confirming the environment can honor it:
 *   - IntersectionObserver is available, and
 *   - the reader has not requested reduced motion.
 * Otherwise the class is never added and every element stays fully
 * visible — content never depends on animation to appear.
 *
 * A MutationObserver picks up `data-reveal` elements added later by
 * client-side navigation or dynamic content.
 *
 * Trigger timing (retuned Nov 25, 2026): threshold 0 with a 240px
 * bottom rootMargin, so an element starts its fade-rise while it is
 * still below the viewport and is settled — or nearly — by the
 * time the reader's scroll actually arrives. The earlier settings
 * (threshold 0.1, rootMargin −4% bottom) fired late, and on a very
 * tall element 10% of its height is hundreds of pixels: the book
 * grid's first row stayed blank while its wrapper's threshold was
 * still out of reach. Threshold 0 removes that tall-element
 * penalty everywhere; the generous margin removes the wait.
 */
export default function MotionReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    root.classList.add("motion");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px 240px 0px" },
    );

    const watch = (scope: ParentNode) => {
      scope
        .querySelectorAll("[data-reveal]:not(.in)")
        .forEach((el) => io.observe(el));
    };
    watch(document);

    const mo = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            if (node.matches("[data-reveal]")) io.observe(node);
            watch(node);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      root.classList.remove("motion");
    };
  }, []);

  return null;
}
